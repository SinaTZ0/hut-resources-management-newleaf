'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod/v4'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  InsertRecordSchema,
  type InsertRecordSchemaType,
  type FieldValues,
} from '@/lib/drizzle/schema'

import { createFieldValuesFormSchema } from '../components/records-form/schema'

/*---------------------- Action Result -----------------------*/
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/*-------------------- Format Zod Errors ---------------------*/
function formatZodErrors(error: z.ZodError, prefix?: string): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = prefix ? `${prefix}.${issue.path.join('.')}` : issue.path.join('.')
    if (!(path in fieldErrors)) {
      fieldErrors[path] = []
    }
    fieldErrors[path].push(issue.message)
  }

  return fieldErrors
}

/*---------------------- Sanitize JSON -----------------------*/
function sanitizeJson(input: unknown): Record<string, unknown> | null {
  if (input === null || input === undefined) return null

  // Ensure it's an object (not array, not primitive)
  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Metadata must be a JSON object')
  }

  // Remove __proto__ and constructor attacks
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    sanitized[key] = value
  }

  return sanitized
}

/*---------------------- Create Record -----------------------*/
export async function createRecord(
  payload: InsertRecordSchemaType
): Promise<ActionResult<{ id: string }>> {
  try {
    /*--------------------- Base Validation ----------------------*/
    const baseParsed = InsertRecordSchema.safeParse(payload)

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

    // Handle foreign key constraint violation
    if (error instanceof Error && error.message.includes('foreign key')) {
      return {
        success: false,
        error: 'Invalid entity reference',
      }
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('connect')) {
      return {
        success: false,
        error: 'Database connection failed. Please try again later.',
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}
