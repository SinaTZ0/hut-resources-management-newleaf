import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

/*------------------------ Component -------------------------*/
export default function RecordNotFound() {
  return (
    <main className='container py-6'>
      <div className='mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 py-12 text-center'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Record Not Found</h1>
          <p className='text-muted-foreground'>
            The record you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
        </div>
        <Button asChild data-testid='record-not-found-back-btn'>
          <Link href='/records'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Records
          </Link>
        </Button>
      </div>
    </main>
  )
}
