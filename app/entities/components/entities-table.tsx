'use client'

import { DataTable } from '@/components/tables/data-table'
import { entityColumns } from './entity-columns'
import type { SelectEntitySchemaType } from '@/lib/drizzle/schema'

/*-------------------------- Types ---------------------------*/
type EntitiesTableProps = Readonly<{
  entities: SelectEntitySchemaType[]
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
