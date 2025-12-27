'use server'

import { notFound } from 'next/navigation'

import { getEntityById } from '@/app/entities/queries/get-entity-by-id'

import { EntityDetails } from './_entity-details/entity-details'

/*------------------------ Props Type ------------------------*/
type EntityDetailsPageProps = Readonly<{
  params: Promise<{ id: string }>
}>

/*--------------------------- Page ---------------------------*/
export default async function EntityDetailsPage({ params }: EntityDetailsPageProps) {
  const { id } = await params

  /*----------------------- Fetch Entity -----------------------*/
  const result = await getEntityById(id)

  if (!result.success) {
    notFound()
  }

  /*-------------------------- Render --------------------------*/
  return (
    <main className='container py-6 m-auto'>
      <EntityDetails entity={result.data} />
    </main>
  )
}
