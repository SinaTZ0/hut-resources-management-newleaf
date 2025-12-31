'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

export default function ErrorPage({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  /*------------------------- Effects --------------------------*/
  useEffect(() => {
    console.error('App error boundary:', error)
  }, [error])

  /*-------------------------- Render --------------------------*/
  return (
    <div className='p-6'>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>An unexpected error occurred. Please try again.</EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button onClick={reset} data-testid='app-error-retry'>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
