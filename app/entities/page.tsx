import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import { getEntities } from './queries/get-entities'
import { EntitiesTable } from './components/entities-table'

/*------------------------- Helpers --------------------------*/
function getEntityCountText(count: number): string {
  const noun = count === 1 ? 'entity' : 'entities'
  return `You have ${String(count)} ${noun}.`
}

/*--------------------------- Page ---------------------------*/
export default async function EntitiesPage() {
  /*--------------------------- Data ---------------------------*/
  const result = await getEntities()

  /*-------------------------- Render --------------------------*/
  return (
    <div className='flex flex-col max-w-6xl mx-auto py-8 px-4 gap-8'>
      {/*-------------------------- Header --------------------------*/}
      <div className='flex items-center justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Entities</h1>
          <p className='text-muted-foreground'>
            Manage your resource types and their field configurations.
          </p>
        </div>
        <Button asChild data-testid='create-entity-btn'>
          <Link href='/entities/create'>
            <Plus className='mr-2 h-4 w-4' />
            Create Entity
          </Link>
        </Button>
      </div>

      {/*-------------------------- Error ---------------------------*/}
      {!result.success && (
        <Alert variant='destructive' data-testid='entities-error'>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      )}

      {/*-------------------------- Table ---------------------------*/}
      {result.success && (
        <Card>
          <CardHeader>
            <CardTitle>All Entities</CardTitle>
            <CardDescription>
              {result.data.length === 0
                ? 'No entities found. Create your first entity to get started.'
                : getEntityCountText(result.data.length)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EntitiesTable entities={result.data} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
