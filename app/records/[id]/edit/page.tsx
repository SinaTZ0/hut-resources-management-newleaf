import { notFound } from 'next/navigation'

import { getRecordById } from '@/app/records/queries/get-record-by-id'

import { RecordForm } from '../../components/records-form/record-form'

/*------------------------ Props Type ------------------------*/
type EditRecordPageProps = Readonly<{
  params: Promise<{ id: string }>
}>

/*--------------------------- Page ---------------------------*/
export default async function EditRecordPage({ params }: EditRecordPageProps) {
  const { id } = await params

  /*----------------------- Fetch Record -----------------------*/
  const result = await getRecordById(id)

  if (!result.success) {
    notFound()
  }

  const record = result.data

  /*-------------------------- Render --------------------------*/
  return (
    <main className='container py-6 m-auto'>
      <div className='max-w-3xl m-auto'>
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
            depth1Values: record.depth1Values,
            depth2Values: record.depth2Values,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
          }}
        />
      </div>
    </main>
  )
}
