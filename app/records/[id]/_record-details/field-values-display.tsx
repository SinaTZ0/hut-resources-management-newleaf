import { format } from 'date-fns'

import type { FieldsSchema, FieldValues } from '@/lib/drizzle/schema'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

/*------------------------ Props Type ------------------------*/
type FieldValuesDisplayProps = Readonly<{
  fields: FieldsSchema
  values: FieldValues
}>

/*----------------------- Format Value -----------------------*/
function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined) {
    return '—'
  }

  // Handle objects first to avoid stringification issues
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  // Now value is string | number | boolean | symbol | bigint
  const primitiveValue = value as string | number | boolean

  switch (type) {
    case 'boolean':
      return primitiveValue === true ? 'Yes' : 'No'
    case 'date':
      try {
        return format(new Date(primitiveValue as string | number), 'PPP')
      } catch {
        return String(primitiveValue)
      }
    case 'enum':
      // Return enum value as-is
      return typeof primitiveValue === 'string' && primitiveValue.length > 0 ? primitiveValue : '—'
    case 'number':
    case 'string':
    default:
      return String(primitiveValue)
  }
}

/*------------------------ Component -------------------------*/
export function FieldValuesDisplay({ fields, values }: FieldValuesDisplayProps) {
  /*------------------- Sort Fields By Order -------------------*/
  const sortedFields = Object.entries(fields).sort(([, a], [, b]) => a.order - b.order)

  /*-------------------------- Render --------------------------*/
  return (
    <Table data-testid='field-values-display'>
      <TableHeader>
        <TableRow>
          <TableHead className='w-[200px]'>Field</TableHead>
          <TableHead className='w-[100px]'>Type</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedFields.map(([key, fieldDef]) => (
          <TableRow key={key} data-testid={`field-values-row-${key}`}>
            <TableCell className='font-medium'>
              {fieldDef.label}
              {fieldDef.required && <span className='text-destructive ml-1'>*</span>}
            </TableCell>
            <TableCell>
              <Badge variant='outline' className='text-xs'>
                {fieldDef.type}
              </Badge>
            </TableCell>
            <TableCell data-testid={`field-values-value-${key}`}>
              {formatValue(values[key], fieldDef.type)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
