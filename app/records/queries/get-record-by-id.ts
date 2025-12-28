'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle/db'
import {
  recordsTable,
  entitiesTable,
  type FieldsSchema,
  type FieldValues,
  type Metadata,
} from '@/lib/drizzle/schema'
import type { QueryResult } from '@/app/entities/queries/get-entities'

/*------------------------ UUID Regex ------------------------*/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/*-------------------------- Types ---------------------------*/
export type RecordWithEntityDetails = {
  id: string
  entityId: string
  entityName: string
  entityFields: FieldsSchema
  fieldValues: FieldValues
  metadata: Metadata
  createdAt: Date
  updatedAt: Date
}

/*--------------------- Get Record By ID ---------------------*/
export async function getRecordById(id: string): Promise<QueryResult<RecordWithEntityDetails>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
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
