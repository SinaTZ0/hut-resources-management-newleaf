'use client'

import { Images, FileIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Assets } from '@/lib/drizzle/schema'

import { ThumbnailDisplay } from './thumbnail-display'
import { GalleryAccordion } from './gallery-accordion'
import { FilesAccordion } from './files-accordion'

/*-------------------------- Types ---------------------------*/
type AssetsDisplayProps = {
  readonly recordId: string
  readonly assets: Assets
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function AssetsDisplay({ recordId, assets, testId }: AssetsDisplayProps) {
  /*--------------------- Computed Values ----------------------*/
  const hasGalleries = (assets?.galleries?.length ?? 0) > 0
  const hasFiles = (assets?.files?.length ?? 0) > 0
  const hasThumbnail = !!assets?.thumbnail?.path

  /*-------------------------- Render --------------------------*/
  return (
    <div className='space-y-6' data-testid={testId}>
      {/*------------------------ Thumbnail -------------------------*/}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-lg'>Thumbnail</CardTitle>
              <CardDescription>Main image for this record</CardDescription>
            </div>
            {hasThumbnail && (
              <Badge
                variant='secondary'
                data-testid={testId ? `${testId}-has-thumbnail` : 'has-thumbnail'}
              >
                Has Image
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ThumbnailDisplay
            path={assets?.thumbnail?.path}
            size='lg'
            testId={testId ? `${testId}-thumbnail` : 'assets-thumbnail'}
          />
        </CardContent>
      </Card>

      {/*------------------------ Galleries -------------------------*/}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-lg'>Galleries</CardTitle>
              <CardDescription>Image collections for this record</CardDescription>
            </div>
            {hasGalleries && assets?.galleries && (
              <Badge variant='secondary'>
                {assets.galleries.length} {assets.galleries.length === 1 ? 'gallery' : 'galleries'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasGalleries && assets?.galleries ? (
            <div className='space-y-3'>
              {assets.galleries.map((gallery) => (
                <GalleryAccordion
                  key={gallery.titleAndID}
                  recordId={recordId}
                  gallery={gallery}
                  testId={testId ? `${testId}-gallery-${gallery.titleAndID}` : undefined}
                />
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center text-muted-foreground'>
              <Images className='h-12 w-12 mb-2 opacity-50' />
              <p>No galleries</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/*-------------------------- Files ---------------------------*/}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-lg'>Files</CardTitle>
              <CardDescription>Attached documents and files</CardDescription>
            </div>
            {hasFiles && assets?.files && (
              <Badge variant='secondary'>
                {assets.files.length} {assets.files.length === 1 ? 'group' : 'groups'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasFiles && assets?.files ? (
            <div className='space-y-3'>
              {assets.files.map((fileGroup) => (
                <FilesAccordion
                  key={fileGroup.titleAndID}
                  recordId={recordId}
                  fileGroup={fileGroup}
                  testId={testId ? `${testId}-files-${fileGroup.titleAndID}` : undefined}
                />
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 text-center text-muted-foreground'>
              <FileIcon className='h-12 w-12 mb-2 opacity-50' />
              <p>No files</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
