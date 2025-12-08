'use client'

import { type fieldDefinitionSchemaType } from '@/lib/drizzle/schema'
import { Button } from '@/components/ui/button'

interface SavedFieldsListProps {
  readonly fields: Array<fieldDefinitionSchemaType & { key: string; id: string }>
  readonly onRemove: (index: number) => void
}

/*------------------------ Component -------------------------*/
export function SavedFieldsList({ fields, onRemove }: SavedFieldsListProps) {
  /*-------------------------- Render --------------------------*/
  return (
    <div className='space-y-2'>
      {/*----------------------- Empty State ------------------------*/}
      {fields.length === 0 && (
        <p data-testid='saved-empty' className='text-muted-foreground'>
          No fields yet.
        </p>
      )}

      {/*----------------------- Fields List ------------------------*/}
      {fields.map((field, idx) => (
        <div
          key={field.id}
          className='flex items-center justify-between gap-3 p-2 border rounded-md bg-white dark:bg-panel'
          data-testid={`saved-field-${field.key}`}
        >
          <div className='flex flex-col'>
            <div className='text-sm font-medium'>{field.label}</div>
            <div className='text-xs text-muted-foreground'>
              {field.key} · {field.type}
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => {
                onRemove(idx)
              }}
              data-testid={`saved-remove-${field.key}`}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
