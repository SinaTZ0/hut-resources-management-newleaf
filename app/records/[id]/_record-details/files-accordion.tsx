'use client'

import { useState, useCallback } from 'react'
import { ChevronDown, FileIcon, Loader2, Download } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils/common-utils'
import { fromSlug } from '@/lib/utils/slug-utils'
import { getFileGroup } from '@/app/records/queries/get-record-assets'
import type { AssetFile } from '@/lib/drizzle/schema'

/*-------------------------- Types ---------------------------*/
type FilesAccordionProps = {
  readonly recordId: string
  readonly fileGroup: AssetFile
  readonly testId?: string
}

/*------------------- Get Filename Helper --------------------*/
function getFilename(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1] ?? path
}

/*------------------------ Component -------------------------*/
export function FilesAccordion({ recordId, fileGroup, testId }: FilesAccordionProps) {
  /*-------------------------- State ---------------------------*/
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<string[]>([])
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
          const result = await getFileGroup(recordId, fileGroup.titleAndID)

          if (result.success) {
            setFiles(result.data.paths)
            setHasLoaded(true)
          } else {
            setError(result.error)
          }
        } catch {
          setError('Failed to load files')
        } finally {
          setIsLoading(false)
        }
      }
    },
    [recordId, fileGroup.titleAndID, hasLoaded, isLoading]
  )

  /*-------------------------- Render --------------------------*/
  return (
    <Collapsible open={isOpen} onOpenChange={(open) => void handleOpenChange(open)}>
      <CollapsibleTrigger
        className='flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left hover:bg-muted/50 transition-colors'
        data-testid={testId ? `${testId}-trigger` : 'files-trigger'}
      >
        <div className='flex items-center gap-3'>
          <FileIcon className='h-5 w-5 text-muted-foreground' />
          <div>
            <p className='font-medium'>{fromSlug(fileGroup.titleAndID)}</p>
            <p className='text-xs text-muted-foreground'>
              {fileGroup.paths.length} file{fileGroup.paths.length !== 1 ? 's' : ''}
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

          {/*-------------------------- Files ---------------------------*/}
          {!isLoading && !error && files.length > 0 && (
            <div className='space-y-2'>
              {files.map((filePath) => {
                const filename = getFilename(filePath)
                return (
                  <a
                    key={filePath}
                    href={filePath}
                    download={filename}
                    className='flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors group'
                  >
                    <div className='flex items-center gap-3 overflow-hidden'>
                      <FileIcon className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                      <span className='text-sm truncate'>{filename}</span>
                    </div>
                    <Download className='h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
                  </a>
                )
              })}
            </div>
          )}

          {/*-------------------------- Empty ---------------------------*/}
          {!isLoading && !error && hasLoaded && files.length === 0 && (
            <div className='flex items-center justify-center py-8 text-muted-foreground'>
              <p>No files in this group</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
