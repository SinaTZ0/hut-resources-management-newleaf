'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/drizzle/db'
import { entitiesTable } from '@/lib/drizzle/schema'

import type { ActionResult } from './create-entity'

/*------------------------ UUID Regex ------------------------*/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/*---------------------- Delete Entity -----------------------*/
export async function deleteEntity(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
      return {
        success: false,
        error: 'Invalid entity ID',
      }
    }

    /*------------------------- Database -------------------------*/
    const result = await db
      .delete(entitiesTable)
      .where(eq(entitiesTable.id, id))
      .returning({ id: entitiesTable.id })

    if (result.length === 0) {
      return {
        success: false,
        error: 'Entity not found or already deleted',
      }
    }

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/entities')

    return {
      success: true,
      data: { id: result[0].id },
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    console.error('Delete entity error:', error)

    // Handle foreign key constraint violation
    if (error instanceof Error && error.message.includes('foreign key')) {
      return {
        success: false,
        error: 'Cannot delete entity. It is referenced by other records.',
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
