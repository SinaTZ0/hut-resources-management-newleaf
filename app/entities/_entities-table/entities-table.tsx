'use client'

import { DataTable } from '@/components/tables/data-table'
import type { EntitySchema } from '@/lib/drizzle/schema'

import { entityColumns } from './entity-columns'

/*-------------------------- Types ---------------------------*/
type EntitiesTableProps = Readonly<{
  entities: EntitySchema[]
}>

/*------------------------ Component -------------------------*/
export function EntitiesTable({ entities }: EntitiesTableProps) {
  return (
    <DataTable
      columns={entityColumns}
      data={entities}
      searchKey='name'
      searchPlaceholder='Filter by name...'
      testId='entities-table'
    />
  )
}
