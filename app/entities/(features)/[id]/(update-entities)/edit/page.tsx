import { notFound } from 'next/navigation'

import { EntityForm } from './components/entity-form'
import { getEntityById } from '@/app/entities/queries/get-entity-by-id'

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
      <EntityForm mode='edit' initialData={result.data} />
    </main>
  )
}
