'use client'

import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

import type { FieldsSchema } from '@/lib/drizzle/schema'
import { FieldGroup } from '@/components/ui/field'

import { DynamicField } from './dynamic-field'

/*-------------------------- Types ---------------------------*/
type Depth1FormProps<TFieldValues extends FieldValues = FieldValues> = {
  readonly form: UseFormReturn<TFieldValues>
  readonly FieldsSchema: FieldsSchema
  readonly disabled?: boolean
}

/*------------------------ Component -------------------------*/
export function Depth1Form<TFieldValues extends FieldValues = FieldValues>({
  form,
  FieldsSchema,
  disabled,
}: Depth1FormProps<TFieldValues>) {
  /*------------------- Sort Fields By Order -------------------*/
  const sortedFields = Object.entries(FieldsSchema).sort(([, a], [, b]) => a.order - b.order)

  /*-------------------------- Render --------------------------*/
  return (
    <FieldGroup data-testid='depth1-form-fields'>
      {sortedFields.map(([key, fieldDef]) => (
        <DynamicField
          form={form}
          key={key}
          fieldKey={key as FieldPath<TFieldValues>}
          fieldDef={fieldDef}
          disabled={disabled}
          testId={`depth1-field-${key}`}
        />
      ))}
    </FieldGroup>
  )
}
