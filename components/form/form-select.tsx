'use client'

import { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'

import { cn } from '@/lib/utils/common-utils'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
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
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn(className)}>
          {/*-------------------------- Label ---------------------------*/}
          {label && <FormLabel>{label}</FormLabel>}

          {/*-------------------------- Select --------------------------*/}
          <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
            <FormControl>
              <SelectTrigger className={triggerClassName} data-testid={testId}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
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
          {description && <FormDescription>{description}</FormDescription>}

          {/*---------------------- Error Message -----------------------*/}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
