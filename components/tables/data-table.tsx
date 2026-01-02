'use client'
'use no memo'

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  type OnChangeFn,
} from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

/*-------------------------- Types ---------------------------*/
type DataTableProps<TData, TValue> = Readonly<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  testId?: string
  initialColumnVisibility?: VisibilityState
  enableRowSelection?: boolean
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
  getRowId?: (row: TData) => string
  toolbarActions?: React.ReactNode
}>

/*------------------------ Component -------------------------*/
export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  testId,
  initialColumnVisibility,
  enableRowSelection = false,
  rowSelection: controlledRowSelection,
  onRowSelectionChange,
  getRowId,
  toolbarActions,
}: DataTableProps<TData, TValue>) {
  /*-------------------------- State ---------------------------*/
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialColumnVisibility ?? {}
  )
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})

  /*------------------- Row Selection State --------------------*/
  const rowSelection = controlledRowSelection ?? internalRowSelection
  const setRowSelection = onRowSelectionChange ?? setInternalRowSelection

  /*-------------------------- Table ---------------------------*/
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection,
    getRowId,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  /*-------------------------- Render --------------------------*/
  return (
    <div className='w-full' data-testid={testId}>
      {/*------------------------- Toolbar --------------------------*/}
      <div className='flex items-center gap-2 py-4'>
        {searchKey && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchKey)?.getFilterValue() as string) || ''}
            onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
            className='max-w-sm'
            data-testid={testId ? `${testId}-search` : undefined}
          />
        )}
        {toolbarActions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' className='ml-auto'>
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className='capitalize'
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/*-------------------------- Table ---------------------------*/}
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  <span data-testid={testId ? `${testId}-empty` : undefined}>No results.</span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/*------------------------ Pagination ------------------------*/}
      <div className='flex items-center justify-end space-x-2 py-4'>
        <div className='text-muted-foreground flex-1 text-sm'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className='space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            data-testid={testId ? `${testId}-prev` : undefined}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            data-testid={testId ? `${testId}-next` : undefined}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
