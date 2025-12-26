import { CreatAndUpdateEntityForm } from '../components/entities-form/entity-form'

export default function Page() {
  return (
    <main className='p-6'>
      <CreatAndUpdateEntityForm mode='create' />
    </main>
  )
}
