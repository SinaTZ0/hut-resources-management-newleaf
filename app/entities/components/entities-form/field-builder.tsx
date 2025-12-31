'use client'

import { useState } from 'react'
import { z } from 'zod/v4'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus } from 'lucide-react'

import { FIELD_TYPES, enumOptionsSchema } from '@/lib/drizzle/schema'
import { toSnakeCase } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { type EntityFormValues } from './entities-form-schema'

type FieldBuilderProps = {
  readonly onAdd: (field: EntityFormValues['fields'][number]) => void
  readonly existingKeys: string[]
}

/*---------------------- Builder Schema ----------------------*/
const builderFormSchema = z
  .object({
    label: z.string().min(1, 'Label is required'),
    type: z.enum(FIELD_TYPES),
    sortable: z.boolean(),
    required: z.boolean(),
    enumOptions: enumOptionsSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'enum') {
        return data.enumOptions !== undefined && data.enumOptions.length > 0
      }
      return true
    },
    {
      message: 'At least one enum option is required',
      path: ['enumOptions'],
    }
  )

type BuilderFormValues = z.infer<typeof builderFormSchema>

/*------------------------ Component -------------------------*/
export function FieldBuilder({ onAdd, existingKeys }: FieldBuilderProps) {
  /*-------------------------- State ---------------------------*/
  const [enumInput, setEnumInput] = useState('')
  const [enumOptions, setEnumOptions] = useState<string[]>([])
  const [enumError, setEnumError] = useState<string | null>(null)

  /*------------------------ Form Setup ------------------------*/
  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(builderFormSchema),
    defaultValues: {
      label: '',
      type: FIELD_TYPES[0],
      sortable: true,
      required: false,
      enumOptions: undefined,
    },
  })

  const { handleSubmit, reset, setValue, control } = form

  /*------------------------ Watch Type ------------------------*/
  const selectedType = useWatch({ control, name: 'type' })
  const isEnumType = selectedType === 'enum'

  /*------------------- Enum Option Handlers -------------------*/
  const handleAddEnumOption = () => {
    const trimmed = enumInput.trim()
    if (!trimmed) {
      setEnumError('Option cannot be empty')
      return
    }
    if (enumOptions.includes(trimmed)) {
      setEnumError('Option already exists')
      return
    }
    const newOptions = [...enumOptions, trimmed]
    setEnumOptions(newOptions)
    setValue('enumOptions', newOptions)
    setEnumInput('')
    setEnumError(null)
  }

  const handleRemoveEnumOption = (option: string) => {
    const newOptions = enumOptions.filter((o) => o !== option)
    setEnumOptions(newOptions)
    setValue('enumOptions', newOptions.length > 0 ? newOptions : undefined)
  }

  const handleEnumKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddEnumOption()
    }
  }

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
      order: existingKeys.length,
      enumOptions: values.type === 'enum' ? values.enumOptions : undefined,
    })

    // Reset form and enum state
    reset()
    setEnumOptions([])
    setEnumInput('')
    setEnumError(null)
  }

  /*-------------------------- Render --------------------------*/
  return (
    <div className='flex flex-col gap-4'>
      {/*----------------------- Label Input ------------------------*/}
      <FormInput
        form={form}
        name='label'
        label='Label'
        placeholder='e.g., Name, Age, Email'
        description='Used to generate the human label & snake_case key.'
        testId='builder-label'
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void handleSubmit(onSubmit)()
          }
        }}
      />

      {/*----------------------- Type Select ------------------------*/}
      <FormSelect
        form={form}
        name='type'
        label='Type'
        placeholder='Select type'
        options={FIELD_TYPES}
        testId='builder-type'
      />

      {/*------------------- Enum Options Builder -------------------*/}
      {isEnumType && (
        <div className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Enum Options</span>

          {/*-------------------- Enum Options List ---------------------*/}
          {enumOptions.length > 0 && (
            <div className='flex flex-wrap gap-1.5'>
              {enumOptions.map((option) => (
                <Badge
                  key={option}
                  variant='secondary'
                  className='gap-1 pr-1'
                  data-testid={`enum-option-${option}`}
                >
                  {option}
                  <button
                    type='button'
                    className='ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5'
                    onClick={() => handleRemoveEnumOption(option)}
                    aria-label={`Remove ${option}`}
                  >
                    <X className='size-3' />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/*-------------------- Enum Option Input ---------------------*/}
          <div className='flex gap-2'>
            <Input
              value={enumInput}
              onChange={(e) => {
                setEnumInput(e.target.value)
                setEnumError(null)
              }}
              onKeyDown={handleEnumKeyDown}
              placeholder='Add option...'
              data-testid='builder-enum-input'
              className='flex-1'
            />
            <Button
              type='button'
              variant='outline'
              size='icon'
              onClick={handleAddEnumOption}
              data-testid='builder-enum-add'
              aria-label='Add enum option'
            >
              <Plus className='size-4' />
            </Button>
          </div>

          {/*-------------------- Enum Error Message --------------------*/}
          {enumError && <p className='text-sm text-destructive'>{enumError}</p>}

          <p className='text-xs text-muted-foreground'>Press Enter or click + to add each option</p>
        </div>
      )}

      {/*--------------- Sortable & Required Switches ---------------*/}
      <div className='flex items-center gap-4'>
        <FormSwitch form={form} name='sortable' label='Sortable' testId='builder-sortable' />

        <FormSwitch form={form} name='required' label='Required' testId='builder-required' />
      </div>

      {/*------------------------ Add Button ------------------------*/}
      <Button
        className='w-full'
        type='button'
        variant='secondary'
        data-testid='builder-add'
        aria-label='Add field'
        onClick={() => void handleSubmit(onSubmit)()}
      >
        Add +
      </Button>
    </div>
  )
}
