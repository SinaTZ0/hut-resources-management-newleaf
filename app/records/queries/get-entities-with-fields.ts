'use server'

import { db } from '@/lib/drizzle/db'
import { entitiesTable, type EntitySchema } from '@/lib/drizzle/schema'
import type { QueryResult } from '@/types-and-schemas/common'

/*-------------------------- Types ---------------------------*/
export type EntityWithFields = Pick<EntitySchema, 'id' | 'name' | 'description' | 'fields'>

/*----------------- Get Entities With Fields -----------------*/
export async function getEntitiesWithFields(): Promise<QueryResult<EntityWithFields[]>> {
  try {
    const entities = await db
      .select({
        id: entitiesTable.id,
        name: entitiesTable.name,
        description: entitiesTable.description,
        fields: entitiesTable.fields,
      })
      .from(entitiesTable)
      .orderBy(entitiesTable.name)

    return {
      success: true,
      data: entities,
    }
  } catch (error) {
    console.error('Get entities with fields error:', error)

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
