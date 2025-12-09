'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FIELD_TYPES, type fieldDefinitionSchemaType } from '@/lib/drizzle/schema'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
    move,
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

  const handleReorder = (oldIndex: number, newIndex: number) => {
    move(oldIndex, newIndex)
  }

  const onParentSubmit = (data: ParentFormValues) => {
    /*---------------- Transform to depth1Schema -----------------*/
    const depth1Schema: Record<string, fieldDefinitionSchemaType> = {}
    data.fields.forEach((f, idx) => {
      depth1Schema[f.key] = {
        label: f.label,
        type: f.type,
        sortable: f.sortable,
        required: f.required,
        order: idx, // Use the current index as the order
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
        className='flex flex-col max-w-4xl m-auto gap-8'
      >
        {/*-------------------------- Header --------------------------*/}
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Create New Entity</h1>
          <p className='text-muted-foreground'>
            Define the structure and properties of a new resource type in your system.
          </p>
        </div>

        {/*----------------------- Main Content -----------------------*/}
        {/*----------------------- Entity Info ------------------------*/}
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold'>1. Entity Details</h2>
            {/*---------------------- Submit Button -----------------------*/}
            <div className='flex justify-end'>
              <Button
                type='submit'
                size='lg'
                data-testid='save-entity'
                className='w-full sm:w-auto shadow-lg shadow-primary/20'
              >
                Create Entity
              </Button>
            </div>
          </div>
          <Separator />
          <EntityInfoForm form={parentForm} />
        </div>
        {/*---------------------- Field Builder -----------------------*/}
        <div className='flex flex-col gap-4'>
          <h2 className='text-xl font-semibold'>2. Define Fields</h2>
          <Separator />
          <p className='text-muted-foreground text-sm'>
            Configure and add a new field to your entity.
          </p>
          <Card className='border-primary/20 shadow-md border-dashed border-4'>
            <CardContent className=''>
              <FieldBuilder onAdd={handleAddField} existingKeys={savedFields.map((f) => f.key)} />
            </CardContent>
          </Card>
        </div>
        {/*-------------------- Saved Fields List ---------------------*/}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <div className='flex flex-col space-y-1.5'>
              <CardTitle>Entity Fields</CardTitle>
              <CardDescription>Add fields using the builder on the top.</CardDescription>
            </div>
            <div className='text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md'>
              {savedFields.length} Fields Configured
            </div>
          </CardHeader>
          <CardContent>
            <SavedFieldsList fields={savedFields} onRemove={remove} onReorder={handleReorder} />
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
