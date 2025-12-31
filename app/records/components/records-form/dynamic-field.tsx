'use client'

import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

import type { FieldSchema } from '@/lib/drizzle/schema'
import { FormInput } from '@/components/form/form-input'
import { FormSwitch } from '@/components/form/form-switch'
import { FormSelect } from '@/components/form/form-select'
import { FormDatePicker } from '@/components/form/form-date-picker'

/*-------------------------- Types ---------------------------*/
type DynamicFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  readonly form: UseFormReturn<TFieldValues>
  readonly fieldKey: TName
  readonly fieldDef: FieldSchema
  readonly disabled?: boolean
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function DynamicField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ form, fieldKey, fieldDef, disabled, testId }: DynamicFieldProps<TFieldValues, TName>) {
  /*---------------- Build Label With Required -----------------*/
  const label = fieldDef.required ? `${fieldDef.label} *` : fieldDef.label

  /*-------------------------- Render --------------------------*/
  switch (fieldDef.type) {
    case 'number':
      return (
        <FormInput
          form={form}
          name={fieldKey}
          label={label}
          type='number'
          placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
          disabled={disabled}
          testId={testId ?? `field-${fieldKey}`}
        />
      )

    case 'boolean':
      return (
        <FormSwitch
          form={form}
          name={fieldKey}
          label={label}
          disabled={disabled}
          testId={testId ?? `field-${fieldKey}`}
        />
      )

    case 'date':
      return (
        <FormDatePicker
          form={form}
          name={fieldKey}
          label={label}
          disabled={disabled}
          testId={testId ?? `field-${fieldKey}`}
        />
      )

    case 'enum':
      return (
        <FormSelect
          form={form}
          name={fieldKey}
          label={label}
          placeholder={`Select ${fieldDef.label.toLowerCase()}`}
          options={(fieldDef.enumOptions ?? []).map((opt) => ({ label: opt, value: opt }))}
          disabled={disabled}
          testId={testId ?? `field-${fieldKey}`}
        />
      )

    case 'string':
    default:
      return (
        <FormInput
          form={form}
          name={fieldKey}
          label={label}
          placeholder={`Enter ${fieldDef.label.toLowerCase()}`}
          disabled={disabled}
          testId={testId ?? `field-${fieldKey}`}
        />
      )
  }
}
