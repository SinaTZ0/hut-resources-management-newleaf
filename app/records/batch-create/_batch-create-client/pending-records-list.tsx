'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty'

import type { PendingRecord } from './batch-create-client'
import { PendingRecordItem } from './pending-record-item'

/*-------------------------- Types ---------------------------*/
type PendingRecordsListProps = {
  readonly records: PendingRecord[]
  readonly onDeleteRecord: (clientId: string) => void
  readonly isSubmitting: boolean
}

/*------------------------ Component -------------------------*/
export function PendingRecordsList({
  records,
  onDeleteRecord,
  isSubmitting,
}: PendingRecordsListProps) {
  /*-------------------------- Render --------------------------*/
  return (
    <Card data-testid='pending-records-list-card'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>Pending Records</CardTitle>
          {records.length > 0 && (
            <Badge variant='secondary' data-testid='pending-records-count-badge'>
              {records.length}
            </Badge>
          )}
        </div>
        <CardDescription>Records queued for batch submission</CardDescription>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          /*----------------------- Empty State ------------------------*/
          <Empty data-testid='pending-records-empty-state'>
            <EmptyHeader>
              <EmptyTitle>No records queued</EmptyTitle>
              <EmptyDescription>
                Use the form on the right to add records to the queue.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          /*----------------------- Records List -----------------------*/
          <ScrollArea className='h-full pr-4' data-testid='pending-records-scroll-area'>
            <div className='flex flex-col gap-3'>
              {records.map((record, index) => (
                <PendingRecordItem
                  key={record.clientId}
                  record={record}
                  index={index}
                  onDelete={onDeleteRecord}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
