import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

import { getEntitiesWithFields } from '@/app/records/queries/get-entities-with-fields'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

import { BatchCreateClient } from './_batch-create-client/batch-create-client'

/*--------------------------- Page ---------------------------*/
export default async function BatchCreatePage() {
  /*-------------------- Fetch All Entities --------------------*/
  const entitiesResult = await getEntitiesWithFields()

  /*-------------------- Handle Query Error --------------------*/
  if (!entitiesResult.success) {
    return (
      <main className='container mx-auto py-6'>
        <div className='flex flex-col gap-6'>
          <Button variant='ghost' size='sm' asChild className='w-fit'>
            <Link href='/records'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Records
            </Link>
          </Button>
          <Alert variant='destructive' data-testid='batch-create-error'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Failed to load entities</AlertTitle>
            <AlertDescription>
              {entitiesResult.error || 'An unexpected error occurred. Please try again later.'}
            </AlertDescription>
          </Alert>
        </div>
      </main>
    )
  }

  /*----------------- Check If Entities Exist ------------------*/
  if (entitiesResult.data.length === 0) {
    return (
      <main className='container mx-auto py-6'>
        <div
          className='flex flex-col items-center justify-center gap-4 py-16'
          data-testid='batch-create-no-entities'
        >
          <h1 className='text-2xl font-bold'>No Entities Available</h1>
          <p className='text-muted-foreground'>
            Please create at least one entity before adding records.
          </p>
          <Button asChild data-testid='batch-create-to-entities-btn'>
            <Link href='/entities/create'>Create Entity First</Link>
          </Button>
        </div>
      </main>
    )
  }

  /*-------------------------- Render --------------------------*/
  return (
    <main className='container mx-auto py-6'>
      {/* Use a fixed-height wrapper so the client area fills the viewport (desktop-first) */}
      <div className='flex flex-col lg:h-[calc(100vh-7rem)] overflow-hidden'>
        <BatchCreateClient entities={entitiesResult.data} />
      </div>
    </main>
  )
}
