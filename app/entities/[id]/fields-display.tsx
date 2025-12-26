import { CheckCircle2, XCircle, ArrowUpDown } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Depth1Schema, FieldType } from '@/lib/drizzle/schema'

/*------------------------ Props Type ------------------------*/
type FieldsDisplayProps = Readonly<{
  fields: Depth1Schema
}>

/*-------------------- Type Badge Config ---------------------*/
const TYPE_BADGE_VARIANTS: Record<FieldType, { variant: 'default' | 'secondary' | 'outline' }> = {
  string: { variant: 'default' },
  number: { variant: 'secondary' },
  date: { variant: 'outline' },
  boolean: { variant: 'secondary' },
}

/*------------------------ Component -------------------------*/
export function FieldsDisplay({ fields }: FieldsDisplayProps) {
  /*--------------------- Computed Values ----------------------*/
  const sortedFields = Object.entries(fields).sort(([, a], [, b]) => a.order - b.order)

  /*-------------------------- Render --------------------------*/
  if (sortedFields.length === 0) {
    return (
      <div
        className='flex items-center justify-center py-8 text-muted-foreground'
        data-testid='fields-display-empty'
      >
        No fields defined for this entity
      </div>
    )
  }

  return (
    <div className='rounded-md border' data-testid='fields-display'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-16'>Order</TableHead>
            <TableHead>Field Key</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className='text-center'>Required</TableHead>
            <TableHead className='text-center'>Sortable</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedFields.map(([key, field]) => (
            <TableRow key={key} data-testid={`field-row-${key}`}>
              {/*-------------------------- Order ---------------------------*/}
              <TableCell className='font-mono text-sm text-muted-foreground'>
                {field.order}
              </TableCell>

              {/*--------------------------- Key ----------------------------*/}
              <TableCell>
                <code className='rounded bg-muted px-1.5 py-0.5 text-xs font-mono'>{key}</code>
              </TableCell>

              {/*-------------------------- Label ---------------------------*/}
              <TableCell className='font-medium'>{field.label}</TableCell>

              {/*--------------------------- Type ---------------------------*/}
              <TableCell>
                <Badge variant={TYPE_BADGE_VARIANTS[field.type].variant}>{field.type}</Badge>
              </TableCell>

              {/*------------------------- Required -------------------------*/}
              <TableCell className='text-center'>
                {field.required ? (
                  <CheckCircle2
                    className='inline-block h-4 w-4 text-green-600'
                    data-testid={`field-${key}-required-yes`}
                  />
                ) : (
                  <XCircle
                    className='inline-block h-4 w-4 text-muted-foreground'
                    data-testid={`field-${key}-required-no`}
                  />
                )}
              </TableCell>

              {/*------------------------- Sortable -------------------------*/}
              <TableCell className='text-center'>
                {field.sortable ? (
                  <ArrowUpDown
                    className='inline-block h-4 w-4 text-blue-600'
                    data-testid={`field-${key}-sortable-yes`}
                  />
                ) : (
                  <XCircle
                    className='inline-block h-4 w-4 text-muted-foreground'
                    data-testid={`field-${key}-sortable-no`}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
