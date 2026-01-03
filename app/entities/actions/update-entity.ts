'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { DatabaseError } from 'pg'
import { z } from 'zod/v4'

import { db } from '@/lib/drizzle/db'
import {
  entitiesTable,
  recordsTable,
  insertEntitySchema,
  type InsertEntitySchema,
  type FieldValue,
  type FieldValues,
  type FieldsSchema,
} from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import {
  formatZodErrors,
  MAX_FIELDS_PER_ENTITY,
  type ActionResult,
} from '@/types-and-schemas/common'

/*---------------------- Update Payload ----------------------*/
export type UpdateEntityPayload = InsertEntitySchema & {
  id: string
  /** Default values for new required fields (only used during edit) */
  defaultValues?: Record<string, FieldValue>
}

/*---------------- Prototype Pollution Guard -----------------*/
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function isForbiddenObjectKey(key: string): boolean {
  return FORBIDDEN_OBJECT_KEYS.has(key)
}

function normalizeFieldValues(raw: unknown): FieldValues {
  if (raw === null || raw === undefined) return {}
  if (typeof raw !== 'object') return {}
  if (Array.isArray(raw)) return {}
  return raw as FieldValues
}

/*---------- Helper: Apply Default Values to Record ----------*/
function applyDefaultsToRecord(
  fieldValues: FieldValues,
  defaultValues: Record<string, FieldValue>,
  newEnumFields: Array<[string, FieldValue]>
): { updated: FieldValues; needsUpdate: boolean } {
  const updated: FieldValues = {}
  for (const [k, v] of Object.entries(fieldValues)) {
    if (!isForbiddenObjectKey(k)) updated[k] = v
  }
  let needsUpdate = false

  // Apply explicit default values
  for (const [fieldKey, defaultValue] of Object.entries(defaultValues)) {
    if (isForbiddenObjectKey(fieldKey)) continue
    const hasValue = Object.prototype.hasOwnProperty.call(updated, fieldKey)
    const isNullish = updated[fieldKey] == null
    if (!hasValue || isNullish) {
      updated[fieldKey] = defaultValue
      needsUpdate = true
    }
  }

  // Apply enum defaults
  for (const [fieldKey, defaultValue] of newEnumFields) {
    if (isForbiddenObjectKey(fieldKey)) continue
    const hasValue = Object.prototype.hasOwnProperty.call(updated, fieldKey)
    const isNullish = updated[fieldKey] == null
    if (!hasValue || isNullish) {
      updated[fieldKey] = defaultValue
      needsUpdate = true
    }
  }

  return { updated, needsUpdate }
}

/*------- Helper: Remove Orphaned Field Values from Record -------*/
function removeOrphanedFieldValues(
  fieldValues: FieldValues,
  validFieldKeys: Set<string>
): { updated: FieldValues; needsUpdate: boolean } {
  const updated: FieldValues = {}
  let needsUpdate = false

  for (const [fieldKey, value] of Object.entries(fieldValues)) {
    if (isForbiddenObjectKey(fieldKey)) {
      needsUpdate = true
      continue
    }
    if (validFieldKeys.has(fieldKey)) {
      updated[fieldKey] = value
    } else {
      // Field was deleted from entity schema
      needsUpdate = true
    }
  }

  return { updated, needsUpdate }
}

function isMissingRequiredDefaultValue(value: FieldValue | undefined): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string' && value.trim() === '') return true
  return false
}

function parseDefaultValueByFieldType(args: {
  fieldType: FieldsSchema[string]['type']
  raw: FieldValue | undefined
}): FieldValue | null {
  const { fieldType, raw } = args

  if (raw === undefined) return null

  switch (fieldType) {
    case 'string': {
      const parsed = z.string().safeParse(raw)
      return parsed.success ? parsed.data : null
    }
    case 'number': {
      const parsed = z.number().safeParse(raw)
      return parsed.success ? parsed.data : null
    }
    case 'boolean': {
      const parsed = z.boolean().safeParse(raw)
      return parsed.success ? parsed.data : null
    }
    case 'date': {
      const parsed = z.coerce.date().safeParse(raw)
      return parsed.success ? parsed.data : null
    }
    case 'enum':
      return null
    default:
      return null
  }
}

