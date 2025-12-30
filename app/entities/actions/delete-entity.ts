'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { DatabaseError } from 'pg'

import { db } from '@/lib/drizzle/db'
import { entitiesTable } from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import type { ActionResult } from '@/types-and-schemas/common'

/*---------------------- Delete Entity -----------------------*/
export async function deleteEntity(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(id)) {
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

    // Handle Postgres errors using error codes
    if (error instanceof DatabaseError) {
      // 23503 = foreign_key_violation
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Cannot delete entity. It is referenced by other records.',
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
