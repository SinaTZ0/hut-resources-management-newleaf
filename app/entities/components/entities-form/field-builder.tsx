'use client'

import { useState } from 'react'
import { z } from 'zod/v4'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Plus, AlertTriangle } from 'lucide-react'

import { FIELD_TYPES, enumOptionsSchema, type FieldValue } from '@/lib/drizzle/schema'
import { toSnakeCase } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'
import { FormDatePicker } from '@/components/form/form-date-picker'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

import { type EntityFormValues } from './entities-form-schema'

type FieldBuilderProps = {
  readonly onAdd: (field: EntityFormValues['fields'][number]) => void
  readonly existingKeys: string[]
  readonly mode?: 'create' | 'edit'
}

/*---------------------- Builder Schema ----------------------*/
// defaultValue can be string, number, boolean, or Date depending on field type
const builderFormSchema = z
  .object({
    label: z.string().min(1, 'Label is required'),
    type: z.enum(FIELD_TYPES),
    sortable: z.boolean(),
    required: z.boolean(),
    enumOptions: enumOptionsSchema.optional(),
    defaultValue: z.union([z.string(), z.number(), z.boolean(), z.date()]).optional(),
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

/*--------- Helper: Resolve Default Value for Field ----------*/
function resolveDefaultValue(values: BuilderFormValues): FieldValue | undefined {
  // For enum fields, require the user to explicitly select a default value.
  if (values.type === 'enum' && values.enumOptions && values.enumOptions.length > 0) {
    if (typeof values.defaultValue !== 'string') return undefined
    if (!values.enumOptions.includes(values.defaultValue)) return undefined
    return values.defaultValue
  }

  // No default value provided
  if (values.defaultValue === undefined || values.defaultValue === '') {
    return undefined
  }

  // For number fields, HTML input returns string, so convert it
  if (values.type === 'number' && typeof values.defaultValue === 'string') {
    const num = Number(values.defaultValue)
    return isNaN(num) ? 0 : num
  }

  // For boolean and date, the value is already the correct type
  return values.defaultValue
}

/*------------------------ Component -------------------------*/
export function FieldBuilder({ onAdd, existingKeys, mode = 'create' }: FieldBuilderProps) {
  /*-------------------------- State ---------------------------*/
  const [enumInput, setEnumInput] = useState('')
  const [enumOptions, setEnumOptions] = useState<string[]>([])
  const [enumError, setEnumError] = useState<string | null>(null)

  const isEditMode = mode === 'edit'

  /*------------------------ Form Setup ------------------------*/
  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(builderFormSchema),
    defaultValues: {
      label: '',
      type: FIELD_TYPES[0],
      sortable: true,
      required: false,
      enumOptions: undefined,
      defaultValue: undefined,
    },
  })

  const { handleSubmit, reset, setValue, setError, clearErrors, control } = form

  /*----------------------- Watch Fields -----------------------*/
  const selectedType = useWatch({ control, name: 'type' })
  const isRequired = useWatch({ control, name: 'required' })
  const isEnumType = selectedType === 'enum'
  const showDefaultValueInput = isEditMode && isRequired
  const showEnumDefaultSelect = showDefaultValueInput && isEnumType && enumOptions.length > 0

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
    const key = toSnakeCase(values.label)
    if (!key) {
      setError('label', { message: 'Label must generate a valid key' })
      return
    }

    if (existingKeys.includes(key)) {
      setError('label', { message: `A field with key "${key}" already exists` })
      return
    }

    const shouldIncludeDefault = isEditMode && values.required
    const defaultValue = shouldIncludeDefault ? resolveDefaultValue(values) : undefined

    if (shouldIncludeDefault) {
      const isMissingDefault = defaultValue === undefined || defaultValue === null
      if (isMissingDefault) {
        setError('defaultValue', {
          message:
            values.type === 'enum'
              ? 'Default value is required. Please select an option.'
              : 'Default value is required when field is marked as required',
        })
        return
      }
    }

    clearErrors(['label', 'defaultValue'])

    onAdd({
      ...values,
      order: existingKeys.length,
      enumOptions: values.type === 'enum' ? values.enumOptions : undefined,
      defaultValue,
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
        options={FIELD_TYPES.map((t) => ({ label: t, value: t }))}
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

      {/*------------ Default Value for Required Fields -------------*/}
      {showDefaultValueInput && !isEnumType && (
        <div className='flex flex-col gap-2'>
          {/*------------- Render input based on field type -------------*/}
          {selectedType === 'string' && (
            <FormInput
              form={form}
              name='defaultValue'
              label='Default Value'
              placeholder='e.g., N/A, Unknown, Default'
              testId='builder-default-value'
            />
          )}
          {selectedType === 'number' && (
            <FormInput
              form={form}
              name='defaultValue'
              label='Default Value'
              placeholder='e.g., 0'
              type='number'
              testId='builder-default-value'
            />
          )}
          {selectedType === 'boolean' && (
            <FormSwitch
              form={form}
              name='defaultValue'
              label='Default Value'
              testId='builder-default-value'
            />
          )}
          {selectedType === 'date' && (
            <FormDatePicker
              form={form}
              name='defaultValue'
              label='Default Value'
              testId='builder-default-value'
            />
          )}
          <div className='flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20'>
            <AlertTriangle className='size-4 text-amber-500 shrink-0 mt-0.5' />
            <p className='text-xs text-amber-600 dark:text-amber-400'>
              This value will be applied to all existing records that don&apos;t have this field.
            </p>
          </div>
        </div>
      )}

      {/*---------- Enum Default Value Select (Edit Mode) -----------*/}
      {showEnumDefaultSelect && (
        <div className='flex flex-col gap-2'>
          <FormSelect
            form={form}
            name='defaultValue'
            label='Default Value'
            placeholder='Select default option'
            testId='builder-default-value'
            options={enumOptions.map((opt) => ({ label: opt, value: opt }))}
          />
          <div className='flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20'>
            <AlertTriangle className='size-4 text-amber-500 shrink-0 mt-0.5' />
            <p className='text-xs text-amber-600 dark:text-amber-400'>
              This value will be applied to all existing records that don&apos;t have this field.
            </p>
          </div>
        </div>
      )}

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
