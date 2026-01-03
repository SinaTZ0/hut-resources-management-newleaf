import { notFound } from 'next/navigation'

import { Separator } from '@/components/ui/separator'
import { getRecordWithEntityById } from '@/app/records/queries/get-record-with-entity-by-id'

import { RecordForm } from '../../components/records-form/record-form'
import { AssetsForm } from '../../components/assets-form/assets-form'

/*------------------------ Props Type ------------------------*/
type EditRecordPageProps = Readonly<{
  params: Promise<{ id: string }>
}>

/*--------------------------- Page ---------------------------*/
export default async function EditRecordPage({ params }: EditRecordPageProps) {
  const { id } = await params

  /*----------------------- Fetch Record -----------------------*/
  const result = await getRecordWithEntityById(id)

  if (!result.success) {
    notFound()
  }

  const record = result.data

  /*-------------------------- Render --------------------------*/
  return (
    <main className='container py-6 m-auto'>
      <div className='max-w-3xl m-auto space-y-8'>
        {/*----------------------- Record Form ------------------------*/}
        <RecordForm
          mode='edit'
          entity={{
            id: record.entityId,
            name: record.entityName,
            fields: record.entityFields,
          }}
          initialData={{
            id: record.id,
            entityId: record.entityId,
            fieldValues: record.fieldValues,
            metadata: record.metadata,
            assets: record.assets,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          }}
        />

        <Separator />

        {/*---------------------- Assets Section ----------------------*/}
        <div className='space-y-4'>
          <div>
            <h2 className='text-xl font-semibold tracking-tight'>Assets</h2>
            <p className='text-sm text-muted-foreground'>
              Upload and manage images and files for this record
            </p>
          </div>
          <AssetsForm
            recordId={record.id}
            existingAssets={record.assets}
            testId='edit-record-assets'
          />
        </div>
      </div>
    </main>
  )
}
