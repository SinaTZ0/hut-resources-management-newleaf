'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2 } from 'lucide-react'
import Image from 'next/image'

import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/common-utils'

import { uploadThumbnail } from '../../actions/upload-assets'

/*-------------------------- Types ---------------------------*/
type ThumbnailUploadProps = {
  readonly recordId: string
  readonly existingPath?: string | null
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function ThumbnailUpload({ recordId, existingPath, testId }: ThumbnailUploadProps) {
  /*-------------------------- State ---------------------------*/
  const [preview, setPreview] = useState<string | null>(existingPath ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /*------------------------- Handlers -------------------------*/
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      /*---------------------- Validate Type -----------------------*/
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please select a JPEG, PNG, WebP, or GIF image.')
        return
      }

      /*---------------------- Validate Size -----------------------*/
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error('File too large. Maximum size is 10MB.')
        return
      }

      /*----------------------- Show Preview -----------------------*/
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      /*-------------------------- Upload --------------------------*/
      setIsUploading(true)

      try {
        const formData = new FormData()
        formData.append('thumbnail', file)

        const result = await uploadThumbnail(recordId, formData)

        if (result.success) {
          toast.success('Thumbnail uploaded successfully')
          setPreview(result.data.path)
        } else {
          toast.error(result.error)
          setPreview(existingPath ?? null)
        }
      } catch {
        toast.error('Failed to upload thumbnail')
        setPreview(existingPath ?? null)
      } finally {
        setIsUploading(false)
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [recordId, existingPath]
  )

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  /*-------------------------- Render --------------------------*/
  return (
    <Card data-testid={testId}>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg'>Thumbnail</CardTitle>
        <CardDescription>
          Upload a thumbnail image for this record. It will be displayed in tables and details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-start gap-4'>
          {/*----------------------- Preview Area -----------------------*/}
          <button
            type='button'
            onClick={!isUploading ? handleClick : undefined}
            disabled={isUploading}
            className={cn(
              'relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors',
              isUploading
                ? 'cursor-wait border-muted bg-muted/50'
                : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
            )}
            data-testid={testId ? `${testId}-dropzone` : 'thumbnail-dropzone'}
          >
            {isUploading ? (
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            ) : preview ? (
              <Image
                src={preview}
                alt='Thumbnail preview'
                fill
                className='object-cover'
                sizes='128px'
              />
            ) : (
              <div className='flex flex-col items-center gap-1 text-muted-foreground'>
                <ImagePlus className='h-8 w-8' />
                <span className='text-xs'>Click to upload</span>
              </div>
            )}
          </button>

          {/*----------------------- Hidden Input -----------------------*/}
          <Input
            ref={fileInputRef}
            type='file'
            accept='image/jpeg,image/png,image/webp,image/gif'
            onChange={(e) => void handleFileSelect(e)}
            className='hidden'
            disabled={isUploading}
            data-testid={testId ? `${testId}-input` : 'thumbnail-input'}
          />

          {/*----------------------- Instructions -----------------------*/}
          <div className='flex flex-col gap-2 text-sm text-muted-foreground'>
            <p>Recommended: Square image, at least 200×200px</p>
            <p>Max size: 10MB</p>
            <p>Formats: JPEG, PNG, WebP, GIF</p>
            <p className='text-xs'>Image will be resized to 200×200 WebP</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
