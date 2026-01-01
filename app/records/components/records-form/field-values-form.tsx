'use client'

import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

import type { FieldsSchema } from '@/lib/drizzle/schema'
import { FieldGroup } from '@/components/ui/field'

import { DynamicField } from './dynamic-field'

/*-------------------------- Types ---------------------------*/
type FieldValuesFormProps<TFieldValues extends FieldValues = FieldValues> = {
  readonly form: UseFormReturn<TFieldValues>
  readonly FieldsSchema: FieldsSchema
  readonly disabled?: boolean
}

/*------------------------ Component -------------------------*/
export function FieldValuesForm<TFieldValues extends FieldValues = FieldValues>({
  form,
  FieldsSchema,
  disabled,
}: FieldValuesFormProps<TFieldValues>) {
  /*------------------- Sort Fields By Order -------------------*/
  const sortedFields = Object.entries(FieldsSchema).sort(([, a], [, b]) => a.order - b.order)

  /*-------------------------- Render --------------------------*/
  return (
    <FieldGroup
      className='grid grid-cols-1 md:grid-cols-2 gap-6'
      data-testid='field-values-form-fields'
    >
      {sortedFields.map(([key, fieldDef]) => (
        <DynamicField
          form={form}
          key={key}
          fieldKey={key as FieldPath<TFieldValues>}
          fieldDef={fieldDef}
          disabled={disabled}
          testId={`field-values-field-${key}`}
        />
      ))}
    </FieldGroup>
  )
}
