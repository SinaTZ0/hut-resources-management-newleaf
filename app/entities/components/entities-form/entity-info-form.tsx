'use client'

import { UseFormReturn } from 'react-hook-form'

import { FormInput } from '@/components/form/form-input'
import { FormTextarea } from '@/components/form/form-textarea'

import { type EntityFormInputValues } from './entities-form-schema'

type EntityInfoFormProps = {
  readonly form: UseFormReturn<EntityFormInputValues>
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
