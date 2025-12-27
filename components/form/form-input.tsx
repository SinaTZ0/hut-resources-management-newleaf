'use client'

import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils/common-utils'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

type FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  readonly form: UseFormReturn<TFieldValues>
  readonly name: TName
  readonly label?: string
  readonly placeholder?: string
  readonly description?: string
  readonly type?: React.ComponentProps<'input'>['type']
  readonly className?: string
  readonly inputClassName?: string
  readonly disabled?: boolean
  readonly testId?: string
  readonly onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
}

/*------------------------ Component -------------------------*/
export function FormInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  form,
  name,
  label,
  placeholder,
  description,
  type = 'text',
  className,
  inputClassName,
  disabled,
  testId,
  onKeyDown,
}: FormInputProps<TFieldValues, TName>) {
  /*-------------------------- Render --------------------------*/
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(className)} data-invalid={fieldState.invalid} data-disabled={disabled}>
          {/*-------------------------- Label ---------------------------*/}
          {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}

          {/*-------------------------- Input ---------------------------*/}
          <Input
            {...field}
            id={field.name}
            aria-invalid={fieldState.invalid}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClassName}
            data-testid={testId}
            onKeyDown={onKeyDown}
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
