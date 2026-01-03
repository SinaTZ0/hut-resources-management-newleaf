'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronDown, Images, Loader2 } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils/common-utils'
import { fromSlug } from '@/lib/utils/slug-utils'
import { getGalleryImages } from '@/app/records/queries/get-record-assets'
import type { AssetGallery } from '@/lib/drizzle/schema'

/*-------------------------- Types ---------------------------*/
type GalleryAccordionProps = {
  readonly recordId: string
  readonly gallery: AssetGallery
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function GalleryAccordion({ recordId, gallery, testId }: GalleryAccordionProps) {
  /*-------------------------- State ---------------------------*/
  const [isOpen, setIsOpen] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /*----------------------- Lazy Loading -----------------------*/
  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open)

      // Only fetch if opening and hasn't loaded yet
      if (open && !hasLoaded && !isLoading) {
        setIsLoading(true)
        setError(null)

        try {
          const result = await getGalleryImages(recordId, gallery.titleAndID)

          if (result.success) {
            setImages(result.data.paths)
            setHasLoaded(true)
          } else {
            setError(result.error)
          }
        } catch {
          setError('Failed to load gallery images')
        } finally {
          setIsLoading(false)
        }
      }
    },
    [recordId, gallery.titleAndID, hasLoaded, isLoading]
  )

  /*-------------------------- Render --------------------------*/
  return (
    <Collapsible open={isOpen} onOpenChange={(open) => void handleOpenChange(open)}>
      <CollapsibleTrigger
        className='flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left hover:bg-muted/50 transition-colors'
        data-testid={testId ? `${testId}-trigger` : 'gallery-trigger'}
      >
        <div className='flex items-center gap-3'>
          <Images className='h-5 w-5 text-muted-foreground' />
          <div>
            <p className='font-medium'>{fromSlug(gallery.titleAndID)}</p>
            <p className='text-xs text-muted-foreground'>
              {gallery.paths.length} image{gallery.paths.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'h-5 w-5 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className='mt-2'>
        <div className='rounded-lg border p-4'>
          {/*------------------------- Loading --------------------------*/}
          {isLoading && (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
            </div>
          )}

          {/*-------------------------- Error ---------------------------*/}
          {error && !isLoading && (
            <div className='flex items-center justify-center py-8 text-destructive'>
              <p>{error}</p>
            </div>
          )}

          {/*-------------------------- Images --------------------------*/}
          {!isLoading && !error && images.length > 0 && (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
              {images.map((imagePath, index) => (
                <a
                  key={imagePath}
                  href={imagePath}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='group relative aspect-square overflow-hidden rounded-lg border bg-muted hover:ring-2 hover:ring-primary transition-all'
                >
                  <Image
                    src={imagePath}
                    alt={`Gallery image ${String(index + 1)}`}
                    fill
                    className='object-cover group-hover:scale-105 transition-transform'
                    sizes='(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw'
                  />
                </a>
              ))}
            </div>
          )}

          {/*-------------------------- Empty ---------------------------*/}
          {!isLoading && !error && hasLoaded && images.length === 0 && (
            <div className='flex items-center justify-center py-8 text-muted-foreground'>
              <p>No images in this gallery</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
