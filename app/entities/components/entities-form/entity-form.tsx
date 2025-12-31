'use client'

import { useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

import {
  type FieldSchema,
  type FieldValue,
  type EntitySchema,
  type InsertEntitySchema,
  insertEntitySchema,
} from '@/lib/drizzle/schema'
import { cn, toSnakeCase } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createEntity } from '@/app/entities/actions/create-entity'
import { updateEntity } from '@/app/entities/actions/update-entity'
import type { ActionResult } from '@/types-and-schemas/common'

import { SavedFieldsList } from './saved-fields-list'
import { FieldBuilder } from './field-builder'
import { EntityInfoForm } from './entity-info-form'
import { entityFormSchema, type EntityFormValues } from './entities-form-schema'

/*------------------------ Props Type ------------------------*/
type EntityFormProps = {
  readonly mode: 'create' | 'edit'
  readonly initialData?: EntitySchema
}

/*------------------------ Component -------------------------*/
export function CreateAndUpdateEntityForm({ mode, initialData }: EntityFormProps) {
  /*-------------------------- State ---------------------------*/
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const isEditMode = mode === 'edit'

  /*----------- Transform Initial Data for Edit Mode -----------*/
  const getInitialFields = (): EntityFormValues['fields'] => {
    if (!initialData?.fields) return []

    return Object.entries(initialData.fields)
      .map(([_, field]) => ({
        label: field.label,
        type: field.type,
        sortable: field.sortable,
        required: field.required,
        order: field.order,
        enumOptions: field.type === 'enum' ? field.enumOptions : undefined,
      }))
      .sort((a, b) => a.order - b.order)
  }
  /*------------------------ Form Setup ------------------------*/
  const form = useForm({
    resolver: zodResolver(entityFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      fields: getInitialFields(),
    },
  })

  const { control, handleSubmit } = form

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
  const handleAddField = (field: FieldSchema) => {
    append({
      ...field,
    })
  }

  const handleRemoveField = (index: number) => {
    remove(index)
  }

  const handleReorder = (oldIndex: number, newIndex: number) => {
    move(oldIndex, newIndex)
  }

  /*--------------------- Computed Values ----------------------*/
  const existingKeys = savedFields.map((f) => toSnakeCase(f.label))
  const getButtonText = () => {
    if (isPending) {
      return isEditMode ? 'Updating...' : 'Creating...'
    }
    return isEditMode ? 'Update Entity' : 'Create Entity'
  }
  // Normalize fields with defaults for SavedFieldsList (which expects FieldSchema)
  const normalizedFields: FieldSchema[] = savedFields.map((f) => ({
    ...f,
    sortable: f.sortable ?? true,
    required: f.required ?? false,
    enumOptions: f.type === 'enum' ? f.enumOptions : undefined,
  }))
  const fieldsError = form.formState.errors.fields?.message

  /*---------------------- Theme Classes -----------------------*/
  const themeClasses = isEditMode
    ? {
        button: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
        card: 'border-emerald-500/20 bg-emerald-500/3',
      }
    : {
        button: 'shadow-primary/20',
        card: '',
      }

  /*-------------------------- Submit --------------------------*/
  const onSubmit = (data: EntityFormValues) => {
    /*----------- Validate Unique Generated Field Keys -----------*/
    const fieldKeys = data.fields.map((f) => toSnakeCase(f.label))
    const emptyKeys = fieldKeys.filter((k) => !k)
    if (emptyKeys.length > 0) {
      form.setError('fields', {
        message: 'One or more field labels produce an invalid key. Please update the labels.',
      })
      toast.error('Invalid field label detected. Please update the label(s).')
      return
    }

    const duplicateKeys = fieldKeys.filter((key, idx) => fieldKeys.indexOf(key) !== idx)
    if (duplicateKeys.length > 0) {
      const uniqueDuplicates = Array.from(new Set(duplicateKeys))
      form.setError('fields', {
        message: `Duplicate field keys detected: ${uniqueDuplicates.join(', ')}`,
      })
      toast.error('Duplicate field labels detected. Please make them unique.')
      return
    }

    form.clearErrors('fields')

    /*--------------- Transform to array to record ---------------*/
    const fields: Record<string, FieldSchema> = {}
    const defaultValues: Record<string, FieldValue> = {}

    data.fields.forEach((f, idx) => {
      const key: string = toSnakeCase(f.label)
      fields[key] = {
        label: f.label,
        type: f.type,
        sortable: f.sortable,
        required: f.required,
        order: idx,
        enumOptions: f.type === 'enum' ? f.enumOptions : undefined,
      }

      // Collect default values for new required fields (edit mode only)
      if (isEditMode && f.required && f.defaultValue !== undefined) {
        defaultValues[key] = f.defaultValue
      }
    })

    /*---------------- Build payload and validate ----------------*/
    const payload: InsertEntitySchema = {
      name: data.name,
      description: data.description,
      fields,
    }

    const result = insertEntitySchema.safeParse(payload)
    if (!result.success) {
      toast.error('Validation failed. Please check your input.')
      return
    }

    /*--------------------- Submit to Server ---------------------*/
    startTransition(async () => {
      let actionResult: ActionResult<{ id: string }>

      if (isEditMode && initialData?.id) {
        actionResult = await updateEntity({
          ...result.data,
          id: initialData.id,
          defaultValues: Object.keys(defaultValues).length > 0 ? defaultValues : undefined,
        })
      } else {
        actionResult = await createEntity(result.data)
      }

      if (!actionResult.success) {
        toast.error(actionResult.error)

        // Attach field errors to form fields
        if (actionResult.fieldErrors) {
          Object.entries(actionResult.fieldErrors).forEach(([field, fieldErrors]) => {
            if (field === 'name') {
              form.setError('name', { message: fieldErrors[0] })
            } else if (field === 'description') {
              form.setError('description', { message: fieldErrors[0] })
            }
          })
        }
        return
      }

      toast.success(isEditMode ? 'Entity updated successfully!' : 'Entity created successfully!')
      router.push('/entities')
    })
  }

  /*-------------------------- Render --------------------------*/
  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e)
      }}
      className='flex flex-col max-w-6xl w-full m-auto gap-8 px-4 sm:px-6'
    >
      {/*-------------------------- Header --------------------------*/}
      <div className='flex items-start gap-4'>
        <Button variant='ghost' size='icon' asChild data-testid='back-to-entities'>
          <Link href='/entities'>
            <ArrowLeft className='size-6' />
            <span className='sr-only'>Back to entities</span>
          </Link>
        </Button>
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl font-bold tracking-tight'>
            {isEditMode ? 'Edit Entity' : 'Create New Entity'}
          </h1>
          <p className='text-muted-foreground'>
            {isEditMode
              ? 'Modify the structure and properties of your entity.'
              : 'Define the structure and properties of a new resource type in your system.'}
          </p>
        </div>
      </div>

      <div className='flex flex-col md:flex-row gap-8'>
        {/*------------- Left Column — Details & Builder --------------*/}
        <div className='flex-1 flex flex-col md:w-7/12 gap-8'>
          {/*----------------------- Entity Info ------------------------*/}
          <div className='flex flex-col gap-4'>
            <h2 className='text-xl font-semibold'>1. Entity Details</h2>

            <Separator />
            <EntityInfoForm form={form} />
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
                fieldsError ? 'border-destructive' : themeClasses.card
              )}
            >
              <CardContent>
                <FieldBuilder onAdd={handleAddField} existingKeys={existingKeys} mode={mode} />
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
          {/*----------------------- Entity Info ------------------------*/}
          <div className='flex flex-col gap-4'>
            <h2 className='text-xl font-semibold'>3. Saved Fields</h2>
            <Separator />
            <Card className={themeClasses.card}>
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
                {/* 51.5vh is magic number so it match le Left Column height */}
                <div className='max-h-[40vh] md:max-h-[51.5vh] overflow-auto'>
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
      </div>

      {/*---------------------- Submit Button -----------------------*/}
      <div className='flex justify-end mt-4 mb-12'>
        <Button
          type='submit'
          size='lg'
          disabled={isPending}
          data-testid='save-entity'
          className={cn(
            'w-full md:w-[200px] h-[52px] shadow-lg text-base font-semibold transition-all duration-200 active:scale-95',
            themeClasses.button
          )}
        >
          {isPending && <Loader2 className='mr-2 h-5 w-5 animate-spin' />}
          {getButtonText()}
        </Button>
      </div>
    </form>
  )
}
