'use client'

import { z } from 'zod'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { type fieldDefinitionSchemaType, FIELD_TYPES } from '@/lib/drizzle/schema'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface FieldBuilderProps {
  readonly onAdd: (field: fieldDefinitionSchemaType & { key: string }) => void
  readonly existingKeys: string[]
}

/*------------------------- Utility --------------------------*/
function toSnakeCase(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
}

/*-------- Builder Schema (for form input without order - order is managed separately) --------*/
const builderFormSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(FIELD_TYPES),
  sortable: z.boolean(),
  required: z.boolean(),
})

type BuilderFormValues = z.infer<typeof builderFormSchema>

/*------------------------ Component -------------------------*/
export function FieldBuilder({ onAdd, existingKeys }: FieldBuilderProps) {
  /*------------------------ Form Setup ------------------------*/
  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(builderFormSchema),
    defaultValues: {
      label: '',
      type: FIELD_TYPES[0],
      sortable: true,
      required: false,
    },
  })

  const { control, register, handleSubmit, reset } = form

  /*------------------------- Handlers -------------------------*/
  const onSubmit = (values: BuilderFormValues) => {
    const base = toSnakeCase(values.label)
    let key = base || 'field'
    let i = 1
    while (existingKeys.includes(key)) {
      key = `${base}_${String(i)}`
      i += 1
    }

    onAdd({
      ...values,
      key,
      order: existingKeys.length,
    })
    reset()
  }

  /*-------------------------- Render --------------------------*/
  return (
    <div role='group' aria-labelledby='builder-heading' className='space-y-3'>
      {/*----------------------- Label Input ------------------------*/}
      <div>
        <label htmlFor='builder-label' className='mb-1 block text-sm font-medium'>
          Label
        </label>
        <Input
          id='builder-label'
          data-testid='builder-label'
          placeholder='e.g., Name, Age, Email'
          {...register('label')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleSubmit(onSubmit)()
            }
          }}
        />
        <p className='text-muted-foreground text-sm mt-1'>
          Used to generate the human label & snake_case key.
        </p>
      </div>

      {/*----------------------- Type Select ------------------------*/}
      <div>
        <label htmlFor='builder-type' className='mb-1 block text-sm font-medium'>
          Type
        </label>
        <Controller
          control={control}
          name='type'
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id='builder-type'>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem value={t} key={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/*--------------- Sortable & Required Switches ---------------*/}
      <div className='flex items-center gap-4'>
        <label htmlFor='builder-sortable' className='flex items-center gap-2'>
          <Controller
            control={control}
            name='sortable'
            render={({ field }) => (
              <>
                <Switch
                  id='builder-sortable'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid='builder-sortable'
                  aria-label='sortable'
                />
                <span className='text-sm'>Sortable</span>
              </>
            )}
          />
        </label>

        <label htmlFor='builder-required' className='flex items-center gap-2'>
          <Controller
            control={control}
            name='required'
            render={({ field }) => (
              <>
                <Switch
                  id='builder-required'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid='builder-required'
                  aria-label='required'
                />
                <span className='text-sm'>Required</span>
              </>
            )}
          />
        </label>
      </div>

      {/*------------------------ Add Button ------------------------*/}
      <div className='flex justify-end'>
        <Button
          type='button'
          data-testid='builder-add'
          aria-label='Add field'
          onClick={() => void handleSubmit(onSubmit)()}
        >
          Add +
        </Button>
      </div>
    </div>
  )
}
