'use client'

import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

import type { EntitySchema, FieldValues, Metadata } from '@/lib/drizzle/schema'
import { sanitizeJson, validateJsonSize, MAX_METADATA_SIZE } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'

import {
  createFieldValuesFormSchema,
  getDefaultFieldValues,
} from '../../components/records-form/record-form-schema'
import { FieldValuesForm } from '../../components/records-form/field-values-form'
import { MetadataEditor } from '../../components/records-form/metadata-editor'

/*-------------------------- Types ---------------------------*/
type EntityData = Pick<EntitySchema, 'id' | 'name' | 'description' | 'fields'>

type BatchRecordFormProps = {
  readonly entities: EntityData[]
  readonly selectedEntityId: string | null
  readonly onEntityChange: (entityId: string | null) => void
  readonly onAddRecord: (fieldValues: FieldValues, metadata: Metadata) => void
  readonly isSubmitting: boolean
}

/*------------------------ Component -------------------------*/
export function BatchRecordForm({
  entities,
  selectedEntityId,
  onEntityChange,
  onAddRecord,
  isSubmitting,
}: BatchRecordFormProps) {
  /*-------------------------- State ---------------------------*/
  const [metadataValue, setMetadataValue] = useState<string | null>(null)
  const [metadataError, setMetadataError] = useState<string | undefined>()

  /*------------------- Get Selected Entity --------------------*/
  const selectedEntity = entities.find((e) => e.id === selectedEntityId) ?? null

  /*------------------ Create Dynamic Schema -------------------*/
  const FieldsSchema = selectedEntity ? createFieldValuesFormSchema(selectedEntity.fields) : null

  /*------------------------ Form Setup ------------------------*/
  const form = useForm({
    resolver: FieldsSchema ? zodResolver(FieldsSchema) : undefined,
    defaultValues: selectedEntity ? getDefaultFieldValues(selectedEntity.fields) : {},
  })

  /*------------------- Handle Entity Change -------------------*/
  const handleEntityChange = useCallback(
    (entityId: string) => {
      onEntityChange(entityId)
      const entity = entities.find((e) => e.id === entityId)
      if (entity) {
        form.reset(getDefaultFieldValues(entity.fields))
        setMetadataValue(null)
        setMetadataError(undefined)
      }
    },
    [entities, form, onEntityChange]
  )

  /*-------------------- Metadata Handlers ---------------------*/
  const handleMetadataChange = useCallback((nextValue: string | null) => {
    setMetadataValue(nextValue)
    setMetadataError(undefined)
  }, [])

  const parseAndSanitizeMetadata = useCallback(
    (
      rawMetadata: string | null
    ): { success: true; data: Metadata } | { success: false; error: string } => {
      if (!rawMetadata || rawMetadata.trim() === '') {
        return { success: true, data: null }
      }

      if (!validateJsonSize(rawMetadata, MAX_METADATA_SIZE)) {
        return {
          success: false,
          error: `Metadata exceeds maximum size (${String(MAX_METADATA_SIZE / 1024)}KB)`,
        }
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(rawMetadata)
      } catch {
        return { success: false, error: 'Invalid JSON format' }
      }

      try {
        return { success: true, data: sanitizeJson(parsed) }
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Invalid metadata' }
      }
    },
    []
  )

  /*---------------------- Handle Submit -----------------------*/
  const onSubmit = useCallback(
    (fieldValues: Record<string, unknown>) => {
      const parsedMetadata = parseAndSanitizeMetadata(metadataValue)
      if (!parsedMetadata.success) {
        setMetadataError(parsedMetadata.error)
        toast.error('Please fix the JSON errors before adding to queue')
        return
      }

      // Add to queue
      onAddRecord(fieldValues as FieldValues, parsedMetadata.data)

      // Reset form for next entry
      if (selectedEntity) {
        form.reset(getDefaultFieldValues(selectedEntity.fields))
        setMetadataValue(null)
        setMetadataError(undefined)
      }
    },
    [parseAndSanitizeMetadata, metadataValue, onAddRecord, selectedEntity, form]
  )

  /*-------------------------- Render --------------------------*/
  return (
    <Card className='h-full flex flex-col' data-testid='batch-record-form-card'>
      <CardHeader>
        <CardTitle>Add Record to Queue</CardTitle>
        <CardDescription>Fill in the form and add records to the queue</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 overflow-auto'>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className='flex flex-col gap-6 h-full'
        >
          {/*--------------------- Entity Selector ----------------------*/}
          <Field>
            <FieldLabel>Entity Type *</FieldLabel>
            <Select
              value={selectedEntityId ?? ''}
              onValueChange={handleEntityChange}
              disabled={isSubmitting}
            >
              <SelectTrigger data-testid='batch-form-entity-selector'>
                <SelectValue placeholder='Select an entity type' />
              </SelectTrigger>
              <SelectContent>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {entity.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/*-------------- Show Form When Entity Selected --------------*/}
          {selectedEntity && (
            <>
              <Separator />

              <div className='flex-1 overflow-auto gap-8 flex flex-col pr-2'>
                {/*-------------------- Field Values Form ---------------------*/}
                <div>
                  <h3 className='mb-4 text-sm font-medium'>Core Properties</h3>
                  <FieldValuesForm
                    form={form}
                    FieldsSchema={selectedEntity.fields}
                    disabled={isSubmitting}
                  />
                </div>

                <Separator />

                {/*--------------------- Metadata Editor ----------------------*/}
                <div>
                  <MetadataEditor
                    value={metadataValue}
                    onChange={handleMetadataChange}
                    disabled={isSubmitting}
                    error={metadataError}
                    testId='batch-form-metadata-editor'
                  />
                </div>

                <Separator />
              </div>

              {/*------------------- Add to Queue Button --------------------*/}
              <Button
                type='submit'
                disabled={isSubmitting}
                className='w-full'
                data-testid='batch-form-add-btn'
              >
                <Plus className='mr-2 h-4 w-4' />
                Add to Queue
              </Button>
            </>
          )}

          {/*---------------- Placeholder When No Entity ----------------*/}
          {!selectedEntity && (
            <div className='py-8 text-center text-muted-foreground'>
              <p>Select an entity type to start adding records</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
