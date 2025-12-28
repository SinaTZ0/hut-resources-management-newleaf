'use server'

import { eq, desc } from 'drizzle-orm'

import { db } from '@/lib/drizzle/db'
import { recordsTable, entitiesTable } from '@/lib/drizzle/schema'
import type { QueryResult } from '@/app/entities/queries/get-entities'

/*-------------------------- Types ---------------------------*/
type GetRecordsOptions = {
  entityId?: string
  limit?: number
  offset?: number
}

export type RecordWithEntity = {
  id: string
  entityId: string
  entityName: string
  depth1Values: Record<string, unknown>
  depth2Values: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

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
        depth1Values: recordsTable.depth1Values,
        depth2Values: recordsTable.depth2Values,
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
