'use client'

import { z } from 'zod/v4'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { type FieldSchema, FIELD_TYPES } from '@/lib/drizzle/schema'
import { toSnakeCase } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'

type FieldBuilderProps = {
  readonly onAdd: (field: FieldSchema) => void
  readonly existingKeys: string[]
}

/*---------------------- Builder Schema ----------------------*/
const builderFormSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(FIELD_TYPES),
  sortable: z.boolean(),
  required: z.boolean(),
})

type BuilderFormValues = z.infer<typeof builderFormSchema>

/*------------------------ Component -------------------------*/
export function FieldBuilder({ onAdd, existingKeys }: FieldBuilderProps) {
  /*------------------------ Form Setup ------------------------*/
  const form = useForm<BuilderFormValues>({
    resolver: zodResolver(builderFormSchema),
    defaultValues: {
      label: '',
      type: FIELD_TYPES[0],
      sortable: true,
      required: false,
    },
  })

  const { handleSubmit, reset } = form

  /*------------------------- Handlers -------------------------*/
  const onSubmit = (values: BuilderFormValues) => {
    const base = toSnakeCase(values.label)
    let key = base || 'field'
    let i = 1
    while (existingKeys.includes(key)) {
      key = `${base}_${String(i)}`
      i += 1
    }

    onAdd({
      ...values,
      order: existingKeys.length,
    })
    reset()
  }

  /*-------------------------- Render --------------------------*/
  return (
    <div className='flex flex-col gap-4'>
      {/*----------------------- Label Input ------------------------*/}
      <FormInput
        form={form}
        name='label'
        label='Label'
        placeholder='e.g., Name, Age, Email'
        description='Used to generate the human label & snake_case key.'
        testId='builder-label'
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            void handleSubmit(onSubmit)()
          }
        }}
      />

      {/*----------------------- Type Select ------------------------*/}
      <FormSelect
        form={form}
        name='type'
        label='Type'
        placeholder='Select type'
        options={FIELD_TYPES}
        testId='builder-type'
      />

      {/*--------------- Sortable & Required Switches ---------------*/}
      <div className='flex items-center gap-4'>
        <FormSwitch form={form} name='sortable' label='Sortable' testId='builder-sortable' />

        <FormSwitch form={form} name='required' label='Required' testId='builder-required' />
      </div>

      {/*------------------------ Add Button ------------------------*/}
      <Button
        className='w-full'
        type='button'
        variant='secondary'
        data-testid='builder-add'
        aria-label='Add field'
        onClick={() => void handleSubmit(onSubmit)()}
      >
        Add +
      </Button>
    </div>
  )
}
