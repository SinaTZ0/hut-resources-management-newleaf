'use client'

import { AlertTriangle, GripVertical, Trash2 } from 'lucide-react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { FieldsSchema } from '@/lib/drizzle/schema'
import { FormDatePicker } from '@/components/form/form-date-picker'
import { FormInput } from '@/components/form/form-input'
import { FormSelect } from '@/components/form/form-select'
import { FormSwitch } from '@/components/form/form-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toSnakeCase } from '@/lib/utils/common-utils'

import type { EntityFormInputValues } from './entities-form-schema'

interface SavedFieldsListProps {
  readonly form: UseFormReturn<EntityFormInputValues>
  readonly fields: EntityFormInputValues['fields']
  readonly mode: 'create' | 'edit'
  readonly initialFields?: FieldsSchema
  readonly onRemove: (index: number) => void
  readonly onReorder: (oldIndex: number, newIndex: number) => void
}

/*---------------------- Sortable Item -----------------------*/
function SortableFieldItem({
  form,
  field,
  index,
  mode,
  initialFields,
  onRemove,
}: Readonly<{
  form: UseFormReturn<EntityFormInputValues>
  field: EntityFormInputValues['fields'][number]
  index: number
  mode: 'create' | 'edit'
  initialFields?: FieldsSchema
  onRemove: () => void
}>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: toSnakeCase(field.label),
  })

  /*-------------------- Field Key & State ---------------------*/
  const fieldKey = toSnakeCase(field.label)

  type RequiredPath = `fields.${number}.required`
  type TypePath = `fields.${number}.type`
  type EnumOptionsPath = `fields.${number}.enumOptions`
  type SortablePath = `fields.${number}.sortable`
  type DefaultValuePath = `fields.${number}.defaultValue`

  const requiredPath = `fields.${String(index)}.required` as RequiredPath
  const typePath = `fields.${String(index)}.type` as TypePath
  const enumOptionsPath = `fields.${String(index)}.enumOptions` as EnumOptionsPath
  const sortablePath = `fields.${String(index)}.sortable` as SortablePath
  const defaultValuePath = `fields.${String(index)}.defaultValue` as DefaultValuePath

  const required = useWatch({ control: form.control, name: requiredPath })
  const type = useWatch({ control: form.control, name: typePath })
  const enumOptions = useWatch({ control: form.control, name: enumOptionsPath })

  const wasRequiredBefore = initialFields?.[fieldKey]?.required ?? false
  const showDefaultValueInput = mode === 'edit' && required && !wasRequiredBefore
  const isEnumType = type === 'enum'
  const showEnumDefaultSelect = showDefaultValueInput && isEnumType && !!enumOptions?.length

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className='mb-2'>
      <Card className='py-2 bg-card-foreground/5'>
        <CardContent className='flex flex-col gap-2 w-full'>
          {/*------------------------- Top Row --------------------------*/}
          <div className='flex flex-row justify-between w-full'>
            <div className='flex flex-row items-center'>
              {/*----------------------- Drag Handle ------------------------*/}
              <div
                {...attributes}
                {...listeners}
                className='cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground'
              >
                <GripVertical className='size-8 -ml-5' />
              </div>
              {/*----------------------- Label & Key ------------------------*/}
              <div className='flex flex-col'>
                <span className='font-medium truncate'>{field.label}</span>
                <span className='font-mono text-xs text-muted-foreground truncate'>
                  {toSnakeCase(field.label)}
                </span>
              </div>
            </div>

            <div className='flex flex-row gap-2 items-center '>
              <div className='flex flex-col sm:flex-row gap-3 items-center'>
                {/*--------------------------- Type ---------------------------*/}
                <Badge variant='secondary' className='rounded-sm font-normal'>
                  {field.type}
                </Badge>

                {/*------------------------- Toggles --------------------------*/}
                <div className='flex items-center gap-4'>
                  <FormSwitch
                    form={form}
                    name={sortablePath}
                    label='Sortable'
                    testId={`saved-field-${fieldKey}-sortable-toggle`}
                  />

                  <FormSwitch
                    form={form}
                    name={requiredPath}
                    label='Required'
                    testId={`saved-field-${fieldKey}-required-toggle`}
                  />
                </div>
              </div>
              {/*------------------------- Actions --------------------------*/}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground hover:text-destructive shrink-0'
                onClick={onRemove}
                data-testid={`saved-remove-${toSnakeCase(field.label)}`}
              >
                <Trash2 className='size-4' />
              </Button>
            </div>
          </div>

          {/*---------- Default Value (Newly Required Fields) -----------*/}
          {showDefaultValueInput && !isEnumType && (
            <div className='flex flex-col gap-2 pl-3 pt-2 border-t border-dashed'>
              {type === 'string' && (
                <FormInput
                  form={form}
                  name={defaultValuePath}
                  label='Default Value'
                  placeholder='e.g., N/A, Unknown, Default'
                  testId={`saved-field-${fieldKey}-default`}
                />
              )}
              {type === 'number' && (
                <FormInput
                  form={form}
                  name={defaultValuePath}
                  label='Default Value'
                  placeholder='e.g., 0'
                  type='number'
                  testId={`saved-field-${fieldKey}-default`}
                />
              )}
              {type === 'boolean' && (
                <FormSwitch
                  form={form}
                  name={defaultValuePath}
                  label='Default Value'
                  testId={`saved-field-${fieldKey}-default`}
                />
              )}
              {type === 'date' && (
                <FormDatePicker
                  form={form}
                  name={defaultValuePath}
                  label='Default Value'
                  testId={`saved-field-${fieldKey}-default`}
                />
              )}
              <div className='flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20'>
                <AlertTriangle className='size-4 text-amber-500 shrink-0 mt-0.5' />
                <p className='text-xs text-amber-600 dark:text-amber-400'>
                  This value will be applied to all existing records that don&apos;t have this
                  field.
                </p>
              </div>
            </div>
          )}

          {showEnumDefaultSelect && (
            <div className='flex flex-col gap-2 pl-3 pt-2 border-t border-dashed'>
              <FormSelect
                form={form}
                name={defaultValuePath}
                label='Default Value'
                placeholder='Select default option'
                testId={`saved-field-${fieldKey}-default`}
                options={enumOptions.map((opt: string) => ({ label: opt, value: opt }))}
              />
              <div className='flex items-start gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20'>
                <AlertTriangle className='size-4 text-amber-500 shrink-0 mt-0.5' />
                <p className='text-xs text-amber-600 dark:text-amber-400'>
                  This value will be applied to all existing records that don&apos;t have this
                  field.
                </p>
              </div>
            </div>
          )}

          {/*--------------------- Enum Options Row ---------------------*/}
          {field.type === 'enum' && field.enumOptions && field.enumOptions.length > 0 && (
            <div className='flex flex-wrap gap-1 pl-3 pt-1 border-t border-dashed'>
              <span className='text-xs text-muted-foreground mr-1'>Options:</span>
              {field.enumOptions.map((option) => (
                <Badge
                  key={option}
                  variant='outline'
                  className='text-xs font-normal'
                  data-testid={`enum-option-${toSnakeCase(field.label)}-${option}`}
                >
                  {option}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/*------------------------ Component -------------------------*/
export function SavedFieldsList({
  form,
  fields,
  mode,
  initialFields,
  onRemove,
  onReorder,
}: SavedFieldsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((f) => toSnakeCase(f.label) === String(active.id))
      const newIndex = fields.findIndex((f) => toSnakeCase(f.label) === String(over?.id))
      if (oldIndex > -1 && newIndex > -1) {
        onReorder(oldIndex, newIndex)
      }
    }
  }

  /*-------------------------- Render --------------------------*/
  if (fields.length === 0) {
    return (
      <div
        className='flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/50'
        data-testid='saved-empty'
      >
        <p className='text-sm text-muted-foreground'>No fields added yet.</p>
        <p className='text-xs text-muted-foreground mt-1'>
          Use the builder to add fields to your entity.
        </p>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={fields.map((f) => toSnakeCase(f.label))}
        strategy={verticalListSortingStrategy}
      >
        <div className='flex flex-col overflow-hidden'>
          {fields.map((field, index) => (
            <SortableFieldItem
              key={toSnakeCase(field.label)}
              form={form}
              field={field}
              index={index}
              mode={mode}
              initialFields={initialFields}
              onRemove={() => {
                onRemove(index)
              }}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
