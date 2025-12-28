'use client'

import { useState, useMemo } from 'react'
import { ChevronsUpDown, Check, Table2 } from 'lucide-react'

import { cn } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/tables/data-table'
import type { FieldsSchema } from '@/lib/drizzle/schema'

import { generateDynamicColumns, type DynamicRecord } from './dynamic-columns'

/*-------------------------- Types ---------------------------*/
type EntityOption = {
  id: string
  name: string
  description: string | null
  fields: FieldsSchema
}

type RecordData = {
  id: string
  entityId: string
  fieldValues: Record<string, unknown>
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
}

type TableBuilderProps = {
  readonly entities: EntityOption[]
  readonly records: RecordData[]
  readonly defaultEntityId?: string
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function TableBuilder({ entities, records, defaultEntityId, testId }: TableBuilderProps) {
  /*-------------------------- State ---------------------------*/
  const [open, setOpen] = useState(false)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(defaultEntityId ?? null)

  /*--------------------- Selected Entity ----------------------*/
  const selectedEntity = entities.find((e) => e.id === selectedEntityId)

  /*--------------------- Filtered Records ---------------------*/
  const filteredRecords = useMemo(() => {
    if (!selectedEntityId) return []
    return records.filter((r) => r.entityId === selectedEntityId) as DynamicRecord[]
  }, [records, selectedEntityId])

  /*--------------------- Dynamic Columns ----------------------*/
  const columns = useMemo(() => {
    if (!selectedEntity) return []
    return generateDynamicColumns(selectedEntity.fields)
  }, [selectedEntity])

  /*------------------------- Handlers -------------------------*/
  const handleSelect = (entityId: string) => {
    setSelectedEntityId(entityId)
    setOpen(false)
  }

  /*------------------- Get Field Count Text -------------------*/
  const getFieldsText = (fields: FieldsSchema) => {
    const count = Object.keys(fields).length
    const sortableCount = Object.values(fields).filter((f) => f.sortable).length
    return `${String(count)} field${count !== 1 ? 's' : ''} (${String(sortableCount)} sortable)`
  }

  /*-------------------------- Render --------------------------*/
  return (
    <div className='flex flex-col gap-6' data-testid={testId}>
      {/*--------------------- Entity Selector ----------------------*/}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Table2 className='h-5 w-5' />
            Table Builder
          </CardTitle>
          <CardDescription>
            Select an entity to view its records with dynamic columns based on the entity&apos;s
            field definitions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-end'>
            <div className='flex-1'>
              <span className='text-sm font-medium mb-2 block' id='entity-type-label'>
                Entity Type
              </span>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={open}
                    aria-labelledby='entity-type-label'
                    className='w-full justify-between'
                    data-testid={
                      testId ? `${testId}-entity-trigger` : 'table-builder-entity-trigger'
                    }
                  >
                    {selectedEntity ? selectedEntity.name : 'Select an entity...'}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
                  <Command>
                    <CommandInput placeholder='Search entities...' />
                    <CommandList>
                      <CommandEmpty>No entity found.</CommandEmpty>
                      <CommandGroup>
                        {entities.map((entity) => (
                          <CommandItem
                            key={entity.id}
                            value={entity.name}
                            onSelect={() => handleSelect(entity.id)}
                            data-testid={`table-builder-entity-${entity.id}`}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedEntityId === entity.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className='flex flex-col'>
                              <span>{entity.name}</span>
                              <span className='text-xs text-muted-foreground'>
                                {getFieldsText(entity.fields)}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/*---------------------- Selected Info -----------------------*/}
            {selectedEntity && (
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                <span>
                  <strong className='text-foreground'>{filteredRecords.length}</strong> record
                  {filteredRecords.length !== 1 ? 's' : ''}
                </span>
                <span>•</span>
                <span>{getFieldsText(selectedEntity.fields)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/*---------------------- Dynamic Table -----------------------*/}
      {selectedEntity ? (
        <Card>
          <CardHeader>
            <CardTitle>{selectedEntity.name} Records</CardTitle>
            <CardDescription>
              {selectedEntity.description ?? `Records for ${selectedEntity.name} entity.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <div
                className='flex flex-col items-center justify-center py-12 text-center'
                data-testid={testId ? `${testId}-empty` : 'table-builder-empty'}
              >
                <p className='text-muted-foreground'>
                  No records found for <strong>{selectedEntity.name}</strong>.
                </p>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredRecords}
                testId={testId ? `${testId}-table` : 'table-builder-table'}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className='py-12'>
            <div
              className='flex flex-col items-center justify-center text-center'
              data-testid={testId ? `${testId}-no-selection` : 'table-builder-no-selection'}
            >
              <Table2 className='h-12 w-12 text-muted-foreground/50 mb-4' />
              <p className='text-muted-foreground'>
                Select an entity type above to view its records in a dynamic table.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
