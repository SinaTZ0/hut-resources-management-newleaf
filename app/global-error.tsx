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

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  /*------------------------- Effects --------------------------*/
  useEffect(() => {
    console.error('Global error boundary:', error)
  }, [error])

  /*-------------------------- Render --------------------------*/
  return (
    <html lang='en'>
      <body>
        <div className='p-6'>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Application error</EmptyTitle>
              <EmptyDescription>Something went wrong while rendering the app.</EmptyDescription>
            </EmptyHeader>

            <EmptyContent>
              <Button onClick={reset} data-testid='global-error-retry'>
                Reload
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </body>
    </html>
  )
}
