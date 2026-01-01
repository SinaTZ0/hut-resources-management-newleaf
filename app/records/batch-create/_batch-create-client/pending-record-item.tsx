'use client'

import { useMemo } from 'react'
import { Trash2, Clock } from 'lucide-react'

import { cn } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import type { PendingRecord } from './batch-create-client'

/*-------------------------- Types ---------------------------*/
type PendingRecordItemProps = {
  readonly record: PendingRecord
  readonly index: number
  readonly onDelete: (clientId: string) => void
  readonly disabled: boolean
}

/*------------------- Format Field Preview -------------------*/
function formatFieldPreview(fieldValues: Record<string, unknown>): string {
  const entries = Object.entries(fieldValues)
  const previewFields = entries.slice(0, 3)

  const formatted = previewFields
    .map(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return null
      }

      // Format different types
      if (value instanceof Date) {
        return `${key}: ${value.toLocaleDateString()}`
      }
      if (typeof value === 'boolean') {
        return `${key}: ${value ? 'Yes' : 'No'}`
      }
      if (typeof value === 'number') {
        return `${key}: ${String(value)}`
      }
      if (typeof value === 'string') {
        if (value.length > 20) {
          return `${key}: ${value.substring(0, 20)}...`
        }
        return `${key}: ${value}`
      }

      // Objects and other types
      return `${key}: [object]`
    })
    .filter(Boolean)
    .join(' • ')

  const remaining = entries.length - previewFields.length
  if (remaining > 0) {
    return formatted + ` (+${String(remaining)} more)`
  }

  return formatted || 'No field values'
}

/*------------------- Format Relative Time -------------------*/
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)

  if (diffSec < 60) {
    return 'Just now'
  }
  if (diffMin < 60) {
    return `${String(diffMin)}m ago`
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/*------------------------ Component -------------------------*/
export function PendingRecordItem({ record, index, onDelete, disabled }: PendingRecordItemProps) {
  /*-------------------------- Memos ---------------------------*/
  const fieldPreview = useMemo(() => formatFieldPreview(record.fieldValues), [record.fieldValues])

  const hasMetadata = record.metadata !== null && Object.keys(record.metadata).length > 0

  /*-------------------------- Render --------------------------*/
  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card p-4 transition-colors',
        'hover:border-primary/50 hover:bg-accent/50',
        disabled && 'opacity-60 pointer-events-none'
      )}
      data-testid={`pending-record-item-${String(index)}`}
    >
      {/*-------------------------- Header --------------------------*/}
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='font-medium'>
            {record.entityName}
          </Badge>
          {hasMetadata && (
            <Badge variant='secondary' className='text-xs'>
              +metadata
            </Badge>
          )}
        </div>

        {/*---------------------- Delete Button -----------------------*/}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity'
              disabled={disabled}
              data-testid={`pending-record-delete-btn-${String(index)}`}
            >
              <Trash2 className='h-4 w-4 text-destructive' />
              <span className='sr-only'>Delete record</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this record?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the record from the queue. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(record.clientId)}
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                data-testid={`pending-record-delete-confirm-btn-${String(index)}`}
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/*---------------------- Field Preview -----------------------*/}
      <p className='mt-2 text-sm text-muted-foreground line-clamp-2'>{fieldPreview}</p>

      {/*-------------------------- Footer --------------------------*/}
      <div className='mt-3 flex items-center gap-1 text-xs text-muted-foreground'>
        <Clock className='h-3 w-3' />
        <span>{formatRelativeTime(record.addedAt)}</span>
        <span className='mx-1'>•</span>
        <span>#{index + 1}</span>
      </div>
    </div>
  )
}
