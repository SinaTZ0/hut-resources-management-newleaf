'use server'

import { inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { DatabaseError } from 'pg'

import { db } from '@/lib/drizzle/db'
import { recordsTable } from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import type { ActionResult } from '@/types-and-schemas/common'

/*-------------------------- Types ---------------------------*/
type DeleteBatchResult = {
  deletedCount: number
  deletedIds: string[]
}

/*-------------------------- Config --------------------------*/
const MAX_BATCH_SIZE = 100

/*------------------- Delete Records Batch -------------------*/
export async function deleteRecordsBatch(ids: string[]): Promise<ActionResult<DeleteBatchResult>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!Array.isArray(ids) || ids.length === 0) {
      return {
        success: false,
        error: 'No records selected for deletion',
      }
    }

    if (ids.length > MAX_BATCH_SIZE) {
      return {
        success: false,
        error: `Cannot delete more than ${String(MAX_BATCH_SIZE)} records at once`,
      }
    }

    /*--------------------- Validate All IDs ---------------------*/
    const invalidIds = ids.filter((id) => !isValidUUID(id))
    if (invalidIds.length > 0) {
      return {
        success: false,
        error: `Invalid record IDs: ${invalidIds.slice(0, 3).join(', ')}${invalidIds.length > 3 ? '...' : ''}`,
      }
    }

    /*--------------- Transaction: Delete Records ----------------*/
    const result = await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(recordsTable)
        .where(inArray(recordsTable.id, ids))
        .returning({ id: recordsTable.id })

      return deleted
    })

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/records')

    return {
      success: true,
      data: {
        deletedCount: result.length,
        deletedIds: result.map((r) => r.id),
      },
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    if (process.env.NODE_ENV !== 'production') {
      console.error('Batch delete records error:', error)
    } else {
      console.error('Batch delete records error')
    }

    if (error instanceof DatabaseError) {
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