type BackfillDecision =
  | { kind: 'enumDefault'; value: FieldValue }
  | { kind: 'sanitized'; value: FieldValue }
  | { kind: 'missing' }
  | { kind: 'invalid' }

function getBackfillDecisionForNewRequiredField(args: {
  field: FieldsSchema[string]
  raw: FieldValue | undefined
}): BackfillDecision {
  const { field, raw } = args

  if (field.type === 'enum') {
    const enumOptions = field.enumOptions
    if (!enumOptions || enumOptions.length === 0) return { kind: 'missing' }
    if (isMissingRequiredDefaultValue(raw)) return { kind: 'missing' }
    if (typeof raw !== 'string') return { kind: 'invalid' }
    if (!enumOptions.includes(raw)) return { kind: 'invalid' }
    return { kind: 'enumDefault', value: raw }
  }

  if (isMissingRequiredDefaultValue(raw)) {
    return { kind: 'missing' }
  }

  const parsedValue = parseDefaultValueByFieldType({ fieldType: field.type, raw })
  if (parsedValue === null) {
    return { kind: 'invalid' }
  }

  return { kind: 'sanitized', value: parsedValue }
}

/*------- Helper: Validate and Sanitize Defaults for Backfill -------*/
function sanitizeDefaultsForNewRequiredFields(args: {
  fields: FieldsSchema
  existingFields: FieldsSchema
  rawDefaultValues?: Record<string, FieldValue>
}):
  | {
      success: true
      sanitizedDefaultValues: Record<string, FieldValue>
      newEnumFields: Array<[string, FieldValue]>
    }
  | { success: false; error: string } {
  const { fields, existingFields, rawDefaultValues } = args

  const newEnumFields: Array<[string, FieldValue]> = []
  const sanitizedDefaultValues: Record<string, FieldValue> = {}
  const missingDefaults: string[] = []
  const invalidDefaults: string[] = []

  for (const [fieldKey, field] of Object.entries(fields)) {
    const hadFieldBefore = Object.prototype.hasOwnProperty.call(existingFields, fieldKey)
    const wasRequiredBefore = hadFieldBefore ? existingFields[fieldKey].required : false
    const isNewlyRequired = field.required && !wasRequiredBefore
    if (!isNewlyRequired) continue

    const decision = getBackfillDecisionForNewRequiredField({
      field,
      raw: rawDefaultValues?.[fieldKey],
    })

    switch (decision.kind) {
      case 'enumDefault':
        newEnumFields.push([fieldKey, decision.value])
        break
      case 'sanitized':
        sanitizedDefaultValues[fieldKey] = decision.value
        break
      case 'missing':
        missingDefaults.push(fieldKey)
        break
      case 'invalid':
        invalidDefaults.push(fieldKey)
        break
    }
  }

  if (missingDefaults.length > 0) {
    return {
      success: false,
      error: `Default values are required for new required fields: ${missingDefaults.join(', ')}`,
    }
  }

  if (invalidDefaults.length > 0) {
    return {
      success: false,
      error: `Invalid default values provided for fields: ${invalidDefaults.join(', ')}`,
    }
  }

  return { success: true, sanitizedDefaultValues, newEnumFields }
}

