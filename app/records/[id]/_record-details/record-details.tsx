import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, Hash, Box } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import type { RecordWithEntityDetails } from '@/app/records/queries/get-record-with-entity-by-id'

import { FieldValuesDisplay } from './field-values-display'
import { MetadataDisplay } from './metadata-display'
import { CopyIdButton } from './copy-id-button'
import { ThumbnailDisplay } from './thumbnail-display'
import { AssetsDisplay } from './assets-display'

/*------------------------ Props Type ------------------------*/
type RecordDetailsProps = Readonly<{
  record: RecordWithEntityDetails
}>

/*------------------------ Component -------------------------*/
export function RecordDetails({ record }: RecordDetailsProps) {
  /*--------------------- Computed Values ----------------------*/
  const fieldCount = Object.keys(record.entityFields).length
  const hasMetadata =
    record.metadata !== null &&
    typeof record.metadata === 'object' &&
    Object.keys(record.metadata).length > 0
  const hasThumbnail = !!record.assets?.thumbnail?.path

  const createdDate = record.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const updatedDate = record.updatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  /*-------------------------- Render --------------------------*/
  return (
    <div className='mx-auto max-w-5xl space-y-6' data-testid='record-details'>
      {/*-------------------------- Header --------------------------*/}
      <div className='flex items-start gap-4'>
        <Button variant='ghost' size='icon' asChild data-testid='record-details-back-btn'>
          <Link href='/records'>
            <ArrowLeft className='size-6' />
            <span className='sr-only'>Back to records</span>
          </Link>
        </Button>

        {/*--------------------- Header Thumbnail ---------------------*/}
        {hasThumbnail && (
          <ThumbnailDisplay
            path={record.assets?.thumbnail?.path}
            size='md'
            testId='record-details-header-thumbnail'
          />
        )}

        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight' data-testid='record-details-title'>
              Record Details
            </h1>
            <Badge variant='secondary' data-testid='record-details-entity-badge'>
              <Box className='mr-1 h-3 w-3' />
              {record.entityName}
            </Badge>
          </div>
          <p className='text-muted-foreground'>
            View and manage this {record.entityName.toLowerCase()} record
          </p>
        </div>
      </div>

      {/*---------------------- Meta Info Bar -----------------------*/}
      <div className='text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm'>
        {/*---------------------------- ID ----------------------------*/}
        <div className='flex items-center gap-2'>
          <span className='text-foreground font-medium'>ID:</span>
          <code
            className='bg-muted rounded px-1.5 py-0.5 font-mono text-xs'
            data-testid='record-details-id'
          >
            {record.id.slice(0, 8)}...
          </code>
          <CopyIdButton id={record.id} />
        </div>

        <Separator orientation='vertical' className='h-4' />

        {/*----------------------- Fields Count -----------------------*/}
        <div className='flex items-center gap-2'>
          <Hash className='h-4 w-4' />
          <span data-testid='record-details-field-count'>
            <span className='text-foreground font-medium'>{fieldCount}</span>{' '}
            {fieldCount === 1 ? 'field' : 'fields'}
          </span>
        </div>

        <Separator orientation='vertical' className='h-4' />

        {/*------------------------- Created --------------------------*/}
        <div className='flex items-center gap-2'>
          <Calendar className='h-4 w-4' />
          <span>
            Created <span data-testid='record-details-created'>{createdDate}</span>
          </span>
        </div>

        <Separator orientation='vertical' className='h-4' />

        {/*------------------------- Updated --------------------------*/}
        <div className='flex items-center gap-2'>
          <span>
            Updated <span data-testid='record-details-updated'>{updatedDate}</span>
          </span>
        </div>
      </div>

      {/*-------------------- Field Values Card ---------------------*/}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg'>Core Properties</CardTitle>
          <CardDescription>
            Structured data fields for this {record.entityName.toLowerCase()} record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldValuesDisplay fields={record.entityFields} values={record.fieldValues} />
        </CardContent>
      </Card>

      {/*---------------------- Metadata Card -----------------------*/}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-lg'>Additional Details</CardTitle>
              <CardDescription>Free-form JSON data for extra information</CardDescription>
            </div>
            {hasMetadata && (
              <Badge variant='secondary' data-testid='record-details-has-metadata'>
                Has Data
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <MetadataDisplay values={record.metadata} />
        </CardContent>
      </Card>

      {/*----------------------- Assets Card ------------------------*/}
      <AssetsDisplay recordId={record.id} assets={record.assets} testId='record-details-assets' />

      {/*------------------------ Action Bar ------------------------*/}
      <div className='flex justify-end'>
        <div className='flex flex-row gap-2'>
          <Button asChild variant='outline' data-testid='record-details-view-entity-btn'>
            <Link href={`/entities/${record.entityId}`}>View Entity</Link>
          </Button>
          <Button asChild data-testid='record-details-edit-btn' className='bg-emerald-600'>
            <Link href={`/records/${record.id}/edit`}>
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
