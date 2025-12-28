'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '@/lib/drizzle/db'
import { recordsTable } from '@/lib/drizzle/schema'

import type { ActionResult } from './create-record'

/*------------------------ UUID Regex ------------------------*/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/*---------------------- Delete Record -----------------------*/
export async function deleteRecord(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
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
