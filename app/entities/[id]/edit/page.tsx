import { notFound } from 'next/navigation'

import { getEntityById } from '@/app/entities/queries/get-entity-by-id'

import { CreatAndUpdateEntityForm } from '../../components/entities-form/entity-form'

/*------------------------ Props Type ------------------------*/
type EditEntityPageProps = Readonly<{
  params: Promise<{ id: string }>
}>

/*--------------------------- Page ---------------------------*/
export default async function EditEntityPage({ params }: EditEntityPageProps) {
  const { id } = await params

  /*----------------------- Fetch Entity -----------------------*/
  const result = await getEntityById(id)

  if (!result.success) {
    notFound()
  }

  /*-------------------------- Render --------------------------*/
  return (
    <main className='py-6'>
      <CreatAndUpdateEntityForm mode='edit' initialData={result.data} />
    </main>
  )
}
