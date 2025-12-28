'use server'

import { eq, desc } from 'drizzle-orm'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  type FieldsSchema,
  type Depth1Values,
  type Depth2Values,
} from '@/lib/drizzle/schema'
import type { QueryResult } from '@/app/entities/queries/get-entities'

/*------------------------ UUID Regex ------------------------*/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/*-------------------------- Types ---------------------------*/
export type RecordsByEntityResult = {
  entity: {
    id: string
    name: string
    description: string | null
    fields: FieldsSchema
  }
  records: Array<{
    id: string
    depth1Values: Depth1Values
    depth2Values: Depth2Values
    createdAt: Date
    updatedAt: Date
  }>
}

/*------------------ Get Records By Entity -------------------*/
export async function getRecordsByEntity(
  entityId: string
): Promise<QueryResult<RecordsByEntityResult>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!entityId || typeof entityId !== 'string' || !UUID_REGEX.test(entityId)) {
      return {
        success: false,
        error: 'Invalid entity ID provided.',
      }
    }

    /*----------------------- Fetch Entity -----------------------*/
    const entities = await db
      .select()
      .from(entitiesTable)
      .where(eq(entitiesTable.id, entityId))
      .limit(1)

    if (entities.length === 0) {
      return {
        success: false,
        error: 'Entity not found.',
      }
    }

    const entity = entities[0]

    /*---------------------- Fetch Records -----------------------*/
    const records = await db
      .select({
        id: recordsTable.id,
        depth1Values: recordsTable.depth1Values,
        depth2Values: recordsTable.depth2Values,
        createdAt: recordsTable.createdAt,
        updatedAt: recordsTable.updatedAt,
      })
      .from(recordsTable)
      .where(eq(recordsTable.entityId, entityId))
      .orderBy(desc(recordsTable.createdAt))

    return {
      success: true,
      data: {
        entity: {
          id: entity.id,
          name: entity.name,
          description: entity.description,
          fields: entity.fields,
        },
        records,
      },
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    console.error('Get records by entity error:', error)

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
