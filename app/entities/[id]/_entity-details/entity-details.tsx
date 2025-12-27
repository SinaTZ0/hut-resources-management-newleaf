import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, Hash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { SelectEntitySchemaType } from '@/lib/drizzle/schema'

import { FieldsDisplay } from './fields-display'
import { CopyIdButton } from './copy-id-button'

/*------------------------ Props Type ------------------------*/
type EntityDetailsProps = Readonly<{
  entity: SelectEntitySchemaType
}>

/*------------------------ Component -------------------------*/
export function EntityDetails({ entity }: EntityDetailsProps) {
  /*--------------------- Computed Values ----------------------*/
  const fieldCount = Object.keys(entity.fields).length
  const createdDate = entity.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const updatedDate = entity.updatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  /*-------------------------- Render --------------------------*/
  return (
    <div className='max-w-5xl mx-auto space-y-6' data-testid='entity-details'>
      {/*-------------------------- Header --------------------------*/}
      <div className='flex items-start gap-4'>
        <Button variant='ghost' size='icon' asChild data-testid='entity-details-back-btn'>
          <Link href='/entities'>
            <ArrowLeft className='size-6' />
            <span className='sr-only'>Back to entities</span>
          </Link>
        </Button>
        <div className='space-y-1'>
          <h1 className='text-2xl font-bold tracking-tight' data-testid='entity-details-name'>
            {entity.name}
          </h1>
          {entity.description ? (
            <p className='text-muted-foreground max-w-2xl' data-testid='entity-details-description'>
              {entity.description}
            </p>
          ) : (
            <p className='text-muted-foreground italic' data-testid='entity-details-no-description'>
              No description
            </p>
          )}
        </div>
      </div>

      {/*---------------------- Meta Info Bar -----------------------*/}
      <div className='flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground border rounded-lg px-4 py-3 bg-muted/30'>
        {/*---------------------------- ID ----------------------------*/}
        <div className='flex items-center gap-2'>
          <span className='font-medium text-foreground'>ID:</span>
          <code
            className='text-xs font-mono bg-muted px-1.5 py-0.5 rounded'
            data-testid='entity-details-id'
          >
            {entity.id.slice(0, 8)}...
          </code>
          <CopyIdButton id={entity.id} />
        </div>

        <Separator orientation='vertical' className='h-4' />

        {/*----------------------- Fields Count -----------------------*/}
        <div className='flex items-center gap-2'>
          <Hash className='h-4 w-4' />
          <span data-testid='entity-details-field-count'>
            <span className='font-medium text-foreground'>{fieldCount}</span>{' '}
            {fieldCount === 1 ? 'field' : 'fields'}
          </span>
        </div>

        <Separator orientation='vertical' className='h-4' />

        {/*------------------------- Created --------------------------*/}
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4' />
          <span>
            Created <span data-testid='entity-details-created'>{createdDate}</span>
          </span>
        </div>

        <Separator orientation='vertical' className='h-4' />

        {/*------------------------- Updated --------------------------*/}
        <div className='flex items-center gap-2'>
          <span>
            Updated <span data-testid='entity-details-updated'>{updatedDate}</span>
          </span>
        </div>
      </div>

      {/*----------------------- Fields Table -----------------------*/}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Fields Schema</CardTitle>
          <CardDescription>
            The fields that define this entity&apos;s data structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldsDisplay fields={entity.fields} />
        </CardContent>
      </Card>

      {/*------------------------ Action Bar ------------------------*/}
      <div className='flex justify-end'>
        <div className='flex flex-row gap-2'>
          <Button asChild data-testid='entity-details-edit-btn' className='bg-emerald-600'>
            <Link href={`/entities/${entity.id}/edit`}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
