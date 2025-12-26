'use client'

import { UseFormReturn } from 'react-hook-form'

import { FIELD_TYPES } from '@/lib/drizzle/schema'
import { FormInput } from '@/components/form/form-input'
import { FormTextarea } from '@/components/form/form-textarea'

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

type EntityInfoFormProps = {
  readonly form: UseFormReturn<InfoFormValues>
}

/*------------------------ Component -------------------------*/
export function EntityInfoForm({ form }: EntityInfoFormProps) {
  /*-------------------------- Render --------------------------*/
  return (
    <div className='grid grid-cols-1 gap-4'>
      {/*----------------------- Entity Name ------------------------*/}
      <FormInput
        form={form}
        name='name'
        label='Entity name'
        placeholder='e.g., Network Equipment'
        testId='entity-name'
      />

      {/*----------------------- Description ------------------------*/}
      <FormTextarea
        form={form}
        name='description'
        label='Description'
        placeholder='Optional description'
        testId='entity-desc'
      />
    </div>
  )
}
