'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Loader2 } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format } from 'date-fns'

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
import type { FieldsSchema, FieldSchema, FieldValues } from '@/lib/drizzle/schema'

/*-------------------------- Types ---------------------------*/
export type DynamicRecord = {
  id: string
  fieldValues: FieldValues
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

/*------------------------- Helpers --------------------------*/
function handleCopyId(id: string) {
  void navigator.clipboard.writeText(id)
  toast.success('Record ID copied to clipboard')
}

function formatDateValue(value: unknown): string {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? '—' : format(value, 'MMM d, yyyy')
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? String(value) : format(date, 'MMM d, yyyy')
  }
  return '—'
}

function formatFieldValue(value: unknown, fieldType: FieldSchema['type']): string {
  if (value === null || value === undefined) return '—'

  switch (fieldType) {
    case 'date':
      return formatDateValue(value)
    case 'boolean':
      // value could be false, 0, '' which are falsy but valid boolean representations
      return value === true || value === 'true' || value === 1 ? 'Yes' : 'No'
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value as string | number)
    case 'string':
    default:
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value as string | number | boolean)
  }
}

/*--------------------- Generate Columns ---------------------*/
export function generateDynamicColumns(fields: FieldsSchema): ColumnDef<DynamicRecord>[] {
  /*------------------------ ID Column -------------------------*/
  const idColumn: ColumnDef<DynamicRecord> = {
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

  /*------------------ Dynamic Field Columns -------------------*/
  // Sort fields by order
  const sortedFields = Object.entries(fields).sort(([, a], [, b]) => a.order - b.order)

  const fieldColumns: ColumnDef<DynamicRecord>[] = sortedFields.map(([fieldKey, fieldConfig]) => {
    const baseColumn: ColumnDef<DynamicRecord> = {
      id: fieldKey,
      accessorFn: (row) => row.fieldValues[fieldKey],
      cell: ({ row }) => {
        const value = row.original.fieldValues[fieldKey]
        const formatted = formatFieldValue(value, fieldConfig.type)

        // Style based on field type
        if (fieldConfig.type === 'boolean') {
          return value ? (
            <Badge variant='default'>Yes</Badge>
          ) : (
            <Badge variant='secondary'>No</Badge>
          )
        }

        if (fieldConfig.type === 'date') {
          return <span className='text-muted-foreground'>{formatted}</span>
        }

        return <span>{formatted}</span>
      },
    }

    // Add sortable header if field is sortable
    if (fieldConfig.sortable) {
      baseColumn.header = ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {fieldConfig.label}
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
      // Enable sorting
      baseColumn.enableSorting = true
    } else {
      baseColumn.header = fieldConfig.label
      baseColumn.enableSorting = false
    }

    return baseColumn
  })

  /*------------------- Has Metadata Column --------------------*/
  const hasMetadataColumn: ColumnDef<DynamicRecord> = {
    id: 'hasMetadata',
    header: 'Extra Data',
    cell: ({ row }) => {
      const metadata = row.original.metadata
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
  const createdAtColumn: ColumnDef<DynamicRecord> = {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Created
        <ArrowUpDown className='ml-2 h-4 w-4' />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt')
      if (!(date instanceof Date)) return <span className='text-muted-foreground'>—</span>
      return <span className='text-muted-foreground'>{format(date, 'MMM d, yyyy')}</span>
    },
  }

  /*---------------------- Actions Column ----------------------*/
  const actionsColumn: ColumnDef<DynamicRecord> = {
    id: 'actions',
    header: '',
    cell: ({ row }) => <RecordActionsCell record={row.original} />,
  }

  return [idColumn, ...fieldColumns, hasMetadataColumn, createdAtColumn, actionsColumn]
}

/*------------------ Actions Cell Component ------------------*/
function RecordActionsCell({ record }: Readonly<{ record: DynamicRecord }>) {
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
          <Button
            variant='ghost'
            className='h-8 w-8 p-0'
            data-testid={`record-actions-${record.id}`}
          >
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleCopyId(record.id)}>Copy ID</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/records/${record.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/records/${record.id}/edit`}>Edit record</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete record
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/*---------------------- Delete Dialog -----------------------*/}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
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
