'use client'

import { useTransition, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

import type {
  FieldsSchema,
  Depth1Values,
  Depth2Values,
  SelectRecordSchemaType,
} from '@/lib/drizzle/schema'
import { cn } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { createRecord } from '@/app/records/actions/create-record'
import { updateRecord } from '@/app/records/actions/update-record'

import { createDepth1FormSchema, getDefaultDepth1Values } from './schema'
import { Depth1Form } from './depth1-form'
import { Depth2Editor } from './depth2-editor'

/*-------------------------- Types ---------------------------*/
type EntityData = {
  id: string
  name: string
  fields: FieldsSchema
}

type RecordFormProps = {
  readonly mode: 'create' | 'edit'
  readonly entity: EntityData
  readonly initialData?: SelectRecordSchemaType
}

/*------------------------ Component -------------------------*/
export function RecordForm({ mode, entity, initialData }: RecordFormProps) {
  /*-------------------------- State ---------------------------*/
  const [isPending, startTransition] = useTransition()
  const [depth2Value, setDepth2Value] = useState<string | null>(
    initialData?.depth2Values ? JSON.stringify(initialData.depth2Values, null, 2) : null
  )
  const [depth2Error, setDepth2Error] = useState<string | undefined>()
  const router = useRouter()

  const isEditMode = mode === 'edit'

  /*------------------ Create Dynamic Schema -------------------*/
  const FieldsSchema = createDepth1FormSchema(entity.fields)

  /*-------------------- Get Initial Values --------------------*/
  const getInitialValues = (): Depth1Values => {
    if (initialData?.depth1Values) {
      return initialData.depth1Values
    }
    return getDefaultDepth1Values(entity.fields) as Depth1Values
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

  /*-------------------- Parse Depth2 Value --------------------*/
  const parseDepth2Value = useCallback((): Depth2Values => {
    if (!depth2Value || depth2Value.trim() === '') {
      return null
    }

    try {
      const parsed: unknown = JSON.parse(depth2Value)
      // Sanitize: ensure it's an object
      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        setDepth2Error('Depth 2 must be a JSON object')
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
      setDepth2Error(undefined)
      return sanitized
    } catch {
      setDepth2Error('Invalid JSON format')
      return null
    }
  }, [depth2Value])

  /*------------------- Handle Field Errors --------------------*/
  const setFieldErrors = (fieldErrors: Record<string, string[]>) => {
    for (const [path, messages] of Object.entries(fieldErrors)) {
      form.setError(path, { message: messages[0] })
    }
  }

  /*------------------- Handle Create Submit -------------------*/
  const handleCreateSubmit = async (depth1Data: Depth1Values, depth2Data: Depth2Values) => {
    const result = await createRecord({
      entityId: entity.id,
      depth1Values: depth1Data,
      depth2Values: depth2Data,
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
  const handleEditSubmit = async (depth1Data: Depth1Values, depth2Data: Depth2Values) => {
    if (!initialData?.id) {
      toast.error('Record ID is missing')
      return
    }

    const result = await updateRecord(initialData.id, {
      depth1Values: depth1Data,
      depth2Values: depth2Data,
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
  const onSubmit = (depth1Data: Record<string, unknown>) => {
    const depth2Data = parseDepth2Value()

    // Check for depth2 parsing error (invalid JSON but not empty)
    if (depth2Value && depth2Value.trim() !== '' && depth2Error) {
      toast.error('Please fix the JSON errors before submitting')
      return
    }

    startTransition(async () => {
      try {
        if (isEditMode) {
          await handleEditSubmit(depth1Data as Depth1Values, depth2Data)
        } else {
          await handleCreateSubmit(depth1Data as Depth1Values, depth2Data)
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

      {/*--------------------- Depth 1 Section ----------------------*/}
      <Card className={cn(themeClasses.card)} data-testid='depth1-card'>
        <CardHeader>
          <CardTitle>Core Properties</CardTitle>
          <CardDescription>
            Fill in the structured fields defined by the {entity.name} entity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Depth1Form form={form} FieldsSchema={entity.fields} disabled={isPending} />
        </CardContent>
      </Card>

      {/*--------------------- Depth 2 Section ----------------------*/}
      <Card className={cn(themeClasses.card)} data-testid='depth2-card'>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>
            Add any extra information as JSON (optional, free-form data)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Depth2Editor
            value={depth2Value}
            onChange={setDepth2Value}
            disabled={isPending}
            error={depth2Error}
            testId='depth2-editor'
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
