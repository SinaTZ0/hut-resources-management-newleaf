import { notFound, redirect } from 'next/navigation'

import { getEntityById } from '@/app/entities/queries/get-entity-by-id'

import { RecordForm } from '../components/records-form/record-form'

/*------------------------ Props Type ------------------------*/
type CreateRecordPageProps = Readonly<{
  searchParams: Promise<{ entityId?: string }>
}>

/*--------------------------- Page ---------------------------*/
export default async function CreateRecordPage({ searchParams }: CreateRecordPageProps) {
  const { entityId } = await searchParams

  /*----------- If No EntityId, Redirect to Records ------------*/
  if (!entityId) {
    redirect('/records')
  }

  /*------------------ Fetch Entity For Form -------------------*/
  const entityResult = await getEntityById(entityId)

  if (!entityResult.success) {
    notFound()
  }

  /*-------------------------- Render --------------------------*/
  return (
    <main className='container py-6 mx-auto'>
      <div className='mx-auto max-w-3xl'>
        <RecordForm
          mode='create'
          entity={{
            id: entityResult.data.id,
            name: entityResult.data.name,
            fields: entityResult.data.fields,
          }}
        />
      </div>
    </main>
  )
}
