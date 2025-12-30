'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { DatabaseError } from 'pg'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  insertRecordSchema,
  type InsertRecordSchema,
  type FieldValues,
} from '@/lib/drizzle/schema'
import { sanitizeJson } from '@/lib/utils/common-utils'
import { formatZodErrors, type ActionResult } from '@/types-and-schemas/common'

import { createFieldValuesFormSchema } from '../components/records-form/record-form-schema'

/*---------------------- Create Record -----------------------*/
export async function createRecord(
  payload: InsertRecordSchema
): Promise<ActionResult<{ id: string }>> {
  try {
    /*--------------------- Base Validation ----------------------*/
    const baseParsed = insertRecordSchema.safeParse(payload)

    if (!baseParsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(baseParsed.error),
      }
    }

    /*------------------- Fetch Entity Schema --------------------*/
    const entities = await db
      .select({ fields: entitiesTable.fields })
      .from(entitiesTable)
      .where(eq(entitiesTable.id, baseParsed.data.entityId))
      .limit(1)

    if (entities.length === 0) {
      return {
        success: false,
        error: 'Entity not found',
      }
    }

    const entity = entities[0]

    /*------------------ Validate Field Values -------------------*/
    const fieldValuesSchemaForEntity = createFieldValuesFormSchema(entity.fields)
    const fieldValuesParsed = fieldValuesSchemaForEntity.safeParse(baseParsed.data.fieldValues)

    if (!fieldValuesParsed.success) {
      return {
        success: false,
        error: 'Field values validation failed',
        fieldErrors: formatZodErrors(fieldValuesParsed.error, 'fieldValues'),
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
    const result = await db
      .insert(recordsTable)
      .values({
        entityId: baseParsed.data.entityId,
        fieldValues: fieldValuesParsed.data as FieldValues,
        metadata: sanitizedMetadata,
      })
      .returning({ id: recordsTable.id })

    const inserted = result[0]

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/records')
    revalidatePath(`/entities/${baseParsed.data.entityId}`)

    return {
      success: true,
      data: { id: inserted.id },
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    console.error('Create record error:', error)

    // Handle Postgres errors using error codes
    if (error instanceof DatabaseError) {
      // 23503 = foreign_key_violation
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Invalid entity reference',
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
}
