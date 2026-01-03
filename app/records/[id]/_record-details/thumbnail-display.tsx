'use client'

import Image from 'next/image'
import { ImageOff } from 'lucide-react'

import { cn } from '@/lib/utils/common-utils'

/*-------------------------- Types ---------------------------*/
type ThumbnailDisplayProps = {
  readonly path: string | null | undefined
  readonly size?: 'sm' | 'md' | 'lg'
  readonly className?: string
  readonly testId?: string
}

/*----------------------- Size Config ------------------------*/
const sizeConfig = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
}

const imageSizes = {
  sm: '64px',
  md: '96px',
  lg: '128px',
}

/*------------------------ Component -------------------------*/
export function ThumbnailDisplay({ path, size = 'md', className, testId }: ThumbnailDisplayProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border bg-muted',
        sizeConfig[size],
        className
      )}
      data-testid={testId}
    >
      {path ? (
        <Image
          src={path}
          alt='Record thumbnail'
          fill
          className='object-cover'
          sizes={imageSizes[size]}
        />
      ) : (
        <div className='flex h-full w-full items-center justify-center'>
          <ImageOff className='h-8 w-8 text-muted-foreground/50' />
        </div>
      )}
    </div>
  )
}
