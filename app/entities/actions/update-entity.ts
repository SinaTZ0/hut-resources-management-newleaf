'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/drizzle/db'
import { entitiesTable, EntitySchema, type EntitySchemaType } from '@/lib/drizzle/schema'

import type { ActionResult } from './create-entity'

/*---------------------- Update Payload ----------------------*/
export type UpdateEntityPayload = EntitySchemaType & { id: string }

/*---------------------- Update Entity -----------------------*/
export async function updateEntity(
  payload: UpdateEntityPayload
): Promise<ActionResult<{ id: string }>> {
  /*------------------------ Validation ------------------------*/
  if (!payload.id || typeof payload.id !== 'string') {
    return {
      success: false,
      error: 'Entity ID is required for update.',
    }
  }

  const parsed = EntitySchema.safeParse(payload)

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!(path in fieldErrors)) {
        fieldErrors[path] = []
      }
      fieldErrors[path].push(issue.message)
    }

    return {
      success: false,
      error: 'Validation failed',
      fieldErrors,
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

  if (error instanceof Error && error.message.includes('unique')) {
    return {
      success: false,
      error: 'An entity with this name already exists.',
    }
  }

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
