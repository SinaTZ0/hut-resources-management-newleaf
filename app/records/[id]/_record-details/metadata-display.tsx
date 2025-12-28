import type { Metadata } from '@/lib/drizzle/schema'
import { cn } from '@/lib/utils/common-utils'

/*------------------------ Props Type ------------------------*/
type MetadataDisplayProps = Readonly<{
  values: Metadata
  className?: string
}>

/*------------------------ Component -------------------------*/
export function MetadataDisplay({ values, className }: MetadataDisplayProps) {
  /*-------------------- Handle Empty State --------------------*/
  if (!values || Object.keys(values).length === 0) {
    return (
      <div
        className={cn('text-muted-foreground py-4 text-center text-sm italic', className)}
        data-testid='metadata-display-empty'
      >
        No additional details provided
      </div>
    )
  }

  /*-------------------------- Render --------------------------*/
  return (
    <div
      className={cn('overflow-hidden rounded-md border', className)}
      data-testid='metadata-display'
    >
      <pre className='bg-muted/50 overflow-auto p-4 text-sm'>
        <code className='text-foreground'>{JSON.stringify(values, null, 2)}</code>
      </pre>
    </div>
  )
}
