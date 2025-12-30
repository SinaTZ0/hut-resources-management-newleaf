'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { DatabaseError } from 'pg'

import { db } from '@/lib/drizzle/db'
import { entitiesTable, insertEntitySchema, type InsertEntitySchema } from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import {
  formatZodErrors,
  MAX_FIELDS_PER_ENTITY,
  type ActionResult,
} from '@/types-and-schemas/common'

/*---------------------- Update Payload ----------------------*/
export type UpdateEntityPayload = InsertEntitySchema & { id: string }

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

  const parsed = insertEntitySchema.safeParse(payload)

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
      .select({ id: entitiesTable.id })
      .from(entitiesTable)
      .where(eq(entitiesTable.id, payload.id))
      .limit(1)

    if (existing.length === 0) {
      return {
        success: false,
        error: 'Entity not found.',
      }
    }

    /*------------------------- Database -------------------------*/
    const result = await db
      .update(entitiesTable)
      .set({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        fields: parsed.data.fields,
        updatedAt: new Date(),
      })
      .where(eq(entitiesTable.id, payload.id))
      .returning({ id: entitiesTable.id })

    if (result.length === 0) {
      return {
        success: false,
        error: 'Failed to update entity.',
      }
    }

    const updated = result[0]

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/entities')
    revalidatePath(`/entities/${payload.id}/edit`)

    return {
      success: true,
      data: { id: updated.id },
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
