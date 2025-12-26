'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { SelectEntitySchemaType } from '@/lib/drizzle/schema'

/*------------------------- Helpers --------------------------*/
function handleCopyId(id: string) {
  void navigator.clipboard.writeText(id)
}

/*---------------------- Select Column -----------------------*/
const selectColumn: ColumnDef<SelectEntitySchemaType> = {
  id: 'select',
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label='Select all'
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label='Select row'
    />
  ),
  enableSorting: false,
  enableHiding: false,
}

/*----------------------- Name Column ------------------------*/
const nameColumn: ColumnDef<SelectEntitySchemaType> = {
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
const descriptionColumn: ColumnDef<SelectEntitySchemaType> = {
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
const fieldsColumn: ColumnDef<SelectEntitySchemaType> = {
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
const createdAtColumn: ColumnDef<SelectEntitySchemaType> = {
  accessorKey: 'createdAt',
  header: ({ column }) => (
    <Button variant='ghost' onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
      Created
      <ArrowUpDown className='ml-2 h-4 w-4' />
    </Button>
  ),
  cell: ({ row }) => {
    const date = row.getValue('createdAt')
    return <div className='text-muted-foreground'>{(date as Date).toLocaleDateString()}</div>
  },
}

/*---------------------- Actions Column ----------------------*/
const actionsColumn: ColumnDef<SelectEntitySchemaType> = {
  id: 'actions',
  enableHiding: false,
  cell: ({ row }) => {
    const entity = row.original

    return (
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
            data-testid='entity-delete-btn'
          >
            Delete entity
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}

/*------------------------- Columns --------------------------*/
export const entityColumns: ColumnDef<SelectEntitySchemaType>[] = [
  selectColumn,
  nameColumn,
  descriptionColumn,
  fieldsColumn,
  createdAtColumn,
  actionsColumn,
]
