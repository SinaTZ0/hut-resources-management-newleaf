'use client'

import { useState } from 'react'
import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal, Loader2 } from 'lucide-react'
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
import type { EntitySchema } from '@/lib/drizzle/schema'
import { deleteEntity } from '@/app/entities/actions/delete-entity'

/*------------------------- Helpers --------------------------*/
function handleCopyId(id: string) {
  void navigator.clipboard.writeText(id)
  toast.success('Entity ID copied to clipboard')
}

/*----------------------- Name Column ------------------------*/
const nameColumn: ColumnDef<EntitySchema> = {
  accessorKey: 'name',
  header: ({ column }) => (
    <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
      Name
      <ArrowUpDown className='ml-2 h-4 w-4' />
    </Button>
  ),
  cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>,
}

/*-------------------- Description Column --------------------*/
const descriptionColumn: ColumnDef<EntitySchema> = {
  accessorKey: 'description',
  header: 'Description',
  cell: ({ row }) => {
    const description = row.getValue('description')
    const displayValue = typeof description === 'string' ? description : null
    return (
      <div className='max-w-[300px] truncate text-muted-foreground'>
        {displayValue ?? <span className='italic'>No description</span>}
      </div>
    )
  },
}

/*---------------------- Fields Column -----------------------*/
const fieldsColumn: ColumnDef<EntitySchema> = {
  accessorKey: 'fields',
  header: 'Fields',
  cell: ({ row }) => {
    const fields = row.getValue('fields')
    const fieldCount = Object.keys(fields as object).length
    return (
      <Badge variant='secondary' data-testid='entity-fields-count'>
        {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
      </Badge>
    )
  },
}

/*-------------------- Created At Column ---------------------*/
const createdAtColumn: ColumnDef<EntitySchema> = {
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
function EntityActionsCell({ entity }: Readonly<{ entity: EntitySchema }>) {
  /*-------------------------- State ---------------------------*/
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  /*------------------------- Handlers -------------------------*/
  async function handleDelete() {
    setIsDeleting(true)

    try {
      const result = await deleteEntity(entity.id)

      if (result.success) {
        toast.success(`Entity "${entity.name}" deleted successfully`)
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
          <Button variant='ghost' className='h-8 w-8 p-0' data-testid='entity-actions-btn'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleCopyId(entity.id)} data-testid='entity-copy-id'>
            Copy entity ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild data-testid='entity-view-details'>
            <Link href={`/entities/${entity.id}`}>View details</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild data-testid='entity-edit'>
            <Link href={`/entities/${entity.id}/edit`}>Edit entity</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => setIsDeleteDialogOpen(true)}
            data-testid='entity-delete-btn'
          >
            Delete entity
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/*---------------- Delete Confirmation Dialog ----------------*/}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{entity.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} data-testid='entity-delete-cancel'>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className='bg-destructive text-white hover:bg-destructive/90'
              data-testid='entity-delete-confirm'
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

const actionsColumn: ColumnDef<EntitySchema> = {
  id: 'actions',
  enableHiding: false,
  cell: ({ row }) => <EntityActionsCell entity={row.original} />,
}

/*------------------------- Columns --------------------------*/
export const entityColumns: ColumnDef<EntitySchema>[] = [
  nameColumn,
  descriptionColumn,
  fieldsColumn,
  createdAtColumn,
  actionsColumn,
]
