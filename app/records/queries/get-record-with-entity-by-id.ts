'use server'

import { eq } from 'drizzle-orm'
import type { Simplify } from 'type-fest'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  type FieldsSchema,
  type RecordSchema,
} from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import type { QueryResult } from '@/types-and-schemas/common'

/*-------------------------- Types ---------------------------*/
export type RecordWithEntityDetails = Simplify<
  RecordSchema & {
    entityName: string
    entityFields: FieldsSchema
  }
>

/*--------------------- Get Record By ID ---------------------*/
export async function getRecordWithEntityById(
  id: string
): Promise<QueryResult<RecordWithEntityDetails>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(id)) {
      return {
        success: false,
        error: 'Invalid record ID provided.',
      }
    }

    /*------------------------- Database -------------------------*/
    const result = await db
      .select({
        id: recordsTable.id,
        entityId: recordsTable.entityId,
        entityName: entitiesTable.name,
        entityFields: entitiesTable.fields,
        fieldValues: recordsTable.fieldValues,
        metadata: recordsTable.metadata,
        assets: recordsTable.assets,
        createdAt: recordsTable.createdAt,
        updatedAt: recordsTable.updatedAt,
      })
      .from(recordsTable)
      .innerJoin(entitiesTable, eq(recordsTable.entityId, entitiesTable.id))
      .where(eq(recordsTable.id, id))
      .limit(1)

    if (result.length === 0) {
      return {
        success: false,
        error: 'Record not found.',
      }
    }

    return {
      success: true,
      data: result[0],
    }
  } catch (error) {
    /*---------------------- Error Handling ----------------------*/
    console.error('Get record by ID error:', error)

    if (error instanceof Error && error.message.includes('connect')) {
      return {
        success: false,
        error: 'Database connection failed. Please try again later.',
      }
    }

    return {
      success: false,
      error: 'Failed to fetch record.',
    }
  }
}
