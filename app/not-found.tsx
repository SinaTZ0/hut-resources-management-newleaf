import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

export default function NotFound() {
  return (
    <div className='p-6'>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            The page you’re looking for doesn’t exist or has moved.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent>
          <Button asChild data-testid='not-found-go-home'>
            <Link href='/'>Go home</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
