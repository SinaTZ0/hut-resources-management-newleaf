'use client'

import type { Assets } from '@/lib/drizzle/schema'

import { ThumbnailUpload } from './thumbnail-upload'
import { GalleryUpload } from './gallery-upload'
import { FilesUpload } from './files-upload'

/*-------------------------- Types ---------------------------*/
type AssetsFormProps = {
  readonly recordId: string
  readonly existingAssets?: Assets
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function AssetsForm({ recordId, existingAssets, testId }: AssetsFormProps) {
  return (
    <div className='space-y-6' data-testid={testId}>
      {/*------------------------ Thumbnail -------------------------*/}
      <ThumbnailUpload
        recordId={recordId}
        existingPath={existingAssets?.thumbnail?.path}
        testId={testId ? `${testId}-thumbnail` : 'assets-thumbnail'}
      />

      {/*------------------------ Galleries -------------------------*/}
      <GalleryUpload
        recordId={recordId}
        existingGalleries={existingAssets?.galleries}
        testId={testId ? `${testId}-galleries` : 'assets-galleries'}
      />

      {/*-------------------------- Files ---------------------------*/}
      <FilesUpload
        recordId={recordId}
        existingFiles={existingAssets?.files}
        testId={testId ? `${testId}-files` : 'assets-files'}
      />
    </div>
  )
}
