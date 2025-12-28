'use client'

import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Check } from 'lucide-react'
import { useState } from 'react'

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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

/*-------------------------- Types ---------------------------*/
type Entity = {
  id: string
  name: string
  description: string | null
}

type EntitySelectorProps = {
  readonly entities: Entity[]
  readonly selectedEntityId?: string | null
  readonly onSelect?: (entityId: string) => void
  readonly disabled?: boolean
  readonly error?: string
  readonly className?: string
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function EntitySelector({
  entities,
  selectedEntityId,
  onSelect,
  disabled,
  error,
  className,
  testId,
}: EntitySelectorProps) {
  /*-------------------------- State ---------------------------*/
  const [open, setOpen] = useState(false)
  const router = useRouter()

  /*--------------------- Selected Entity ----------------------*/
  const selectedEntity = entities.find((e) => e.id === selectedEntityId)

  /*------------------------- Handlers -------------------------*/
  const handleSelect = (entityId: string) => {
    if (onSelect) {
      onSelect(entityId)
    } else {
      // Default behavior: navigate to create page with entityId
      router.push(`/records/create?entityId=${entityId}`)
    }
    setOpen(false)
  }

  /*-------------------------- Render --------------------------*/
  return (
    <Field className={cn(className)} data-invalid={!!error} data-testid={testId}>
      <FieldLabel>Entity Type *</FieldLabel>
      <FieldDescription>Select the entity type for this record</FieldDescription>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            className='w-full justify-between'
            disabled={disabled}
            data-testid={testId ? `${testId}-trigger` : 'entity-selector-trigger'}
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
                    data-testid={`entity-option-${entity.id}`}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedEntityId === entity.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className='flex flex-col'>
                      <span>{entity.name}</span>
                      {entity.description && (
                        <span className='text-muted-foreground text-xs'>{entity.description}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