/*---------------------- Update Entity -----------------------*/
export async function updateEntity(
  payload: UpdateEntityPayload
): Promise<ActionResult<{ id: string }>> {
  /*------------------------ Validation ------------------------*/
  if (!isValidUUID(payload.id)) {
    return {
      success: false,
      error: 'Invalid entity ID',
    }
  }

  // Only validate the entity data, not the extra fields like id and defaultValues
  const entityData = {
    name: payload.name,
    description: payload.description,
    fields: payload.fields,
  }
  const parsed = insertEntitySchema.safeParse(entityData)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: formatZodErrors(parsed.error),
    }
  }

  /*-------------------- Input Size Limits ---------------------*/
  const fieldCount = Object.keys(parsed.data.fields).length
  if (fieldCount > MAX_FIELDS_PER_ENTITY) {
    return {
      success: false,
      error: `Maximum ${String(MAX_FIELDS_PER_ENTITY)} fields allowed per entity`,
    }
  }

  try {
    /*------------------- Check Entity Exists --------------------*/
    const existing = await db
      .select({ id: entitiesTable.id, fields: entitiesTable.fields })
      .from(entitiesTable)
      .where(eq(entitiesTable.id, payload.id))
      .limit(1)

    if (existing.length === 0) {
      return {
        success: false,
        error: 'Entity not found.',
      }
    }

    const existingFields = existing[0].fields
    const existingFieldKeys = new Set(Object.keys(existingFields))

    /*-------- Validate + sanitize defaults for backfill --------*/
    const defaultsResult = sanitizeDefaultsForNewRequiredFields({
      fields: parsed.data.fields,
      existingFields,
      rawDefaultValues: payload.defaultValues,
    })

    if (!defaultsResult.success) {
      return {
        success: false,
        error: defaultsResult.error,
      }
    }

    /*------------ Detect Deleted Fields for Cleanup -------------*/
    const newFieldKeys = new Set(Object.keys(parsed.data.fields))
    const deletedFieldKeys = [...existingFieldKeys].filter((key) => !newFieldKeys.has(key))
    const hasDeletedFields = deletedFieldKeys.length > 0

    /*----------- Use Transaction for Entity + Records -----------*/
    const result = await db.transaction(async (tx) => {
      /*---------------------- Update Entity -----------------------*/
      const entityResult = await tx
        .update(entitiesTable)
        .set({
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          fields: parsed.data.fields,
          updatedAt: new Date(),
        })
        .where(eq(entitiesTable.id, payload.id))
        .returning({ id: entitiesTable.id })

      if (entityResult.length === 0) {
        throw new Error('Failed to update entity.')
      }

      const hasDefaultsToApply =
        Object.keys(defaultsResult.sanitizedDefaultValues).length > 0 ||
        defaultsResult.newEnumFields.length > 0

      /*--------- Update Records: Apply Defaults & Remove Orphaned Fields ---------*/
      if (hasDefaultsToApply || hasDeletedFields) {
        const records = await tx
          .select({ id: recordsTable.id, fieldValues: recordsTable.fieldValues })
          .from(recordsTable)
          .where(eq(recordsTable.entityId, payload.id))

        for (const record of records) {
          let currentFieldValues = normalizeFieldValues(record.fieldValues)
          let needsUpdate = false

          // Step 1: Remove orphaned field values (fields that were deleted)
          if (hasDeletedFields) {
            const orphanResult = removeOrphanedFieldValues(currentFieldValues, newFieldKeys)
            if (orphanResult.needsUpdate) {
              currentFieldValues = orphanResult.updated
              needsUpdate = true
            }
          }

          // Step 2: Apply default values for new required fields
          if (hasDefaultsToApply) {
            const defaultsApplyResult = applyDefaultsToRecord(
              currentFieldValues,
              defaultsResult.sanitizedDefaultValues,
              defaultsResult.newEnumFields
            )
            if (defaultsApplyResult.needsUpdate) {
              currentFieldValues = defaultsApplyResult.updated
              needsUpdate = true
            }
          }

          if (needsUpdate) {
            await tx
              .update(recordsTable)
              .set({ fieldValues: currentFieldValues, updatedAt: new Date() })
              .where(eq(recordsTable.id, record.id))
          }
        }
      }

      return entityResult[0]
    })

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/entities')
    revalidatePath(`/entities/${payload.id}/edit`)
    revalidatePath('/records')

    return {
      success: true,
      data: { id: result.id },
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    return handleUpdateError(error)
  }
}

/*---------------------- Error Handler -----------------------*/
function handleUpdateError(error: unknown): ActionResult<{ id: string }> {
  // Handle Postgres errors using error codes
  if (error instanceof DatabaseError) {
    // 23505 = unique_violation
    if (error.code === '23505') {
      return {
        success: false,
        error: 'An entity with this name already exists.',
      }
    }
    // 08xxx = connection exceptions
    if (error.code?.startsWith('08')) {
      return {
        success: false,
        error: 'Database connection failed. Please try again later.',
      }
    }
  }

  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
  }
}
