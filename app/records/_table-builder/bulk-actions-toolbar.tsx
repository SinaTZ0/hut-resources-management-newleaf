'use client'

import { useState } from 'react'
import { Trash2, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { FieldsSchema } from '@/lib/drizzle/schema'

import { deleteRecordsBatch } from '../actions/delete-records-batch'

import { BatchEditDialog } from './batch-edit-dialog'

/*-------------------------- Types ---------------------------*/
type BulkActionsToolbarProps = {
  readonly selectedIds: string[]
  readonly entityId: string
  readonly entityFields: FieldsSchema
  readonly onActionComplete: () => void
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function BulkActionsToolbar({
  selectedIds,
  entityId,
  entityFields,
  onActionComplete,
  testId,
}: BulkActionsToolbarProps) {
  /*-------------------------- State ---------------------------*/
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  /*------------------------- Derived --------------------------*/
  const selectedCount = selectedIds.length
  const hasSelection = selectedCount > 0

  /*------------------------- Handlers -------------------------*/
  async function handleBulkDelete() {
    if (selectedCount === 0) return

    setIsDeleting(true)

    try {
      const result = await deleteRecordsBatch(selectedIds)

      if (result.success) {
        toast.success(`Successfully deleted ${String(result.data.deletedCount)} record(s)`)
        setIsDeleteDialogOpen(false)
        onActionComplete()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  function handleEditComplete() {
    setIsEditDialogOpen(false)
    onActionComplete()
  }

  /*-------------------------- Render --------------------------*/
  if (!hasSelection) return null

  return (
    <>
      <div className='flex items-center gap-2' data-testid={testId}>
        <span className='text-sm text-muted-foreground'>
          <strong className='text-foreground'>{String(selectedCount)}</strong> selected
        </span>

        <Button
          variant='outline'
          size='sm'
          onClick={() => setIsEditDialogOpen(true)}
          data-testid={testId ? `${testId}-edit-btn` : 'bulk-edit-btn'}
        >
          <Pencil className='mr-2 h-4 w-4' />
          Edit Field
        </Button>

        <Button
          variant='destructive'
          size='sm'
          onClick={() => setIsDeleteDialogOpen(true)}
          data-testid={testId ? `${testId}-delete-btn` : 'bulk-delete-btn'}
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Delete
        </Button>
      </div>

      {/*------------------- Delete Confirmation --------------------*/}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {String(selectedCount)} record(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected{' '}
              {selectedCount === 1 ? 'record' : 'records'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleBulkDelete()}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                `Delete ${String(selectedCount)} record(s)`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/*-------------------- Batch Edit Dialog ---------------------*/}
      <BatchEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedIds={selectedIds}
        entityId={entityId}
        entityFields={entityFields}
        onComplete={handleEditComplete}
      />
    </>
  )
}
