'use server'

import { revalidatePath } from 'next/cache'
import { inArray } from 'drizzle-orm'
import { DatabaseError } from 'pg'
import { z } from 'zod/v4'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  insertRecordSchema,
  type InsertRecordSchema,
  type FieldValues,
  type FieldsSchema,
} from '@/lib/drizzle/schema'
import {
  sanitizeJson,
  isValidUUID,
  validateJsonSize,
  MAX_METADATA_SIZE,
} from '@/lib/utils/common-utils'
import { formatZodErrors, type ActionResult } from '@/types-and-schemas/common'

import {
  createFieldValuesFormSchema,
  stripEmptyNonRequiredFieldValues,
} from '../components/records-form/record-form-schema'

/*-------------------------- Types ---------------------------*/
type BatchRecordPayload = Omit<InsertRecordSchema, 'metadata'> & {
  metadata: Record<string, unknown> | null
}

type BatchCreatePayload = {
  records: BatchRecordPayload[]
}

type FailedRecord = {
  index: number
  error: string
  fieldErrors?: Record<string, string[]>
}

type BatchCreateResult = ActionResult<{ ids: string[]; count: number }> & {
  failedRecords?: FailedRecord[]
}

type ValidatedRecord = {
  entityId: string
  fieldValues: FieldValues
  metadata: Record<string, unknown> | null
}

type ValidationResult =
  | { success: true; data: ValidatedRecord }
  | { success: false; error: FailedRecord }

/*------------------------ Constants -------------------------*/
const MAX_BATCH_SIZE = 100
const MIN_BATCH_SIZE = 1

/*-------------------- Validation Schema ---------------------*/
const batchCreatePayloadSchema = z.strictObject({
  records: z
    .array(insertRecordSchema)
    .min(MIN_BATCH_SIZE, { message: 'At least one record is required' })
    .max(MAX_BATCH_SIZE, { message: `Maximum ${String(MAX_BATCH_SIZE)} records per batch` }),
})

/*-------------- Validate Single Record Helper ---------------*/
function validateRecord(
  record: InsertRecordSchema,
  index: number,
  entityFields: FieldsSchema
): ValidationResult {
  /*------------------ Validate Field Values -------------------*/
  const fieldValuesSchema = createFieldValuesFormSchema(entityFields)
  const fieldValuesParsed = fieldValuesSchema.safeParse(record.fieldValues)

  if (!fieldValuesParsed.success) {
    return {
      success: false,
      error: {
        index,
        error: 'Field values validation failed',
        fieldErrors: formatZodErrors(fieldValuesParsed.error, 'fieldValues'),
      },
    }
  }

  /*------------------ Validate Metadata Size ------------------*/
  if (record.metadata !== null) {
    try {
      const stringified = JSON.stringify(record.metadata)
      if (!validateJsonSize(stringified, MAX_METADATA_SIZE)) {
        return {
          success: false,
          error: {
            index,
            error: `Metadata exceeds maximum size (${String(MAX_METADATA_SIZE / 1024)}KB)`,
          },
        }
      }
    } catch {
      return {
        success: false,
        error: {
          index,
          error: 'Invalid metadata',
        },
      }
    }
  }

  /*-------------------- Sanitize Metadata ---------------------*/
  let sanitizedMetadata: Record<string, unknown> | null = null
  try {
    sanitizedMetadata = sanitizeJson(record.metadata)
  } catch (e) {
    return {
      success: false,
      error: {
        index,
        error: e instanceof Error ? e.message : 'Invalid metadata',
      },
    }
  }

  /*---------- Strip Empty Non-Required Field Values -----------*/
  const cleanedFieldValues = stripEmptyNonRequiredFieldValues(
    fieldValuesParsed.data as FieldValues,
    entityFields
  )

  return {
    success: true,
    data: {
      entityId: record.entityId,
      fieldValues: cleanedFieldValues,
      metadata: sanitizedMetadata,
    },
  }
}

/*--------------- Handle Database Error Helper ---------------*/
function handleDatabaseError(error: DatabaseError): BatchCreateResult {
  // 23503 = foreign_key_violation
  if (error.code === '23503') {
    return {
      success: false,
      error: 'One or more entities no longer exist. Please refresh and try again.',
    }
  }

  // 08xxx = connection exceptions
  if (error.code?.startsWith('08')) {
    return {
      success: false,
      error: 'Database connection failed. Please try again later.',
    }
  }

  // 40001 = serialization_failure (transaction conflict)
  if (error.code === '40001') {
    return {
      success: false,
      error: 'Transaction conflict. Please try again.',
    }
  }

  // 40P01 = deadlock_detected
  if (error.code === '40P01') {
    return {
      success: false,
      error: 'Database deadlock detected. Please try again.',
    }
  }

  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
  }
}

