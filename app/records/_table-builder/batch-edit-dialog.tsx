'use client'

import { useState, useMemo } from 'react'
import { Loader2, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils/common-utils'
import type { FieldsSchema, FieldValue, FieldSchema } from '@/lib/drizzle/schema'

import { updateRecordsFieldBatch } from '../actions/update-records-field-batch'

/*-------------------------- Types ---------------------------*/
type BatchEditDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly selectedIds: string[]
  readonly entityId: string
  readonly entityFields: FieldsSchema
  readonly onComplete: () => void
}

/*------------------------ Component -------------------------*/
export function BatchEditDialog({
  open,
  onOpenChange,
  selectedIds,
  entityId,
  entityFields,
  onComplete,
}: BatchEditDialogProps) {
  /*-------------------------- State ---------------------------*/
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('')
  const [fieldValue, setFieldValue] = useState<FieldValue>(null)
  const [deleteValue, setDeleteValue] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /*------------------- Sorted Field Options -------------------*/
  const fieldOptions = useMemo(() => {
    return Object.entries(entityFields)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key, config]) => ({
        key,
        label: config.label,
        type: config.type,
        required: config.required,
        enumOptions: config.enumOptions,
      }))
  }, [entityFields])

  /*------------------- Selected Field Info --------------------*/
  const selectedFieldConfig = selectedFieldKey ? entityFields[selectedFieldKey] : null

  /*------------------------- Handlers -------------------------*/
  function handleFieldSelect(key: string) {
    setSelectedFieldKey(key)
    setDeleteValue(false)
    // Reset value based on field type
    const config = entityFields[key]
    switch (config.type) {
      case 'boolean':
        setFieldValue(false)
        break
      case 'number':
        setFieldValue(null)
        break
      case 'date':
        setFieldValue(null)
        break
      case 'enum':
        setFieldValue(null)
        break
      default:
        setFieldValue('')
    }
  }

  function handleDeleteValueChange(checked: boolean) {
    setDeleteValue(checked)
    if (checked) {
      // Reset field value when switching to delete mode
      setFieldValue(null)
    }
  }

  function handleShowConfirm() {
    if (!selectedFieldKey) {
      toast.error('Please select a field to edit')
      return
    }

    // Validate required fields (only when not deleting)
    if (
      !deleteValue &&
      selectedFieldConfig?.required &&
      (fieldValue === null || fieldValue === '')
    ) {
      toast.error(`${selectedFieldConfig.label} is required`)
      return
    }

    setIsConfirmOpen(true)
  }

  async function handleConfirmUpdate() {
    setIsSubmitting(true)

    try {
      const result = await updateRecordsFieldBatch({
        recordIds: selectedIds,
        entityId,
        fieldKey: selectedFieldKey,
        fieldValue,
        clearValue: deleteValue,
      })

      if (result.success) {
        const actionText = deleteValue ? 'Cleared' : 'Updated'
        toast.success(`${actionText} ${String(result.data.updatedCount)} record(s)`)
        setIsConfirmOpen(false)
        onOpenChange(false)
        resetForm()
        onComplete()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  function resetForm() {
    setSelectedFieldKey('')
    setFieldValue(null)
    setDeleteValue(false)
  }

  function handleDialogClose(isOpen: boolean) {
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }

  /*-------------------------- Render --------------------------*/
  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Batch Edit Field</DialogTitle>
            <DialogDescription>
              Update a single field value across {String(selectedIds.length)} selected record(s).
            </DialogDescription>
          </DialogHeader>

          <div className='flex flex-col gap-4 py-4'>
            {/*---------------------- Field Selector ----------------------*/}
            <div className='flex flex-col gap-2'>
              <Label htmlFor='field-select'>Select Field</Label>
              <Select value={selectedFieldKey} onValueChange={handleFieldSelect}>
                <SelectTrigger id='field-select' data-testid='batch-edit-field-select'>
                  <SelectValue placeholder='Choose a field to edit...' />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      <span>{field.label}</span>
                      <span className='ml-2 text-xs text-muted-foreground'>
                        ({field.type}
                        {field.required ? ', required' : ''})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/*---------- Clear Value Toggle (Non-Required Only) ----------*/}
            {selectedFieldConfig && !selectedFieldConfig.required && (
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div className='space-y-0.5'>
                  <Label htmlFor='delete-value' className='text-sm font-medium'>
                    Clear Field Value
                  </Label>
                  <p className='text-xs text-muted-foreground'>
                    Remove the value from all selected records
                  </p>
                </div>
                <Switch
                  id='delete-value'
                  checked={deleteValue}
                  onCheckedChange={handleDeleteValueChange}
                  data-testid='batch-edit-delete-toggle'
                />
              </div>
            )}

            {/*----------------------- Value Input ------------------------*/}
            {selectedFieldConfig && !deleteValue && (
              <div className='flex flex-col gap-2'>
                <Label htmlFor='field-value'>
                  New Value
                  {selectedFieldConfig.required && <span className='ml-1 text-destructive'>*</span>}
                </Label>
                <FieldValueInput
                  fieldConfig={selectedFieldConfig}
                  value={fieldValue}
                  onChange={setFieldValue}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleShowConfirm}
              disabled={!selectedFieldKey}
              data-testid='batch-edit-apply-btn'
            >
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/*------------------- Confirmation Dialog --------------------*/}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteValue ? 'Confirm Clear Field Values' : 'Confirm Batch Update'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteValue ? (
                <>
                  You are about to <strong className='text-destructive'>clear</strong> the &quot;
                  {selectedFieldConfig?.label}&quot; field value for{' '}
                  <strong className='text-foreground'>{String(selectedIds.length)}</strong>{' '}
                  record(s).
                </>
              ) : (
                <>
                  You are about to update the &quot;{selectedFieldConfig?.label}&quot; field to{' '}
                  <strong className='text-foreground'>{formatDisplayValue(fieldValue)}</strong> for{' '}
                  <strong className='text-foreground'>{String(selectedIds.length)}</strong>{' '}
                  record(s).
                </>
              )}
              <br />
              <br />
              This action cannot be undone easily. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmUpdate()}
              disabled={isSubmitting}
              data-testid='batch-edit-confirm-btn'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {deleteValue ? 'Clearing...' : 'Updating...'}
                </>
              ) : deleteValue ? (
                'Confirm Clear'
              ) : (
                'Confirm Update'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/*--------------- Field Value Input Component ----------------*/
type FieldValueInputProps = {
  readonly fieldConfig: FieldSchema
  readonly value: FieldValue
  readonly onChange: (value: FieldValue) => void
}

function FieldValueInput({ fieldConfig, value, onChange }: FieldValueInputProps) {
  switch (fieldConfig.type) {
    case 'string':
      return <StringFieldInput value={value} onChange={onChange} />
    case 'number':
      return <NumberFieldInput value={value} onChange={onChange} />
    case 'boolean':
      return <BooleanFieldInput value={value} onChange={onChange} />
    case 'date':
      return <DateFieldInput value={value} onChange={onChange} />
    case 'enum':
      return <EnumFieldInput value={value} onChange={onChange} options={fieldConfig.enumOptions} />
    default:
      return <StringFieldInput value={value} onChange={onChange} />
  }
}

/*-------------------- String Field Input --------------------*/
function StringFieldInput({
  value,
  onChange,
}: {
  readonly value: FieldValue
  readonly onChange: (value: FieldValue) => void
}) {
  return (
    <Input
      id='field-value'
      type='text'
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder='Enter text value...'
      data-testid='batch-edit-string-input'
    />
  )
}

/*-------------------- Number Field Input --------------------*/
function NumberFieldInput({
  value,
  onChange,
}: {
  readonly value: FieldValue
  readonly onChange: (value: FieldValue) => void
}) {
  return (
    <Input
      id='field-value'
      type='number'
      value={value !== null && typeof value === 'number' ? value : ''}
      onChange={(e) => {
        const val = e.target.value
        onChange(val === '' ? null : Number(val))
      }}
      placeholder='Enter number value...'
      data-testid='batch-edit-number-input'
    />
  )
}

/*------------------- Boolean Field Input --------------------*/
function BooleanFieldInput({
  value,
  onChange,
}: {
  readonly value: FieldValue
  readonly onChange: (value: FieldValue) => void
}) {
  return (
    <div className='flex items-center gap-2'>
      <Switch
        id='field-value'
        checked={value === true}
        onCheckedChange={(checked) => onChange(checked)}
        data-testid='batch-edit-boolean-input'
      />
      <span className='text-sm text-muted-foreground'>{value === true ? 'Yes' : 'No'}</span>
    </div>
  )
}

/*--------------------- Date Field Input ---------------------*/
function DateFieldInput({
  value,
  onChange,
}: {
  readonly value: FieldValue
  readonly onChange: (value: FieldValue) => void
}) {
  const displayValue = getDateDisplayValue(value)
  const selectedDate = getDateSelectedValue(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id='field-value'
          variant='outline'
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
          data-testid='batch-edit-date-input'
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          selected={selectedDate}
          onSelect={(date) => onChange(date ?? null)}
        />
      </PopoverContent>
    </Popover>
  )
}

function getDateDisplayValue(value: FieldValue): string {
  const date = toValidDate(value)
  if (date) return format(date, 'PPP')
  return 'Pick a date'
}

function getDateSelectedValue(value: FieldValue): Date | undefined {
  return toValidDate(value) ?? undefined
}

function toValidDate(value: FieldValue): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    if (value === '') return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  return null
}

/*--------------------- Enum Field Input ---------------------*/
function EnumFieldInput({
  value,
  onChange,
  options,
}: {
  readonly value: FieldValue
  readonly onChange: (value: FieldValue) => void
  readonly options: string[] | undefined
}) {
  return (
    <Select value={typeof value === 'string' ? value : ''} onValueChange={(val) => onChange(val)}>
      <SelectTrigger id='field-value' data-testid='batch-edit-enum-input'>
        <SelectValue placeholder='Select an option...' />
      </SelectTrigger>
      <SelectContent>
        {(options ?? []).map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/*------------------- Format Display Value -------------------*/
function formatDisplayValue(value: FieldValue): string {
  if (value === null) return 'empty'
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? 'Invalid date' : format(value, 'PPP')
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}
