'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Loader2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { deleteRecord } from '@/app/records/actions/delete-record'
import type { RecordWithEntity } from '@/app/records/queries/get-records'

/*------------------------- Helpers --------------------------*/
function handleCopyId(id: string) {
  void navigator.clipboard.writeText(id)
  toast.success('Record ID copied to clipboard')
}

/*------------------------ ID Column -------------------------*/
const idColumn: ColumnDef<RecordWithEntity> = {
  accessorKey: 'id',
  header: 'ID',
  cell: ({ row }) => {
    const id = row.getValue('id')
    return (
      <code className='text-muted-foreground bg-muted rounded px-1.5 py-0.5 text-xs font-mono'>
        {String(id).slice(0, 8)}...
      </code>
    )
  },
}

/*-------------------- Entity Name Column --------------------*/
const entityNameColumn: ColumnDef<RecordWithEntity> = {
  accessorKey: 'entityName',
  header: ({ column }) => (
    <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
      Entity
      <ArrowUpDown className='ml-2 h-4 w-4' />
    </Button>
  ),
  cell: ({ row }) => (
    <Badge variant='outline' className='font-medium'>
      {row.getValue('entityName')}
    </Badge>
  ),
}

/*--------------- Field Values Preview Column ----------------*/
const fieldValuesPreviewColumn: ColumnDef<RecordWithEntity> = {
  accessorKey: 'fieldValues',
  header: 'Preview',
  cell: ({ row }) => {
    const values = row.getValue('fieldValues')
    if (!values || typeof values !== 'object')
      return <span className='text-muted-foreground'>—</span>
    const entries = Object.entries(values as Record<string, unknown>).slice(0, 2)

    const formatValue = (v: unknown): string => {
      if (v === null || v === undefined) return '—'
      if (typeof v === 'object') return JSON.stringify(v)
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        return String(v)
      }
      return JSON.stringify(v)
    }

    return (
      <div className='max-w-[300px] truncate text-muted-foreground text-sm'>
        {entries.map(([key, value], idx) => (
          <span key={key}>
            <span className='font-medium text-foreground'>{key}:</span> {formatValue(value)}
            {idx < entries.length - 1 && ' • '}
          </span>
        ))}
        {Object.keys(values).length > 2 && (
          <span className='text-muted-foreground'> +{Object.keys(values).length - 2} more</span>
        )}
      </div>
    )
  },
}

/*------------------- Has Metadata Column --------------------*/
const hasMetadataColumn: ColumnDef<RecordWithEntity> = {
  accessorKey: 'metadata',
  header: 'Extra Data',
  cell: ({ row }) => {
    const metadata = row.getValue('metadata')
    const hasMetadata =
      metadata !== null && typeof metadata === 'object' && Object.keys(metadata).length > 0

    return hasMetadata ? (
      <Badge variant='secondary'>Yes</Badge>
    ) : (
      <span className='text-muted-foreground text-sm'>—</span>
    )
  },
}

/*-------------------- Created At Column ---------------------*/
const createdAtColumn: ColumnDef<RecordWithEntity> = {
  accessorKey: 'createdAt',
  header: ({ column }) => (
    <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
      Created
      <ArrowUpDown className='ml-2 h-4 w-4' />
    </Button>
  ),
  cell: ({ row }) => {
    const date = row.getValue('createdAt')
    if (!(date instanceof Date)) return <div className='text-muted-foreground'>—</div>
    return <div className='text-muted-foreground'>{date.toLocaleDateString()}</div>
  },
}

/*---------------------- Actions Column ----------------------*/
function RecordActionsCell({ record }: Readonly<{ record: RecordWithEntity }>) {
  /*-------------------------- State ---------------------------*/
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  /*------------------------- Handlers -------------------------*/
  async function handleDelete() {
    setIsDeleting(true)

    try {
      const result = await deleteRecord(record.id)

      if (result.success) {
        toast.success('Record deleted successfully')
        setIsDeleteDialogOpen(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  /*-------------------------- Render --------------------------*/
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0' data-testid='record-actions-btn'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleCopyId(record.id)} data-testid='record-copy-id'>
            Copy record ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild data-testid='record-view-details'>
            <Link href={`/records/${record.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-testid='record-edit'>
            <Link href={`/records/${record.id}/edit`}>Edit record</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => setIsDeleteDialogOpen(true)}
            data-testid='record-delete-btn'
          >
            Delete record
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/*---------------------- Delete Dialog -----------------------*/}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
              data-testid='record-delete-confirm-btn'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const actionsColumn: ColumnDef<RecordWithEntity> = {
  id: 'actions',
  enableHiding: false,
  cell: ({ row }) => <RecordActionsCell record={row.original} />,
}

/*---------------------- Export Columns ----------------------*/
export const recordColumns: ColumnDef<RecordWithEntity>[] = [
  idColumn,
  entityNameColumn,
  fieldValuesPreviewColumn,
  hasMetadataColumn,
  createdAtColumn,
  actionsColumn,
]
