'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod/v4'
import { DatabaseError } from 'pg'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  fieldValuesSchema,
  metadataSchema,
  type FieldValues,
} from '@/lib/drizzle/schema'
import { isValidUUID, sanitizeJson } from '@/lib/utils/common-utils'
import { formatZodErrors, type ActionResult } from '@/types-and-schemas/common'

import { createFieldValuesFormSchema } from '../components/records-form/record-form-schema'

/*------------------ Update Payload Schema -------------------*/
const updatePayloadSchema = z.object({
  fieldValues: fieldValuesSchema,
  metadata: metadataSchema.optional(),
})

/*---------------------- Update Record -----------------------*/
export async function updateRecord(id: string, payload: unknown): Promise<ActionResult> {
  try {
    /*----------------------- Validate ID ------------------------*/
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: 'Invalid record ID',
      }
    }

    /*------------------ Validate Base Payload -------------------*/
    const baseParsed = updatePayloadSchema.safeParse(payload)

    if (!baseParsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(baseParsed.error),
      }
    }

    /*-------------- Fetch Existing Record & Entity --------------*/
    const existing = await db
      .select({
        record: recordsTable,
        entityFields: entitiesTable.fields,
      })
      .from(recordsTable)
      .innerJoin(entitiesTable, eq(recordsTable.entityId, entitiesTable.id))
      .where(eq(recordsTable.id, id))
      .limit(1)

    if (existing.length === 0) {
      return {
        success: false,
        error: 'Record not found',
      }
    }

    const { entityFields } = existing[0]

    /*----------- Validate Field Values Against Entity -----------*/
    const fieldValuesSchemaForEntity = createFieldValuesFormSchema(entityFields)
    const fieldValuesParsed = fieldValuesSchemaForEntity.safeParse(baseParsed.data.fieldValues)

    if (!fieldValuesParsed.success) {
      return {
        success: false,
        error: 'Field values validation failed',
        fieldErrors: formatZodErrors(fieldValuesParsed.error),
      }
    }

    /*-------------------- Sanitize Metadata ---------------------*/
    let sanitizedMetadata: Record<string, unknown> | null = null
    try {
      sanitizedMetadata = sanitizeJson(baseParsed.data.metadata)
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Invalid metadata',
      }
    }

    /*------------------------- Database -------------------------*/
    await db
      .update(recordsTable)
      .set({
        fieldValues: fieldValuesParsed.data as FieldValues,
        metadata: sanitizedMetadata,
        updatedAt: new Date(),
      })
      .where(eq(recordsTable.id, id))

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/records')
    revalidatePath(`/records/${id}`)

    return {
      success: true,
      data: undefined,
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    console.error('Update record error:', error)

    // Handle Postgres errors using error codes
    if (error instanceof DatabaseError) {
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
}
