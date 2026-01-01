'use server'

import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { DatabaseError } from 'pg'
import { z } from 'zod/v4'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  fieldValueSchema,
  type FieldValue,
} from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import type { ActionResult } from '@/types-and-schemas/common'

/*-------------------------- Types ---------------------------*/
type UpdateBatchResult = {
  updatedCount: number
  updatedIds: string[]
}

type BatchUpdatePayload = {
  recordIds: string[]
  entityId: string
  fieldKey: string
  fieldValue: FieldValue
  /** When true, removes the field value entirely (only valid for non-required fields) */
  deleteValue?: boolean
}

/*-------------------------- Config --------------------------*/
const MAX_BATCH_SIZE = 100

/*------------------- Batch Update Payload -------------------*/
const batchUpdatePayloadSchema = z.object({
  recordIds: z.array(z.string()).min(1, 'No records selected'),
  entityId: z.string(),
  fieldKey: z.string().min(1, 'Field key is required'),
  fieldValue: fieldValueSchema,
  deleteValue: z.boolean().optional(),
})

/*-------------------- Error Result Type ---------------------*/
type ErrorResult = { success: false; error: string }

type ParsedPayloadResult =
  | { success: true; data: BatchUpdatePayload }
  | { success: false; error: string }

/*-------------------- Action Error Types --------------------*/
const KNOWN_ACTION_ERRORS = new Set([
  'No records found to update',
  'Selected records do not match the selected entity',
])

/*------------------ Payload Parsing Helper ------------------*/
function parseBatchUpdatePayload(payload: BatchUpdatePayload): ParsedPayloadResult {
  const parsed = batchUpdatePayloadSchema.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Validation failed',
    }
  }

  return { success: true, data: parsed.data }
}

/*-------------------- Transaction Helper --------------------*/
async function updateRecordsFieldInTransaction(payload: BatchUpdatePayload): Promise<string[]> {
  const { recordIds, entityId, fieldKey, fieldValue, deleteValue } = payload

  return db.transaction(async (tx) => {
    const existingRecords = await tx
      .select({
        id: recordsTable.id,
        entityId: recordsTable.entityId,
        fieldValues: recordsTable.fieldValues,
      })
      .from(recordsTable)
      .where(inArray(recordsTable.id, recordIds))

    if (existingRecords.length === 0) throw new Error('No records found to update')

    const invalidEntityRecord = existingRecords.find((r) => r.entityId !== entityId)
    if (invalidEntityRecord) {
      throw new Error('Selected records do not match the selected entity')
    }

    const updatedIds: string[] = []

    for (const record of existingRecords) {
      let updatedFieldValues: typeof record.fieldValues

      if (deleteValue) {
        // Remove the field key entirely from fieldValues
        const { [fieldKey]: _removed, ...rest } = record.fieldValues
        updatedFieldValues = rest
      } else {
        // Update with new value
        updatedFieldValues = {
          ...record.fieldValues,
          [fieldKey]: fieldValue,
        }
      }

      await tx
        .update(recordsTable)
        .set({
          fieldValues: updatedFieldValues,
          updatedAt: new Date(),
        })
        .where(eq(recordsTable.id, record.id))

      updatedIds.push(record.id)
    }

    return updatedIds
  })
}

/*-------------------- Validation Helpers --------------------*/
function validateRecordIds(recordIds: string[]): ErrorResult | null {
  const invalidIds = recordIds.filter((id) => !isValidUUID(id))
  if (invalidIds.length > 0) {
    return {
      success: false,
      error: `Invalid record IDs: ${invalidIds.slice(0, 3).join(', ')}${invalidIds.length > 3 ? '...' : ''}`,
    }
  }
  return null
}

function validateFieldConfig(
  fieldConfig:
    | { type: string; label: string; required: boolean; enumOptions?: string[] }
    | undefined,
  fieldKey: string,
  fieldValue: FieldValue,
  deleteValue?: boolean
): ErrorResult | null {
  if (!fieldConfig) {
    return {
      success: false,
      error: `Field "${fieldKey}" does not exist in entity schema`,
    }
  }

  // Handle delete value case
  if (deleteValue) {
    if (fieldConfig.required) {
      return {
        success: false,
        error: `Cannot delete value for required field "${fieldConfig.label}"`,
      }
    }
    // Delete is valid for non-required fields
    return null
  }

  const typeValidation = validateFieldValueType(fieldValue, fieldConfig.type)
  if (!typeValidation.valid) {
    return {
      success: false,
      error: typeValidation.error,
    }
  }

  if (fieldConfig.required && (fieldValue === null || fieldValue === '')) {
    return {
      success: false,
      error: `Field "${fieldConfig.label}" is required and cannot be empty`,
    }
  }

  if (fieldConfig.type === 'enum' && fieldValue !== null) {
    const enumOptions = fieldConfig.enumOptions ?? []
    if (!enumOptions.includes(String(fieldValue))) {
      return {
        success: false,
        error: `Invalid enum value. Must be one of: ${enumOptions.join(', ')}`,
      }
    }
  }

  return null
}

