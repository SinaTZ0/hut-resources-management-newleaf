import { notFound } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getEntities } from '@/app/entities/queries/get-entities'
import { getEntityById } from '@/app/entities/queries/get-entity-by-id'

import { RecordForm } from '../components/records-form/record-form'
import { EntitySelector } from '../components/records-form/entity-selector'

/*------------------------ Props Type ------------------------*/
type CreateRecordPageProps = Readonly<{
  searchParams: Promise<{ entityId?: string }>
}>

/*--------------------------- Page ---------------------------*/
export default async function CreateRecordPage({ searchParams }: CreateRecordPageProps) {
  const { entityId } = await searchParams

  /*-------------- If No EntityId, Show Selector ---------------*/
  if (!entityId) {
    const entitiesResult = await getEntities()

    if (!entitiesResult.success) {
      return (
        <main className='container py-6'>
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>{entitiesResult.error}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      )
    }

    if (entitiesResult.data.length === 0) {
      return (
        <main className='container py-6'>
          <div className='mx-auto max-w-2xl'>
            <Card>
              <CardHeader>
                <CardTitle>No Entities Found</CardTitle>
                <CardDescription>
                  You need to create an entity before you can create records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href='/entities/create'>Create Entity</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      )
    }

    return (
      <main className='container py-6'>
        <div className='mx-auto max-w-2xl'>
          <Card>
            <CardHeader>
              <CardTitle>Create Record</CardTitle>
              <CardDescription>Select an entity type to create a new record</CardDescription>
            </CardHeader>
            <CardContent>
              <EntitySelector
                entities={entitiesResult.data.map((e) => ({
                  id: e.id,
                  name: e.name,
                  description: e.description,
                }))}
                testId='entity-selector'
              />
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  /*------------------ Fetch Entity For Form -------------------*/
  const entityResult = await getEntityById(entityId)

  if (!entityResult.success) {
    notFound()
  }

  /*-------------------------- Render --------------------------*/
  return (
    <main className='container py-6'>
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
