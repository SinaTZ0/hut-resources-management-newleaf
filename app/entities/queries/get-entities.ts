'use server'

import { db } from '@/lib/drizzle/db'
import { entitiesTable, type EntitySchema } from '@/lib/drizzle/schema'
import type { QueryResult } from '@/types-and-schemas/common'

/*--------------------- Get All Entities ---------------------*/
export async function getEntities(): Promise<QueryResult<EntitySchema[]>> {
  try {
    const entities = await db.select().from(entitiesTable).orderBy(entitiesTable.createdAt)

    return {
      success: true,
      data: entities,
    }
  } catch (error) {
    console.error('Get entities error:', error)

    if (error instanceof Error && error.message.includes('connect')) {
      return {
        success: false,
        error: 'Database connection failed. Please try again later.',
      }
    }

    return {
      success: false,
      error: 'Failed to fetch entities.',
    }
  }
}
