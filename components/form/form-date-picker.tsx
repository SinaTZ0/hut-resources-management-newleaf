'use client'

import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

/*-------------------------- Types ---------------------------*/
type FormDatePickerProps<
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
export function FormDatePicker<
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
}: FormDatePickerProps<TFieldValues, TName>) {
  /*-------------------------- Render --------------------------*/
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(className)} data-invalid={fieldState.invalid} data-disabled={disabled}>
          {/*-------------------------- Label ---------------------------*/}
          {label && <FieldLabel>{label}</FieldLabel>}

          {/*------------------------- Popover --------------------------*/}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !field.value && 'text-muted-foreground'
                )}
                disabled={disabled}
                data-testid={testId}
                aria-invalid={fieldState.invalid}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={field.onChange}
              />
            </PopoverContent>
          </Popover>

          {/*----------------------- Description ------------------------*/}
          {description && <FieldDescription>{description}</FieldDescription>}

          {/*---------------------- Error Message -----------------------*/}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