/*-------------- Update Records Field in Batch ---------------*/
export async function updateRecordsFieldBatch(
  payload: BatchUpdatePayload
): Promise<ActionResult<UpdateBatchResult>> {
  try {
    return await updateRecordsFieldBatchImpl(payload)
  } catch (error) {
    return mapBatchUpdateErrorToResult(error)
  }
}

/*------------------- Error Mapping Helper -------------------*/
function mapBatchUpdateErrorToResult(error: unknown): ActionResult<UpdateBatchResult> {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Batch update records field error:', error)
  } else {
    console.error('Batch update records field error')
  }

  if (error instanceof Error && KNOWN_ACTION_ERRORS.has(error.message)) {
    return {
      success: false,
      error: error.message,
    }
  }

  if (error instanceof DatabaseError) {
    if (error.code?.startsWith('08')) {
      return {
        success: false,
        error: 'Database connection failed. Please try again later.',
      }
    }

    if (error.code === '23503') {
      return {
        success: false,
        error:
          'Related data was changed or removed during the update. Please refresh and try again.',
      }
    }

    if (error.code === '40001') {
      return {
        success: false,
        error: 'The update conflicted with another operation. Please try again.',
      }
    }

    if (error.code === '40P01') {
      return {
        success: false,
        error: 'The database was temporarily busy. Please try the update again.',
      }
    }
  }

  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
  }
}

async function updateRecordsFieldBatchImpl(
  payload: BatchUpdatePayload
): Promise<ActionResult<UpdateBatchResult>> {
  /*------------------ Validate Base Payload -------------------*/
  const parsed = parseBatchUpdatePayload(payload)
  if (!parsed.success) return parsed

  const { recordIds, entityId, fieldKey, fieldValue, deleteValue } = parsed.data

  /*------------------- Validate Batch Size --------------------*/
  if (recordIds.length > MAX_BATCH_SIZE) {
    return {
      success: false,
      error: `Cannot update more than ${String(MAX_BATCH_SIZE)} records at once`,
    }
  }

  /*-------------------- Validate Entity ID --------------------*/
  if (!isValidUUID(entityId)) {
    return {
      success: false,
      error: 'Invalid entity ID',
    }
  }

  /*------------------- Validate Record IDs --------------------*/
  const recordIdError = validateRecordIds(recordIds)
  if (recordIdError) return recordIdError

  /*------------------- Fetch Entity Schema --------------------*/
  const entity = await db
    .select({ fields: entitiesTable.fields })
    .from(entitiesTable)
    .where(eq(entitiesTable.id, entityId))
    .limit(1)

  if (entity.length === 0) {
    return {
      success: false,
      error: 'Entity not found',
    }
  }

  const entityFields = entity[0].fields

  /*------------------ Validate Field & Value ------------------*/
  const fieldError = validateFieldConfig(entityFields[fieldKey], fieldKey, fieldValue, deleteValue)
  if (fieldError) return fieldError

  /*---------------- Transaction: Batch Update -----------------*/
  const result = await updateRecordsFieldInTransaction({
    recordIds,
    entityId,
    fieldKey,
    fieldValue,
    deleteValue,
  })

  /*------------------------ Revalidate ------------------------*/
  revalidatePath('/records')

  return {
    success: true,
    data: {
      updatedCount: result.length,
      updatedIds: result,
    },
  }
}

/*--------------- Field Value Type Validation ----------------*/
function validateFieldValueType(
  value: FieldValue,
  expectedType: string
): { valid: true } | { valid: false; error: string } {
  if (value === null) {
    return { valid: true } // null is valid for optional fields
  }

  if (expectedType === 'string' || expectedType === 'enum') {
    return typeof value === 'string'
      ? { valid: true }
      : { valid: false, error: 'Value must be a string' }
  }

  if (expectedType === 'number') {
    return typeof value === 'number' && !Number.isNaN(value)
      ? { valid: true }
      : { valid: false, error: 'Value must be a valid number' }
  }

  if (expectedType === 'boolean') {
    return typeof value === 'boolean'
      ? { valid: true }
      : { valid: false, error: 'Value must be a boolean' }
  }

  if (expectedType === 'date') {
    return isValidDateFieldValue(value)
      ? { valid: true }
      : { valid: false, error: 'Value must be a valid date' }
  }

  return { valid: true }
}

function isValidDateFieldValue(value: FieldValue): boolean {
  if (value instanceof Date) return !Number.isNaN(value.getTime())
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return !Number.isNaN(date.getTime())
  }
  return false
}
