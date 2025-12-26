'use client'

import { useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'

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

import { EntityInfoForm } from './entity-info-form'
import { FieldBuilder } from './field-builder'
import { SavedFieldsList } from './saved-fields-list'

import Link from 'next/link'
import { createEntity } from '@/app/entities/actions/create-entity'

/*---------------------- Parent Schema -----------------------*/
// Extend InsertEntitySchema to have fields as an array for the form
const parentSchema = InsertEntitySchema.extend({
  fields: z.array(fieldSchema).min(1, 'Fields must have at least one field'),
})

type ParentFormValues = z.input<typeof parentSchema>

/*------------------------ Component -------------------------*/
export default function CreateEntityForm() {
  /*-------------------------- State ---------------------------*/
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

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
      console.error('Entity insert validation failed:', result.error)
      toast.error('Validation failed. Please check your input.')
      return
    }

    /*--------------------- Submit to Server ---------------------*/
    startTransition(async () => {
      const actionResult = await createEntity(result.data)

      if (!actionResult.success) {
        toast.error(actionResult.error)

        // Handle field-level errors
        if (actionResult.fieldErrors) {
          Object.entries(actionResult.fieldErrors).forEach(([field, errors]) => {
            if (field === 'name') {
              parentForm.setError('name', { message: errors[0] })
            } else if (field === 'description') {
              parentForm.setError('description', { message: errors[0] })
            }
          })
        }
        return
      }

      toast.success('Entity created successfully!')
      router.push('/entities')
    })
  }

  /*-------------------------- Render --------------------------*/
  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onParentSubmit)(e)
      }}
      className='flex flex-col max-w-6xl w-full m-auto gap-8 px-4 sm:px-6'
    >
      {/*-------------------------- Header --------------------------*/}
      <div className='flex flex-row items-center justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Create New Entity</h1>
          <p className='text-muted-foreground'>
            Define the structure and properties of a new resource type in your system.
          </p>
        </div>
        <Button asChild data-testid='back-to-entities' variant='secondary'>
          <Link href='/entities'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Link>
        </Button>
      </div>

      <div className='flex flex-col md:flex-row gap-8'>
        {/*------------- Left Column — Details & Builder --------------*/}
        <div className='flex-1 flex flex-col md:w-7/12 gap-8'>
          {/*----------------------- Entity Info ------------------------*/}
          <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold'>1. Entity Details</h2>
              {/*---------------------- Submit Button -----------------------*/}
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  size='lg'
                  disabled={isPending}
                  data-testid='save-entity'
                  className='w-full md:w-auto shadow-lg shadow-primary/20'
                >
                  {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {isPending ? 'Creating...' : 'Create Entity'}
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
        </div>

        {/*------------- Right Column — Saved Fields List -------------*/}
        <div className='flex-1 md:w-5/12'>
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
              <div className='max-h-[40vh] md:max-h-[60vh] overflow-auto'>
                <SavedFieldsList
                  fields={normalizedFields}
                  onRemove={handleRemoveField}
                  onReorder={handleReorder}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
