'use client'

import { type fieldDefinitionSchemaType } from '@/lib/drizzle/schema'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2 } from 'lucide-react'

interface SavedFieldsListProps {
  readonly fields: Array<fieldDefinitionSchemaType & { key: string; id: string }>
  readonly onRemove: (index: number) => void
}

/*------------------------ Component -------------------------*/
export function SavedFieldsList({ fields, onRemove }: SavedFieldsListProps) {
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
    <div className='border rounded-md'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Attributes</TableHead>
            <TableHead className='w-20'></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, idx) => (
            <TableRow key={field.id} data-testid={`saved-field-${field.key}`}>
              <TableCell className='font-medium'>{field.label}</TableCell>
              <TableCell className='font-mono text-xs'>{field.key}</TableCell>
              <TableCell>
                <Badge variant='secondary' className='rounded-sm font-normal'>
                  {field.type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className='flex gap-2'>
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
                  {!field.required && !field.sortable && (
                    <span className='text-muted-foreground text-xs'>-</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground hover:text-destructive'
                  onClick={() => {
                    onRemove(idx)
                  }}
                  data-testid={`saved-remove-${field.key}`}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
