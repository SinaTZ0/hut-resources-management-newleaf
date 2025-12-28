'use client'

import { DataTable } from '@/components/tables/data-table'
import type { RecordWithEntity } from '@/app/records/queries/get-records'

import { recordColumns } from './record-columns'

/*-------------------------- Types ---------------------------*/
type RecordsTableProps = Readonly<{
  records: RecordWithEntity[]
}>

/*------------------------ Component -------------------------*/
export function RecordsTable({ records }: RecordsTableProps) {
  return (
    <DataTable
      columns={recordColumns}
      data={records}
      searchKey='entityName'
      searchPlaceholder='Filter by entity...'
      testId='records-table'
    />
  )
}
