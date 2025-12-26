'use client'

import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils/common-utils'
import { Switch } from '@/components/ui/switch'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'

type FormSwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  readonly form: UseFormReturn<TFieldValues>
  readonly name: TName
  readonly label?: string
  readonly description?: string
  readonly className?: string
  readonly disabled?: boolean
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function FormSwitch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  form,
  name,
  label,
  description,
  className,
  disabled,
  testId,
}: FormSwitchProps<TFieldValues, TName>) {
  /*-------------------------- Render --------------------------*/
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field
          orientation='horizontal'
          className={cn(className)}
          data-invalid={fieldState.invalid}
          data-disabled={disabled}
        >
          {/*------------------- Label & Description --------------------*/}
          <FieldContent>
            {label && (
              <FieldLabel htmlFor={field.name} className='font-normal'>
                {label}
              </FieldLabel>
            )}
            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldContent>

          {/*-------------------------- Switch --------------------------*/}
          <Switch
            id={field.name}
            name={field.name}
            checked={field.value}
            onCheckedChange={field.onChange}
            disabled={disabled}
            data-testid={testId}
            aria-invalid={fieldState.invalid}
            aria-label={label}
          />
        </Field>
      )}
    />
  )
}
