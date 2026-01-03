'use server'

import { and, eq, sql } from 'drizzle-orm'

import { db } from '@/lib/drizzle/db'
import { recordsTable } from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import type { QueryResult } from '@/types-and-schemas/common'

function normalizeFieldKeys(fieldKeys: string[]): string[] {
  const unique = Array.from(new Set(fieldKeys.map((k) => k.trim()).filter(Boolean)))
  return unique
}

export async function getBackfillAffectedRecordCount(args: {
  entityId: string
  fieldKeys: string[]
}): Promise<QueryResult<number>> {
  /*------------------------ Validation ------------------------*/
  if (!isValidUUID(args.entityId)) {
    return { success: false, error: 'Invalid entity ID' }
  }

  const fieldKeys = normalizeFieldKeys(args.fieldKeys)
  if (fieldKeys.length === 0) {
    return { success: true, data: 0 }
  }

  /*--------------------- Build Condition ----------------------*/
  const missingConditions = fieldKeys.map(
    (fieldKey) =>
      sql`(NOT (${recordsTable.fieldValues} ? ${fieldKey}) OR (${recordsTable.fieldValues} -> ${fieldKey}) IS NULL)`
  )

  const orSeparator = sql` OR `
  const missingAnyInner = sql.join(missingConditions, orSeparator)
  const whereMissingAny = sql.join([sql`(`, missingAnyInner, sql`)`], sql``)

  /*-------------------------- Query ---------------------------*/
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(recordsTable)
    .where(and(eq(recordsTable.entityId, args.entityId), whereMissingAny))

  return { success: true, data: result[0]?.count ?? 0 }
}
