'use client'

import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils/common-utils'
import { Textarea } from '@/components/ui/textarea'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

type FormTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  readonly form: UseFormReturn<TFieldValues>
  readonly name: TName
  readonly label?: string
  readonly placeholder?: string
  readonly description?: string
  readonly className?: string
  readonly textareaClassName?: string
  readonly disabled?: boolean
  readonly rows?: number
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function FormTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  form,
  name,
  label,
  placeholder,
  description,
  className,
  textareaClassName,
  disabled,
  rows,
  testId,
}: FormTextareaProps<TFieldValues, TName>) {
  /*-------------------------- Render --------------------------*/
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(className)} data-invalid={fieldState.invalid} data-disabled={disabled}>
          {/*-------------------------- Label ---------------------------*/}
          {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}

          {/*------------------------- Textarea -------------------------*/}
          <Textarea
            {...field}
            id={field.name}
            aria-invalid={fieldState.invalid}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={textareaClassName}
            data-testid={testId}
            value={field.value ?? ''}
          />

          {/*----------------------- Description ------------------------*/}
          {description && <FieldDescription>{description}</FieldDescription>}

          {/*---------------------- Error Message -----------------------*/}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
