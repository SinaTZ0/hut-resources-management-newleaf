'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FIELD_TYPES, type fieldDefinitionSchemaType } from '@/lib/drizzle/schema'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'

import { FieldBuilder } from './field-builder'
import { SavedFieldsList } from './saved-fields-list'
import { EntityInfoForm } from './entity-info-form'

/*---------------------- Parent Schema -----------------------*/
const parentSchema = z.object({
  name: z.string().min(1, 'Entity name is required'),
  description: z.string().optional(),
  fields: z.array(
    z.object({
      label: z.string(),
      type: z.enum(FIELD_TYPES),
      sortable: z.boolean(),
      required: z.boolean(),
      order: z.number(),
      key: z.string(),
      id: z.string(),
    })
  ),
})

type ParentFormValues = z.infer<typeof parentSchema>

/*------------------------ Component -------------------------*/
export default function CreateEntityForm() {
  /*----------------------- Parent Form ------------------------*/
  const parentForm = useForm<ParentFormValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      name: '',
      description: '',
      fields: [],
    },
  })

  const { control, handleSubmit } = parentForm

  const {
    fields: savedFields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'fields',
  })

  /*------------------------- Handlers -------------------------*/
  const handleAddField = (field: fieldDefinitionSchemaType & { key: string }) => {
    append({
      ...field,
      id: `${field.key}-${String(Date.now())}`,
    })
  }

  const onParentSubmit = (data: ParentFormValues) => {
    /*---------------- Transform to depth1Schema -----------------*/
    const depth1Schema: Record<string, fieldDefinitionSchemaType> = {}
    data.fields.forEach((f) => {
      depth1Schema[f.key] = {
        label: f.label,
        type: f.type,
        sortable: f.sortable,
        required: f.required,
        order: f.order,
      }
    })

    console.log('Entity payload:', {
      name: data.name,
      description: data.description,
      depth1Schema,
    })
  }

  /*-------------------------- Render --------------------------*/
  return (
    <Form {...parentForm}>
      <form
        onSubmit={(e) => {
          void handleSubmit(onParentSubmit)(e)
        }}
        className='space-y-6'
      >
        {/*-------------------------- Header --------------------------*/}
        <div className='flex justify-between items-center'>
          <h2 className='text-lg font-semibold'>Create Entity</h2>
        </div>

        {/*----------------------- Entity Info ------------------------*/}
        <EntityInfoForm form={parentForm} />

        {/*------------------ Builder & Saved Fields ------------------*/}
        <div className='grid md:grid-cols-2 gap-6'>
          {/*---------------------- Field Builder -----------------------*/}
          <div className='p-4 border rounded-lg bg-muted'>
            <h3 id='builder-heading' className='text-sm font-medium mb-4'>
              Staging / Builder
            </h3>
            <FieldBuilder onAdd={handleAddField} existingKeys={savedFields.map((f) => f.key)} />
          </div>

          {/*-------------------- Saved Fields List ---------------------*/}
          <div className='p-4 border rounded-lg'>
            <h3 className='text-sm font-medium mb-4'>Saved Fields</h3>
            <SavedFieldsList fields={savedFields} onRemove={remove} />
          </div>
        </div>

        {/*---------------------- Submit Button -----------------------*/}
        <div className='flex items-center justify-end'>
          <Button type='submit' data-testid='save-entity'>
            Save
          </Button>
        </div>
      </form>
    </Form>
  )
}
