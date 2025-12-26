'use server'

import { revalidatePath } from 'next/cache'

import { db } from '@/lib/drizzle/db'
import {
  entitiesTable,
  InsertEntitySchema,
  type InsertEntitySchemaType,
} from '@/lib/drizzle/schema'

/*---------------------- Action Result -----------------------*/
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/*---------------------- Create Entity -----------------------*/
export async function createEntity(
  payload: InsertEntitySchemaType
): Promise<ActionResult<{ id: string }>> {
  try {
    /*------------------------ Validation ------------------------*/
    const parsed = InsertEntitySchema.safeParse(payload)

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
    /*---------------------- Error Handling ----------------------*/
    console.error('Create entity error:', error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return {
        success: false,
        error: 'An entity with this name already exists',
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
