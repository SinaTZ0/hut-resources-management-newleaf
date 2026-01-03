'use client'

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

type RequiredFieldDialogProps = {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly affectedCount: number
  readonly onConfirm: () => void
  readonly isPending?: boolean
  readonly testId?: string
}

export function RequiredFieldDialog({
  open,
  onOpenChange,
  affectedCount,
  onConfirm,
  isPending,
  testId,
}: RequiredFieldDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid={testId ? `${testId}-dialog` : 'required-field-dialog'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm required field update</AlertDialogTitle>
          <AlertDialogDescription>
            Applying this change will set the default value on <strong>{affectedCount}</strong>{' '}
            existing record{affectedCount !== 1 ? 's' : ''}. Proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            data-testid={testId ? `${testId}-cancel` : 'required-field-dialog-cancel'}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            data-testid={testId ? `${testId}-confirm` : 'required-field-dialog-confirm'}
          >
            Proceed
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
