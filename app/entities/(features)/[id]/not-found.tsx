import Link from 'next/link'
import { ArrowLeft, FileQuestion } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/*--------------------------- Page ---------------------------*/
export default function EntityNotFound() {
  return (
    <main className='flex flex-col items-center justify-center min-h-svh py-8 px-4'>
      <Card className='max-w-md w-full'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <div className='p-4 rounded-full bg-muted'>
              <FileQuestion className='h-12 w-12 text-muted-foreground' />
            </div>
          </div>
          <CardTitle className='text-2xl'>Entity Not Found</CardTitle>
          <CardDescription>
            The entity you&apos;re looking for doesn&apos;t exist or may have been deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <Button asChild data-testid='not-found-back-btn'>
            <Link href='/entities'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Entities
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
