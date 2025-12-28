'use server'

import { notFound } from 'next/navigation'

import { getRecordById } from '@/app/records/queries/get-record-by-id'

import { RecordDetails } from './_record-details/record-details'

/*------------------------ Props Type ------------------------*/
type RecordDetailsPageProps = Readonly<{
  params: Promise<{ id: string }>
}>

/*--------------------------- Page ---------------------------*/
export default async function RecordDetailsPage({ params }: RecordDetailsPageProps) {
  const { id } = await params

  /*----------------------- Fetch Record -----------------------*/
  const result = await getRecordById(id)

  if (!result.success) {
    notFound()
  }

  /*-------------------------- Render --------------------------*/
  return (
    <main className='container m-auto py-6'>
      <RecordDetails record={result.data} />
    </main>
  )
}