/*---------------- Validate Batch Size Helper ----------------*/
function validateBatchSize(
  recordsLength: number
): { valid: true } | { valid: false; error: BatchCreateResult } {
  if (recordsLength === 0) {
    return { valid: false, error: { success: false, error: 'At least one record is required' } }
  }

  if (recordsLength > MAX_BATCH_SIZE) {
    return {
      valid: false,
      error: {
        success: false,
        error: `Maximum ${String(MAX_BATCH_SIZE)} records per batch. Received ${String(recordsLength)}.`,
      },
    }
  }

  return { valid: true }
}

/*---------------- Validate Entity IDs Helper ----------------*/
function validateEntityIds(
  entityIds: string[]
): { valid: true } | { valid: false; error: BatchCreateResult } {
  const invalidEntityIds = entityIds.filter((id) => !isValidUUID(id))
  if (invalidEntityIds.length > 0) {
    return {
      valid: false,
      error: {
        success: false,
        error: `Invalid entity ID format: ${invalidEntityIds.join(', ')}`,
      },
    }
  }
  return { valid: true }
}

/*---------- Validate Records Against Schema Helper ----------*/
function validateRecordsAgainstSchema(
  records: InsertRecordSchema[],
  entityMap: Map<string, FieldsSchema>
): { validatedRecords: ValidatedRecord[]; failedRecords: FailedRecord[] } {
  const failedRecords: FailedRecord[] = []
  const validatedRecords: ValidatedRecord[] = []

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    const entityFields = entityMap.get(record.entityId)

    if (!entityFields) {
      failedRecords.push({ index: i, error: 'Entity not found' })
      continue
    }

    const result = validateRecord(record, i, entityFields)
    if (result.success) {
      validatedRecords.push(result.data)
    } else {
      failedRecords.push(result.error)
    }
  }

  return { validatedRecords, failedRecords }
}

/*----------------- Revalidate Paths Helper ------------------*/
function revalidateRecordPaths(entityIds: string[]): void {
  revalidatePath('/records')
  for (const entityId of entityIds) {
    revalidatePath(`/entities/${entityId}`)
  }
}

/*--------------------- Log Error Helper ---------------------*/
function logError(error: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('Batch create records error:', error)
  } else {
    const errorType = error instanceof Error ? error.constructor.name : 'UnknownError'
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[createRecordsBatch] ${errorType}: ${errorMessage}`)
  }
}

/*--------------- Create Records Batch Action ----------------*/
export async function createRecordsBatch(payload: BatchCreatePayload): Promise<BatchCreateResult> {
  try {
    /*------------------- Validate Batch Size --------------------*/
    const batchSizeValidation = validateBatchSize(payload.records.length)
    if (!batchSizeValidation.valid) {
      return batchSizeValidation.error
    }

    /*------------------ Base Schema Validation ------------------*/
    const baseParsed = batchCreatePayloadSchema.safeParse(payload)
    if (!baseParsed.success) {
      return {
        success: false,
        error: 'Batch validation failed',
        fieldErrors: formatZodErrors(baseParsed.error),
      }
    }

    const records = baseParsed.data.records
    const entityIds = [...new Set(records.map((r) => r.entityId))]

    /*----------------- Validate All Entity IDs ------------------*/
    const entityIdValidation = validateEntityIds(entityIds)
    if (!entityIdValidation.valid) {
      return entityIdValidation.error
    }

    /*--------------- Fetch All Required Entities ----------------*/
    const entities = await db
      .select({ id: entitiesTable.id, fields: entitiesTable.fields })
      .from(entitiesTable)
      .where(inArray(entitiesTable.id, entityIds))

    const entityMap = new Map<string, FieldsSchema>(entities.map((e) => [e.id, e.fields]))

    /*--------------- Validate All Entities Exist ----------------*/
    const missingEntityIds = entityIds.filter((id) => !entityMap.has(id))
    if (missingEntityIds.length > 0) {
      return { success: false, error: `Entity not found: ${missingEntityIds.join(', ')}` }
    }

    /*----------- Validate Each Record's Field Values ------------*/
    const { validatedRecords, failedRecords } = validateRecordsAgainstSchema(records, entityMap)

    if (failedRecords.length > 0) {
      return {
        success: false,
        error: `${String(failedRecords.length)} record(s) failed validation`,
        failedRecords,
      }
    }

    /*---------------- Execute Atomic Transaction ----------------*/
    const insertedRecords = await db.transaction(async (tx) => {
      return tx
        .insert(recordsTable)
        .values(
          validatedRecords.map((record) => ({
            entityId: record.entityId,
            fieldValues: record.fieldValues,
            metadata: record.metadata,
          }))
        )
        .returning({ id: recordsTable.id })
    })

    const insertedIds = insertedRecords.map((r) => r.id)

    /*--------------------- Revalidate Paths ---------------------*/
    revalidateRecordPaths(entityIds)

    return { success: true, data: { ids: insertedIds, count: insertedIds.length } }
  } catch (error) {
    logError(error)

    if (error instanceof DatabaseError) {
      return handleDatabaseError(error)
    }

    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
