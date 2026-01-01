'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Upload } from 'lucide-react'
import Link from 'next/link'

import type { EntitySchema, FieldValues, Metadata } from '@/lib/drizzle/schema'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { createRecordsBatch } from '@/app/records/actions/create-records-batch'

import { PendingRecordsList } from './pending-records-list'
import { BatchRecordForm } from './batch-record-form'

/*------------------------ Constants -------------------------*/
const LARGE_BATCH_THRESHOLD = 50

/*-------------------------- Types ---------------------------*/
type EntityData = Pick<EntitySchema, 'id' | 'name' | 'description' | 'fields'>

export type PendingRecord = {
  clientId: string
  entityId: string
  entityName: string
  fieldValues: FieldValues
  metadata: Metadata
  addedAt: Date
}

type BatchCreateClientProps = {
  readonly entities: EntityData[]
}

/*-------------------- Generate Client ID --------------------*/
function generateClientId(): string {
  // Use crypto API for secure random generation (client-side only for queue management)
  return crypto.randomUUID()
}

/*------------------------ Component -------------------------*/
export function BatchCreateClient({ entities }: BatchCreateClientProps) {
  /*-------------------------- State ---------------------------*/
  const [pendingRecords, setPendingRecords] = useState<PendingRecord[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    entities.length > 0 ? entities[0].id : null
  )
  const [isPending, startTransition] = useTransition()
  const [showLargeBatchConfirm, setShowLargeBatchConfirm] = useState(false)
  const router = useRouter()

  /*--------------------- Computed Values ----------------------*/
  const selectedEntity = entities.find((e) => e.id === selectedEntityId) ?? null
  const canSubmit = pendingRecords.length > 0 && !isPending

  /*-------------------- Add Record Handler --------------------*/
  const handleAddRecord = useCallback(
    (fieldValues: FieldValues, metadata: Metadata) => {
      if (!selectedEntity) {
        toast.error('Please select an entity first')
        return
      }

      const newRecord: PendingRecord = {
        clientId: generateClientId(),
        entityId: selectedEntity.id,
        entityName: selectedEntity.name,
        fieldValues,
        metadata,
        addedAt: new Date(),
      }

      setPendingRecords((prev) => {
        const nextLength = prev.length + 1
        toast.success(`Record added to queue (${String(nextLength)} total)`)
        return [...prev, newRecord]
      })
    },
    [selectedEntity]
  )

  /*------------------ Delete Record Handler -------------------*/
  const handleDeleteRecord = useCallback((clientId: string) => {
    setPendingRecords((prev) => prev.filter((r) => r.clientId !== clientId))
    toast.info('Record removed from queue')
  }, [])

  /*-------------------- Clear All Handler ---------------------*/
  const handleClearAll = useCallback(() => {
    setPendingRecords([])
    toast.info('All records cleared from queue')
  }, [])

  /*-------------------- Submit All Handler --------------------*/
  const executeSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        const payload = {
          records: pendingRecords.map((record) => ({
            entityId: record.entityId,
            fieldValues: record.fieldValues,
            metadata: record.metadata,
          })),
        }

        const result = await createRecordsBatch(payload)

        if (!result.success) {
          /*---------------- Handle Validation Failures ----------------*/
          if (result.failedRecords && result.failedRecords.length > 0) {
            const failedIndices = result.failedRecords.map((f) => f.index + 1).join(', ')
            toast.error(`Validation failed for record(s): ${failedIndices}`, {
              description: result.error,
              duration: 5000,
            })
          } else {
            toast.error(result.error)
          }
          return
        }

        /*---------------------- Handle Success ----------------------*/
        toast.success(`Successfully created ${String(result.data.count)} record(s)`)
        setPendingRecords([])
        router.push('/records')
      } catch (error) {
        console.error('Batch submit error:', error)
        toast.error('An unexpected error occurred. Your records are still in the queue.')
      }
    })
  }, [pendingRecords, router])

  const handleSubmitAll = useCallback(() => {
    if (pendingRecords.length === 0) {
      toast.error('No records to submit')
      return
    }

    /*---------- Confirm Large Batch Before Submission -----------*/
    if (pendingRecords.length >= LARGE_BATCH_THRESHOLD) {
      setShowLargeBatchConfirm(true)
      return
    }

    executeSubmit()
  }, [pendingRecords.length, executeSubmit])

  /*-------------------------- Render --------------------------*/
  return (
    <div className='flex flex-col gap-6 h-full'>
      {/*------------- Large Batch Confirmation Dialog --------------*/}
      <AlertDialog open={showLargeBatchConfirm} onOpenChange={setShowLargeBatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit {pendingRecords.length} records?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit a large batch of {pendingRecords.length} records. This
              operation may take a moment to complete. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLargeBatchConfirm(false)
                executeSubmit()
              }}
              data-testid='batch-create-large-confirm-btn'
            >
              Submit All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/*-------------------------- Header --------------------------*/}
      <div className='flex items-start gap-4'>
        <Button variant='ghost' size='icon' asChild data-testid='batch-create-back-btn'>
          <Link href='/records'>
            <ArrowLeft className='size-6' />
          </Link>
        </Button>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-bold tracking-tight'>Batch Create Records</h1>
          <p className='text-muted-foreground text-sm'>
            Queue multiple records and submit them all at once
          </p>
        </div>
      </div>

      {/*----------------------- Main Content -----------------------*/}
      <div className='flex-1 overflow-hidden'>
        <div className='grid gap-6 lg:grid-cols-2 h-full'>
          {/*------------------------ Left Pane -------------------------*/}
          <div className='h-full overflow-auto'>
            <BatchRecordForm
              entities={entities}
              selectedEntityId={selectedEntityId}
              onEntityChange={setSelectedEntityId}
              onAddRecord={handleAddRecord}
              isSubmitting={isPending}
            />
          </div>

          {/*------------------------ Right Pane ------------------------*/}
          <div className='h-full overflow-auto'>
            <PendingRecordsList
              records={pendingRecords}
              onDeleteRecord={handleDeleteRecord}
              isSubmitting={isPending}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/*---------------------- Footer Actions ----------------------*/}
      <div className='flex items-center justify-between'>
        <div className='text-muted-foreground text-sm'>
          {pendingRecords.length === 0 ? (
            'No records in queue'
          ) : (
            <span>
              <strong>{pendingRecords.length}</strong> record(s) ready to submit
            </span>
          )}
        </div>

        <div className='flex gap-3'>
          {/*--------------------- Clear All Button ---------------------*/}
          {pendingRecords.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='outline'
                  disabled={isPending}
                  data-testid='batch-create-clear-all-btn'
                >
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all records?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all {pendingRecords.length} record(s) from the queue. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    data-testid='batch-create-clear-all-confirm-btn'
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/*-------------------- Submit All Button ---------------------*/}
          <Button
            onClick={handleSubmitAll}
            disabled={!canSubmit}
            className='min-w-40'
            data-testid='batch-create-submit-all-btn'
          >
            {isPending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Submitting...
              </>
            ) : (
              <>
                <Upload className='mr-2 h-4 w-4' />
                Submit All Records
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
