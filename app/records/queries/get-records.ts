'use server'

import { eq, desc } from 'drizzle-orm'
import type { Simplify } from 'type-fest'

import { db } from '@/lib/drizzle/db'
import { recordsTable, entitiesTable, type RecordSchema } from '@/lib/drizzle/schema'
import type { QueryResult } from '@/types-and-schemas/common'

/*-------------------------- Types ---------------------------*/
type GetRecordsOptions = {
  entityId?: string
  limit?: number
  offset?: number
}

export type RecordWithEntity = Simplify<
  RecordSchema & {
    entityName: string
  }
>

/*----------------------- Get Records ------------------------*/
export async function getRecords(
  options: GetRecordsOptions = {}
): Promise<QueryResult<RecordWithEntity[]>> {
  try {
    const { entityId, limit = 50, offset = 0 } = options

    /*------------------------- Database -------------------------*/
    let query = db
      .select({
        id: recordsTable.id,
        entityId: recordsTable.entityId,
        entityName: entitiesTable.name,
        fieldValues: recordsTable.fieldValues,
        metadata: recordsTable.metadata,
        createdAt: recordsTable.createdAt,
        updatedAt: recordsTable.updatedAt,
      })
      .from(recordsTable)
      .innerJoin(entitiesTable, eq(recordsTable.entityId, entitiesTable.id))
      .orderBy(desc(recordsTable.createdAt))
      .limit(limit)
      .offset(offset)

    /*-------------------------- Filter --------------------------*/
    if (entityId) {
      query = query.where(eq(recordsTable.entityId, entityId)) as typeof query
    }

    const records = await query

    return {
      success: true,
      data: records,
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    console.error('Get records error:', error)

    if (error instanceof Error && error.message.includes('connect')) {
      return {
        success: false,
        error: 'Database connection failed. Please try again later.',
      }
    }

    return {
      success: false,
      error: 'Failed to fetch records.',
    }
  }
}
