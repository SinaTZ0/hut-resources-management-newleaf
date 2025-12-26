'use client'

import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils/common-utils'
import { Input } from '@/components/ui/input'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'

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
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          {/*-------------------------- Label ---------------------------*/}
          {label && <FormLabel>{label}</FormLabel>}

          {/*-------------------------- Input ---------------------------*/}
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              className={inputClassName}
              data-testid={testId}
              onKeyDown={onKeyDown}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>

          {/*----------------------- Description ------------------------*/}
          {description && <FormDescription>{description}</FormDescription>}

          {/*---------------------- Error Message -----------------------*/}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
