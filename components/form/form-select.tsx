'use client'

import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils/common-utils'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select'

type SelectOption = {
  value: string
  label: string
}

type FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  readonly form: UseFormReturn<TFieldValues>
  readonly name: TName
  readonly label?: string
  readonly placeholder?: string
  readonly description?: string
  readonly options: readonly SelectOption[] | readonly string[]
  readonly className?: string
  readonly triggerClassName?: string
  readonly disabled?: boolean
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function FormSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  form,
  name,
  label,
  placeholder = 'Select an option',
  description,
  options,
  className,
  triggerClassName,
  disabled,
  testId,
}: FormSelectProps<TFieldValues, TName>) {
  /*-------------------- Normalize Options ---------------------*/
  const normalizedOptions: SelectOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  /*-------------------------- Render --------------------------*/
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(className)} data-invalid={fieldState.invalid} data-disabled={disabled}>
          {/*-------------------------- Label ---------------------------*/}
          {label && <FieldLabel htmlFor={field.name}>{label}</FieldLabel>}

          {/*-------------------------- Select --------------------------*/}
          <Select
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger
              id={field.name}
              aria-invalid={fieldState.invalid}
              className={triggerClassName}
              data-testid={testId}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {normalizedOptions.map((opt) => (
                  <SelectItem value={opt.value} key={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/*----------------------- Description ------------------------*/}
          {description && <FieldDescription>{description}</FieldDescription>}

          {/*---------------------- Error Message -----------------------*/}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
