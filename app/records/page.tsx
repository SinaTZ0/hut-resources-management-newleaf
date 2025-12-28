import Link from 'next/link'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { getRecords } from './queries/get-records'
import { getEntitiesWithFields } from './queries/get-entities-with-fields'
import { RecordsTable } from './_all-recordd-table/records-table'
import { TableBuilder } from './_table-builder/table-builder'

/*------------------------- Helpers --------------------------*/
function getRecordCountText(count: number): string {
  const noun = count === 1 ? 'record' : 'records'
  return `You have ${String(count)} ${noun}.`
}

/*--------------------------- Page ---------------------------*/
export default async function RecordsPage() {
  /*--------------------------- Data ---------------------------*/
  const [recordsResult, entitiesResult] = await Promise.all([getRecords(), getEntitiesWithFields()])

  /*-------------------------- Render --------------------------*/
  return (
    <main className='py-6'>
      <div className='mx-auto flex max-w-6xl flex-col gap-8 px-4'>
        {/*-------------------------- Header --------------------------*/}
        <div className='flex items-center justify-between'>
          <div className='flex flex-col gap-2'>
            <h1 className='text-3xl font-bold tracking-tight'>Records</h1>
            <p className='text-muted-foreground'>
              Manage your resource records across all entity types.
            </p>
          </div>
          <Button asChild data-testid='create-record-btn'>
            <Link href='/records/create'>
              <Plus className='mr-2 h-4 w-4' />
              Create Record
            </Link>
          </Button>
        </div>

        {/*-------------------------- Error ---------------------------*/}
        {!recordsResult.success && (
          <Alert variant='destructive' data-testid='records-error'>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{recordsResult.error}</AlertDescription>
          </Alert>
        )}

        {!entitiesResult.success && (
          <Alert variant='destructive' data-testid='entities-error'>
            <AlertTitle>Error loading entities</AlertTitle>
            <AlertDescription>{entitiesResult.error}</AlertDescription>
          </Alert>
        )}

        {/*--------------------------- Tabs ---------------------------*/}
        {recordsResult.success && entitiesResult.success && (
          <Tabs defaultValue='all' className='w-full'>
            <TabsList className='grid w-full max-w-md grid-cols-2'>
              <TabsTrigger value='all' data-testid='tab-all-records'>
                All Records
              </TabsTrigger>
              <TabsTrigger value='builder' data-testid='tab-table-builder'>
                Table Builder
              </TabsTrigger>
            </TabsList>

            {/*--------------------- All Records Tab ----------------------*/}
            <TabsContent value='all' className='mt-6'>
              <Card>
                <CardHeader>
                  <CardTitle>All Records</CardTitle>
                  <CardDescription>{getRecordCountText(recordsResult.data.length)}</CardDescription>
                </CardHeader>
                <CardContent>
                  {recordsResult.data.length === 0 ? (
                    <div
                      className='flex flex-col items-center justify-center py-12 text-center'
                      data-testid='records-empty'
                    >
                      <p className='text-muted-foreground mb-4'>
                        No records found. Create your first record to get started.
                      </p>
                      <Button asChild>
                        <Link href='/records/create'>
                          <Plus className='mr-2 h-4 w-4' />
                          Create Record
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <RecordsTable records={recordsResult.data} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/*-------------------- Table Builder Tab ---------------------*/}
            <TabsContent value='builder' className='mt-6'>
              <TableBuilder
                entities={entitiesResult.data}
                records={recordsResult.data}
                testId='table-builder'
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  )
}
