'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  type FieldSchemaType,
  EntitySchema,
  type EntitySchemaType,
  InsertEntitySchema,
  fieldSchema,
} from '@/lib/drizzle/schema'
import { toSnakeCase, cn } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Form } from '@/components/ui/form'

import { EntityInfoForm } from './entity-info-form'
import { FieldBuilder } from './field-builder'
import { SavedFieldsList } from './saved-fields-list'

/*---------------------- Parent Schema -----------------------*/
// Extend InsertEntitySchema to have fields as an array for the form
const parentSchema = InsertEntitySchema.extend({
  fields: z.array(fieldSchema).min(1, 'Fields must have at least one field'),
})

type ParentFormValues = z.input<typeof parentSchema>

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
    update,
  } = useFieldArray({
    control,
    name: 'fields',
  })

  /*------------------------- Handlers -------------------------*/
  const handleAddField = (field: FieldSchemaType) => {
    append({
      ...field,
    })
  }

  const handleRemoveField = (index: number) => {
    remove(index)
    // After removal, read the latest fields snapshot from the form and update order values
    const current = parentForm.getValues('fields') as FieldSchemaType[] | undefined
    if (!current) return
    for (let i = 0; i < current.length; i++) {
      const f = current[i]
      update(i, { ...f, order: i })
    }
  }

  const handleReorder = (oldIndex: number, newIndex: number) => {
    // First perform reordering using move
    move(oldIndex, newIndex)

    // Read the latest fields snapshot from the form and update order fields
    const current = parentForm.getValues('fields') as FieldSchemaType[] | undefined
    if (!current) return
    for (let i = 0; i < current.length; i++) {
      const f = current[i]
      update(i, { ...f, order: i })
    }
  }

  /*--------------------- Computed Values ----------------------*/
  const existingKeys = savedFields.map((f) => toSnakeCase(f.label))
  const normalizedFields = savedFields.map((f) => ({
    ...f,
    sortable: f.sortable ?? true,
    required: f.required ?? false,
  }))
  const fieldsError = parentForm.formState.errors.fields?.message

  /*-------------------------- Submit --------------------------*/
  const onParentSubmit = (data: ParentFormValues) => {
    /*---------------- Transform to depth1Schema -----------------*/
    const fields: Record<string, FieldSchemaType> = {}
    data.fields.forEach((f, idx) => {
      const key: string = toSnakeCase(f.label)
      fields[key] = {
        label: f.label,
        type: f.type,
        sortable: f.sortable ?? true,
        required: f.required ?? false,
        order: idx, // Use the current index as the order
      }
    })
    /*---------------- Build payload and validate ----------------*/
    const payload: EntitySchemaType = {
      name: data.name,
      description: data.description || undefined,
      fields,
    }

    const result = EntitySchema.safeParse(payload)
    if (!result.success) {
      // For now, log validation errors — in the future we can surface to the form UI
      console.error('Entity insert validation failed:', result.error)
      return
    }

    console.log('Entity payload validated:', result.data)
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
          <Card
            className={cn(
              'shadow-md border-dashed border-4',
              fieldsError ? 'border-destructive' : 'border-primary/20'
            )}
          >
            <CardContent>
              <FieldBuilder onAdd={handleAddField} existingKeys={existingKeys} />
            </CardContent>
          </Card>
          {fieldsError && (
            <p className='text-sm font-medium text-destructive' data-testid='fields-error'>
              {fieldsError}
            </p>
          )}
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
            <SavedFieldsList
              fields={normalizedFields}
              onRemove={handleRemoveField}
              onReorder={handleReorder}
            />
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
