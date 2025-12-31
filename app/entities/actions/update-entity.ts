'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { DatabaseError } from 'pg'

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

/*---------- Helper: Apply Default Values to Record ----------*/
function applyDefaultsToRecord(
  fieldValues: FieldValues,
  defaultValues: Record<string, FieldValue>,
  newEnumFields: Array<[string, FieldValue]>
): { updated: FieldValues; needsUpdate: boolean } {
  const updated: FieldValues = { ...fieldValues }
  let needsUpdate = false

  // Apply explicit default values
  for (const [fieldKey, defaultValue] of Object.entries(defaultValues)) {
    if (!(fieldKey in updated) || updated[fieldKey] === null) {
      updated[fieldKey] = defaultValue
      needsUpdate = true
    }
  }

  // Apply enum defaults
  for (const [fieldKey, defaultValue] of newEnumFields) {
    if (!(fieldKey in updated) || updated[fieldKey] === null) {
      updated[fieldKey] = defaultValue
      needsUpdate = true
    }
  }

  return { updated, needsUpdate }
}

/*------------ Helper: Get New Enum Fields with Defaults -----------*/
function getNewEnumFieldsWithDefaults(
  fields: FieldsSchema,
  existingFieldKeys: Set<string>
): Array<[string, FieldValue]> {
  const result: Array<[string, FieldValue]> = []

  for (const [fieldKey, field] of Object.entries(fields)) {
    const hasEnumOptions = field.enumOptions && field.enumOptions.length > 0
    const isNewRequiredEnum =
      field.required && field.type === 'enum' && hasEnumOptions && !existingFieldKeys.has(fieldKey)

    if (isNewRequiredEnum && field.enumOptions) {
      result.push([fieldKey, field.enumOptions[0]])
    }
  }

  return result
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

  /*---------- Validate Required Fields Have Defaults ----------*/
  const requiredFieldsWithoutDefaults = Object.entries(parsed.data.fields)
    .filter(([key, field]) => {
      if (!field.required) return false
      // Enum fields use first option as default
      if (field.type === 'enum' && field.enumOptions && field.enumOptions.length > 0) return false
      // Check if default value is provided
      return payload.defaultValues?.[key] === undefined
    })
    .map(([key]) => key)

  // Note: We only need defaults for NEW required fields, which we'll determine below

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

    /*----------- Identify New Required Fields Without Defaults -----------*/
    const newRequiredFieldsNeedingDefaults = requiredFieldsWithoutDefaults.filter(
      (key) => !existingFieldKeys.has(key)
    )

    if (newRequiredFieldsNeedingDefaults.length > 0) {
      return {
        success: false,
        error: `Default values are required for new required fields: ${newRequiredFieldsNeedingDefaults.join(', ')}`,
      }
    }

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

      /*---------- Get new enum fields that need defaults ----------*/
      const newEnumFields = getNewEnumFieldsWithDefaults(parsed.data.fields, existingFieldKeys)
      const hasDefaultsToApply =
        (payload.defaultValues && Object.keys(payload.defaultValues).length > 0) ||
        newEnumFields.length > 0

      /*--------- Update Records with Default Values for New Fields ---------*/
      if (hasDefaultsToApply) {
        const records = await tx
          .select({ id: recordsTable.id, fieldValues: recordsTable.fieldValues })
          .from(recordsTable)
          .where(eq(recordsTable.entityId, payload.id))

        for (const record of records) {
          const { updated, needsUpdate } = applyDefaultsToRecord(
            record.fieldValues,
            payload.defaultValues ?? {},
            newEnumFields
          )

          if (needsUpdate) {
            await tx
              .update(recordsTable)
              .set({ fieldValues: updated, updatedAt: new Date() })
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
  console.error('Update entity error:', error)

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
