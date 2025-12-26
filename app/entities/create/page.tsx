import { CreateAndUpdateEntityForm } from '../components/entities-form/entity-form'

export default function Page() {
  return (
    <main className='p-6'>
      <CreateAndUpdateEntityForm mode='create' />
    </main>
  )
}
