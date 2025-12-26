'use client'

import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils/common-utils'
import { Switch } from '@/components/ui/switch'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'

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
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn('flex flex-row items-center justify-between gap-2', className)}>
          {/*------------------- Label & Description --------------------*/}
          <div className='space-y-0.5'>
            {label && <FormLabel className='font-normal'>{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
          </div>

          {/*-------------------------- Switch --------------------------*/}
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              data-testid={testId}
              aria-label={label}
            />
          </FormControl>

          {/*---------------------- Error Message -----------------------*/}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
