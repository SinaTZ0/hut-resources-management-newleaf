'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { DatabaseError } from 'pg'

import { db } from '@/lib/drizzle/db'
import { recordsTable } from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import type { ActionResult } from '@/types-and-schemas/common'

/*---------------------- Delete Record -----------------------*/
export async function deleteRecord(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: 'Invalid record ID',
      }
    }

    /*------------------------- Database -------------------------*/
    const result = await db
      .delete(recordsTable)
      .where(eq(recordsTable.id, id))
      .returning({ id: recordsTable.id })

    if (result.length === 0) {
      return {
        success: false,
        error: 'Record not found or already deleted',
      }
    }

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/records')

    return {
      success: true,
      data: { id: result[0].id },
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    console.error('Delete record error:', error)

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
