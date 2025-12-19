'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import {
  type FieldSchemaType,
  EntitySchema,
  type EntitySchemaType,
  InsertEntitySchema,
  fieldSchema,
} from '@/lib/drizzle/schema'
import { toSnakeCase } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { FIELD_TYPES } from '@/lib/drizzle/schema'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectGroup,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { GripVertical, Trash2 } from 'lucide-react'

/*---------------------- Parent Schema -----------------------*/
// Extend InsertEntitySchema to have fields as an array for the form
const parentSchema = InsertEntitySchema.extend({
  fields: z.array(fieldSchema),
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

  /*----------------- Inlined local components (now scoped to CreateEntityForm) -----------------*/
  const EntityInfoForm = () => {
    return (
      <div className='grid grid-cols-1 gap-4'>
        <FormField
          control={parentForm.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entity name</FormLabel>
              <FormControl>
                <Input
                  id='entity-name'
                  placeholder='e.g., Network Equipment'
                  {...field}
                  data-testid='entity-name'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={parentForm.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  id='entity-desc'
                  placeholder='Optional description'
                  {...field}
                  value={field.value ?? ''}
                  data-testid='entity-desc'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    )
  }

  const FieldBuilder = () => {
    const builderFormSchema = z.object({
      label: z.string().min(1, 'Label is required'),
      type: z.enum(FIELD_TYPES),
      sortable: z.boolean(),
      required: z.boolean(),
    })
    type BuilderFormValues = z.infer<typeof builderFormSchema>

    const form = useForm<BuilderFormValues>({
      resolver: zodResolver(builderFormSchema),
      defaultValues: { label: '', type: FIELD_TYPES[0], sortable: true, required: false },
    })
    const { control, register, handleSubmit, reset } = form

    const onSubmit = (values: BuilderFormValues) => {
      const existingKeys = savedFields.map((f) => toSnakeCase(f.label))
      const base = toSnakeCase(values.label)
      let key = base || 'field'
      let i = 1
      while (existingKeys.includes(key)) {
        key = `${base}_${String(i)}`
        i += 1
      }

      handleAddField({ ...values, order: existingKeys.length })
      reset()
    }

    return (
      <div role='group' aria-labelledby='builder-heading' className='flex flex-col gap-4'>
        <div>
          <label htmlFor='builder-label' className='mb-1 block text-sm font-medium'>
            Label
          </label>
          <Input
            id='builder-label'
            data-testid='builder-label'
            placeholder='e.g., Name, Age, Email'
            {...register('label')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleSubmit(onSubmit)()
              }
            }}
          />
          <p className='text-muted-foreground text-sm mt-1'>
            Used to generate the human label & snake_case key.
          </p>
        </div>

        <div>
          <label htmlFor='builder-type' className='mb-1 block text-sm font-medium'>
            Type
          </label>
          <Controller
            control={control}
            name='type'
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id='builder-type'>
                  <SelectValue placeholder='Select type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem value={t} key={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className='flex items-center gap-4'>
          <label htmlFor='builder-sortable' className='flex items-center gap-2'>
            <Controller
              control={control}
              name='sortable'
              render={({ field }) => (
                <>
                  <Switch
                    id='builder-sortable'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid='builder-sortable'
                    aria-label='sortable'
                  />
                  <span className='text-sm'>Sortable</span>
                </>
              )}
            />
          </label>

          <label htmlFor='builder-required' className='flex items-center gap-2'>
            <Controller
              control={control}
              name='required'
              render={({ field }) => (
                <>
                  <Switch
                    id='builder-required'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid='builder-required'
                    aria-label='required'
                  />
                  <span className='text-sm'>Required</span>
                </>
              )}
            />
          </label>
        </div>

        <Button
          className='w-full'
          type='button'
          variant={'secondary'}
          data-testid='builder-add'
          aria-label='Add field'
          onClick={() => void handleSubmit(onSubmit)()}
        >
          Add +
        </Button>
      </div>
    )
  }

  const SavedFieldsList = () => {
    const fields = savedFields.map((f) => ({
      ...f,
      sortable: f.sortable ?? true,
      required: f.required ?? false,
    }))

    const sensors = useSensors(
      useSensor(PointerSensor),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event
      if (active.id !== over?.id) {
        const oldIndex = fields.findIndex((f) => toSnakeCase(f.label) === String(active.id))
        const newIndex = fields.findIndex((f) => toSnakeCase(f.label) === String(over?.id))
        if (oldIndex > -1 && newIndex > -1) {
          handleReorder(oldIndex, newIndex)
        }
      }
    }

    const SortableFieldItem = ({ field, index }: { field: FieldSchemaType; index: number }) => {
      const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: toSnakeCase(field.label),
      })
      const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1,
      }
      return (
        <div ref={setNodeRef} style={style} className='mb-2'>
          <Card className='py-2 bg-card-foreground/5'>
            <CardContent className='flex flex-row justify-between w-full'>
              <div className='flex flex-row items-center'>
                <div
                  {...attributes}
                  {...listeners}
                  className='cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground'
                >
                  <GripVertical className='size-8 -ml-5' />
                </div>
                <div className='flex flex-col'>
                  <span className='font-medium truncate'>{field.label}</span>
                  <span className='font-mono text-xs text-muted-foreground truncate'>
                    {toSnakeCase(field.label)}
                  </span>
                </div>
              </div>

              <div className='flex flex-row gap-2 items-center '>
                <div className='flex flex-col sm:flex-row gap-1 items-center'>
                  <Badge variant='secondary' className='rounded-sm font-normal'>
                    {field.type}
                  </Badge>
                  {field.required && (
                    <Badge variant='outline' className='text-xs'>
                      Required
                    </Badge>
                  )}
                  {field.sortable && (
                    <Badge variant='outline' className='text-xs'>
                      Sortable
                    </Badge>
                  )}
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground hover:text-destructive shrink-0'
                  onClick={() => handleRemoveField(index)}
                  data-testid={`saved-remove-${toSnakeCase(field.label)}`}
                >
                  <Trash2 className='size-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

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
          <div className='flex flex-col'>
            {fields.map((field, index) => (
              <SortableFieldItem key={toSnakeCase(field.label)} field={field} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

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
          <EntityInfoForm />
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
              <FieldBuilder />
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
            <SavedFieldsList />
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}
