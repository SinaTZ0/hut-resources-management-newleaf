'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { z } from 'zod/v4'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  fieldValuesSchema,
  metadataSchema,
  type FieldValues,
} from '@/lib/drizzle/schema'

import { createFieldValuesFormSchema } from '../components/records-form/schema'

import type { ActionResult } from './create-record'

/*------------------------ UUID Regex ------------------------*/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/*------------------ Update Payload Schema -------------------*/
const updatePayloadSchema = z.object({
  fieldValues: fieldValuesSchema,
  metadata: metadataSchema.optional(),
})

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

  if (typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Metadata must be a JSON object')
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    sanitized[key] = value
  }

  return sanitized
}

/*---------------------- Update Record -----------------------*/
export async function updateRecord(id: string, payload: unknown): Promise<ActionResult> {
  try {
    /*----------------------- Validate ID ------------------------*/
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
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
