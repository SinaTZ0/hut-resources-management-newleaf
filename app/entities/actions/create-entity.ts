'use server'

import { revalidatePath } from 'next/cache'
import { DatabaseError } from 'pg'

import { db } from '@/lib/drizzle/db'
import { entitiesTable, insertEntitySchema, type InsertEntitySchema } from '@/lib/drizzle/schema'
import {
  formatZodErrors,
  MAX_FIELDS_PER_ENTITY,
  type ActionResult,
} from '@/types-and-schemas/common'

/*------------------------- Helpers --------------------------*/

function handleDatabaseError(error: unknown): ActionResult<never> {
  console.error('Database error:', error)

  if (error instanceof DatabaseError) {
    // 23505 = unique_violation
    if (error.code === '23505') {
      return {
        success: false,
        error: 'An entity with this name already exists',
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

/*---------------------- Create Entity -----------------------*/
export async function createEntity(
  payload: InsertEntitySchema
): Promise<ActionResult<{ id: string }>> {
  try {
    /*------------------------ Validation ------------------------*/
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

    /*------------------------- Database -------------------------*/
    const result = await db
      .insert(entitiesTable)
      .values({
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        fields: parsed.data.fields,
      })
      .returning({ id: entitiesTable.id })

    const inserted = result[0]

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/entities')

    return {
      success: true,
      data: { id: inserted.id },
    }
  } catch (error) {
    return handleDatabaseError(error)
  }
}
