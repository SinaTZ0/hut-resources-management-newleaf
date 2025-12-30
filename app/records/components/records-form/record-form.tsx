'use client'

import { useTransition, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

import type { EntitySchema, FieldValues, Metadata, RecordSchema } from '@/lib/drizzle/schema'
import { cn } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createRecord } from '@/app/records/actions/create-record'
import { updateRecord } from '@/app/records/actions/update-record'

import { createFieldValuesFormSchema, getDefaultFieldValues } from './record-form-schema'
import { FieldValuesForm } from './field-values-form'
import { MetadataEditor } from './metadata-editor'

/*-------------------------- Types ---------------------------*/
type EntityData = Pick<EntitySchema, 'id' | 'name' | 'fields'>

type RecordFormProps = {
  readonly mode: 'create' | 'edit'
  readonly entity: EntityData
  readonly initialData?: RecordSchema
}

/*------------------------ Component -------------------------*/
export function RecordForm({ mode, entity, initialData }: RecordFormProps) {
  /*-------------------------- State ---------------------------*/
  const [isPending, startTransition] = useTransition()
  const [metadataValue, setMetadataValue] = useState<string | null>(
    initialData?.metadata ? JSON.stringify(initialData.metadata, null, 2) : null
  )
  const [metadataError, setMetadataError] = useState<string | undefined>()
  const router = useRouter()

  const isEditMode = mode === 'edit'

  /*------------------ Create Dynamic Schema -------------------*/
  const FieldsSchema = createFieldValuesFormSchema(entity.fields)

  /*-------------------- Get Initial Values --------------------*/
  const getInitialValues = (): FieldValues => {
    if (initialData?.fieldValues) {
      return initialData.fieldValues
    }
    return getDefaultFieldValues(entity.fields) as FieldValues
  }

  /*------------------------ Form Setup ------------------------*/
  const form = useForm({
    resolver: zodResolver(FieldsSchema),
    defaultValues: getInitialValues(),
  })

  /*--------------------- Computed Values ----------------------*/
  const getButtonText = () => {
    if (isPending) {
      return isEditMode ? 'Updating...' : 'Creating...'
    }
    return isEditMode ? 'Update Record' : 'Create Record'
  }

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

  /*---------------------- Parse Metadata ----------------------*/
  const parseMetadata = useCallback((): Metadata => {
    if (!metadataValue || metadataValue.trim() === '') {
      return null
    }

    try {
      const parsed: unknown = JSON.parse(metadataValue)
      // Sanitize: ensure it's an object
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        setMetadataError('Metadata must be a JSON object')
        return null
      }
      // Remove prototype attacks
      const sanitized: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue
        }
        sanitized[key] = value
      }
      setMetadataError(undefined)
      return sanitized
    } catch {
      setMetadataError('Invalid JSON format')
      return null
    }
  }, [metadataValue])

  /*------------------- Handle Field Errors --------------------*/
  const setFieldErrors = (fieldErrors: Record<string, string[]>) => {
    for (const [path, messages] of Object.entries(fieldErrors)) {
      form.setError(path, { message: messages[0] })
    }
  }

  /*------------------- Handle Create Submit -------------------*/
  const handleCreateSubmit = async (fieldValues: FieldValues, metadata: Metadata) => {
    const result = await createRecord({
      entityId: entity.id,
      fieldValues,
      metadata,
    })

    if (!result.success) {
      toast.error(result.error)
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
      }
      return
    }

    toast.success('Record created successfully')
    router.push(`/records/${result.data.id}`)
  }

  /*-------------------- Handle Edit Submit --------------------*/
  const handleEditSubmit = async (fieldValues: FieldValues, metadata: Metadata) => {
    if (!initialData?.id) {
      toast.error('Record ID is missing')
      return
    }

    const result = await updateRecord(initialData.id, {
      fieldValues,
      metadata,
    })

    if (!result.success) {
      toast.error(result.error)
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors)
      }
      return
    }

    toast.success('Record updated successfully')
    router.push(`/records/${initialData.id}`)
  }

  /*-------------------------- Submit --------------------------*/
  const onSubmit = (fieldValues: Record<string, unknown>) => {
    const metadata = parseMetadata()

    // Check for metadata parsing error (invalid JSON but not empty)
    if (metadataValue && metadataValue.trim() !== '' && metadataError) {
      toast.error('Please fix the JSON errors before submitting')
      return
    }

    startTransition(async () => {
      try {
        if (isEditMode) {
          await handleEditSubmit(fieldValues as FieldValues, metadata)
        } else {
          await handleCreateSubmit(fieldValues as FieldValues, metadata)
        }
      } catch (error) {
        console.error('Form submission error:', error)
        toast.error('An unexpected error occurred')
      }
    })
  }

  /*-------------------------- Render --------------------------*/
  return (
    <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className='flex flex-col gap-8'>
      {/*-------------------------- Header --------------------------*/}
      <div className='flex items-start gap-4'>
        <Button variant='ghost' size='icon' asChild data-testid='record-form-back-btn'>
          <Link href={isEditMode && initialData ? `/records/${initialData.id}` : '/records'}>
            <ArrowLeft className='size-6' />
          </Link>
        </Button>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {isEditMode ? 'Edit Record' : 'Create Record'}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {isEditMode
              ? `Editing record for ${entity.name}`
              : `Create a new ${entity.name} record`}
          </p>
        </div>
      </div>

      {/*------------------- Field Values Section -------------------*/}
      <Card className={cn(themeClasses.card)} data-testid='field-values-card'>
        <CardHeader>
          <CardTitle>Core Properties</CardTitle>
          <CardDescription>
            Fill in the structured fields defined by the {entity.name} entity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldValuesForm form={form} FieldsSchema={entity.fields} disabled={isPending} />
        </CardContent>
      </Card>

      {/*--------------------- Metadata Section ---------------------*/}
      <Card className={cn(themeClasses.card)} data-testid='metadata-card'>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>
            Add any extra information as JSON (optional, free-form data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetadataEditor
            value={metadataValue}
            onChange={setMetadataValue}
            disabled={isPending}
            error={metadataError}
            testId='metadata-editor'
          />
        </CardContent>
      </Card>

      <Separator />

      {/*---------------------- Submit Button -----------------------*/}
      <div className='flex justify-end gap-4'>
        <Button
          type='button'
          variant='outline'
          disabled={isPending}
          asChild
          data-testid='record-form-cancel-btn'
        >
          <Link href={isEditMode && initialData ? `/records/${initialData.id}` : '/records'}>
            Cancel
          </Link>
        </Button>
        <Button
          type='submit'
          disabled={isPending}
          className={cn(themeClasses.button)}
          data-testid='record-form-submit-btn'
        >
          {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {getButtonText()}
        </Button>
      </div>
    </form>
  )
}
