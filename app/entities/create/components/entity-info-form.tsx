'use client'

import { UseFormReturn } from 'react-hook-form'

import { FIELD_TYPES } from '@/lib/drizzle/schema'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type InfoFormValues = {
  name: string
  description?: string | null
  fields: Array<{
    label: string
    type: (typeof FIELD_TYPES)[number]
    sortable?: boolean
    required?: boolean
    order: number
  }>
}

interface EntityInfoFormProps {
  readonly form: UseFormReturn<InfoFormValues>
}

/*------------------------ Component -------------------------*/
export function EntityInfoForm({ form }: EntityInfoFormProps) {
  /*-------------------------- Render --------------------------*/
  return (
    <div className='grid grid-cols-1 gap-4'>
      {/*----------------------- Entity Name ------------------------*/}
      <FormField
        control={form.control}
        name='name'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Entity name</FormLabel>
            <FormControl>
              <Input
                id='entity-name'
                placeholder='e.g., Network Equipment'
                {...field}
                data-testid='entity-name'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/*----------------------- Description ------------------------*/}
      <FormField
        control={form.control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                id='entity-desc'
                placeholder='Optional description'
                {...field}
                value={field.value ?? ''}
                data-testid='entity-desc'
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
