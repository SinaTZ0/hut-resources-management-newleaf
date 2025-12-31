'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown, FileText } from 'lucide-react'
import { useState } from 'react'

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

/*-------------------------- Types ---------------------------*/
type Entity = {
  readonly id: string
  readonly name: string
  readonly description: string | null
}

type CreateRecordDropdownProps = {
  readonly entities: Entity[]
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function CreateRecordDropdown({
  entities,
  testId = 'create-record-dropdown',
}: CreateRecordDropdownProps) {
  /*-------------------------- State ---------------------------*/
  const [open, setOpen] = useState(false)
  const router = useRouter()

  /*------------------------- Handlers -------------------------*/
  const handleSelect = (entityId: string) => {
    router.push(`/records/create?entityId=${entityId}`)
    setOpen(false)
  }

  /*-------------------------- Render --------------------------*/
  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button data-testid={testId}>
          Create Record
          <ChevronDown className='ml-2 size-5' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80 p-0' align='start'>
        <Command className='rounded-lg border shadow-md'>
          <div className='bg-muted/50 border-b px-3 py-2'>
            <p className='text-sm font-medium'>Select Entity Type</p>
            <p className='text-muted-foreground text-xs'>Choose an entity to create a new record</p>
          </div>
          <CommandInput
            placeholder='Search entities...'
            data-testid={`${testId}-search`}
            className='h-10'
          />
          <CommandList className='max-h-64'>
            <CommandEmpty>
              <div className='flex flex-col items-center gap-2 py-6'>
                <FileText className='text-muted-foreground h-10 w-10' />
                <p className='text-muted-foreground text-sm font-medium'>No entities found</p>
                <p className='text-muted-foreground text-xs'>Try a different search term</p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {entities.map((entity) => (
                <CommandItem
                  key={entity.id}
                  value={entity.name}
                  onSelect={() => handleSelect(entity.id)}
                  data-testid={`${testId}-option-${entity.id}`}
                  className='cursor-pointer px-3 py-2.5'
                >
                  <div className='flex flex-col gap-0.5'>
                    <span className='font-medium'>{entity.name}</span>
                    {entity.description && (
                      <span className='text-muted-foreground line-clamp-1 text-xs'>
                        {entity.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
