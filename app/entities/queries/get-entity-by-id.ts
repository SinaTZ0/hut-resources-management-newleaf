'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle/db'
import { entitiesTable } from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import type { QueryResult } from '@/types-and-schemas/common'

/*--------------------- Get Entity By ID ---------------------*/
export async function getEntityById(
  id: string
): Promise<QueryResult<typeof entitiesTable.$inferSelect>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: 'Invalid entity ID provided.',
      }
    }

    /*------------------------- Database -------------------------*/
    const entities = await db.select().from(entitiesTable).where(eq(entitiesTable.id, id)).limit(1)

    if (entities.length === 0) {
      return {
        success: false,
        error: 'Entity not found.',
      }
    }

    const entity = entities[0]

    return {
      success: true,
      data: entity,
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    console.error('Get entity by ID error:', error)

    if (error instanceof Error && error.message.includes('connect')) {
      return {
        success: false,
        error: 'Database connection failed. Please try again later.',
      }
    }

    if (error instanceof Error && error.message.includes('invalid input syntax')) {
      return {
        success: false,
        error: 'Invalid entity ID format.',
      }
    }

    return {
      success: false,
      error: 'Failed to fetch entity.',
    }
  }
}
