'use server'

import { db } from '@/lib/drizzle/db'
import { entitiesTable } from '@/lib/drizzle/schema'

/*----------------------- Query Result -----------------------*/
export type QueryResult<T> = { success: true; data: T } | { success: false; error: string }

/*--------------------- Get All Entities ---------------------*/
export async function getEntities(): Promise<QueryResult<(typeof entitiesTable.$inferSelect)[]>> {
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
