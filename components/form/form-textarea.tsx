'use client'

import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils/common-utils'
import { Textarea } from '@/components/ui/textarea'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'

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
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          {/*-------------------------- Label ---------------------------*/}
          {label && <FormLabel>{label}</FormLabel>}

          {/*------------------------- Textarea -------------------------*/}
          <FormControl>
            <Textarea
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className={textareaClassName}
              data-testid={testId}
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
