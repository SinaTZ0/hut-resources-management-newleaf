'use client'

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

import { type FieldSchema } from '@/lib/drizzle/schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toSnakeCase } from '@/lib/utils/common-utils'

interface SavedFieldsListProps {
  readonly fields: FieldSchema[]
  readonly onRemove: (index: number) => void
  readonly onReorder: (oldIndex: number, newIndex: number) => void
}

/*---------------------- Sortable Item -----------------------*/
function SortableFieldItem({
  field,
  onRemove,
}: Readonly<{
  field: FieldSchema
  onRemove: () => void
}>) {
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
            <div className='flex flex-col sm:flex-row gap-1 items-center'>
              {/*--------------------------- Type ---------------------------*/}
              <Badge variant='secondary' className='rounded-sm font-normal'>
                {field.type}
              </Badge>
              {/*------------------------ Attributes ------------------------*/}
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
        </CardContent>
      </Card>
    </div>
  )
}

/*------------------------ Component -------------------------*/
export function SavedFieldsList({ fields, onRemove, onReorder }: SavedFieldsListProps) {
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
              field={field}
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
