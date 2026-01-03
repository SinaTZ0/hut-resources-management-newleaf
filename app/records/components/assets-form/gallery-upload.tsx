'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Images, X, Loader2, FolderPlus } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { fromSlug } from '@/lib/utils/slug-utils'
import type { AssetGallery } from '@/lib/drizzle/schema'

import { uploadGallery } from '../../actions/upload-assets'

/*-------------------------- Types ---------------------------*/
type GalleryUploadProps = {
  readonly recordId: string
  readonly existingGalleries?: AssetGallery[]
  readonly testId?: string
}

/*------------------------ Component -------------------------*/
export function GalleryUpload({ recordId, existingGalleries = [], testId }: GalleryUploadProps) {
  /*-------------------------- State ---------------------------*/
  const [galleries, setGalleries] = useState<AssetGallery[]>(existingGalleries)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [galleryTitle, setGalleryTitle] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /*------------------------- Handlers -------------------------*/
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    /*---------------------- Validate Files ----------------------*/
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 10 * 1024 * 1024 // 10MB

    const validFiles: File[] = []
    const newPreviews: string[] = []

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: Invalid type. Only JPEG, PNG, WebP, GIF allowed.`)
        continue
      }
      if (file.size > maxSize) {
        toast.error(`${file.name}: Too large. Maximum 10MB.`)
        continue
      }
      validFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setSelectedFiles((prev) => [...prev, ...validFiles])
    setPreviews((prev) => [...prev, ...newPreviews])
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      const removed = prev[index]
      if (removed) URL.revokeObjectURL(removed)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleReset = useCallback(() => {
    setGalleryTitle('')
    setSelectedFiles([])
    previews.forEach((url) => URL.revokeObjectURL(url))
    setPreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [previews])

  const handleUpload = useCallback(async () => {
    if (!galleryTitle.trim()) {
      toast.error('Please enter a gallery name')
      return
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      for (const file of selectedFiles) {
        formData.append('images', file)
      }

      const result = await uploadGallery(recordId, galleryTitle, formData)

      if (result.success) {
        toast.success('Gallery uploaded successfully')
        setGalleries((prev) => [
          ...prev,
          { titleAndID: result.data.titleAndID, paths: result.data.paths },
        ])
        handleReset()
        setIsDialogOpen(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to upload gallery')
    } finally {
      setIsUploading(false)
    }
  }, [recordId, galleryTitle, selectedFiles, handleReset])

  /*-------------------------- Render --------------------------*/
  return (
    <Card data-testid={testId}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg'>Galleries</CardTitle>
            <CardDescription>Create image galleries for this record</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                data-testid={testId ? `${testId}-add-btn` : 'gallery-add-btn'}
              >
                <FolderPlus className='mr-2 h-4 w-4' />
                Add Gallery
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Create New Gallery</DialogTitle>
                <DialogDescription>
                  Enter a name and select images for your new gallery
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                {/*----------------------- Gallery Name -----------------------*/}
                <div className='space-y-2'>
                  <Label htmlFor='gallery-title'>Gallery Name</Label>
                  <Input
                    id='gallery-title'
                    placeholder='e.g., Summer 2026'
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    disabled={isUploading}
                    data-testid='gallery-title-input'
                  />
                  <p className='text-xs text-muted-foreground'>
                    This name will be used as the gallery identifier
                  </p>
                </div>

                {/*------------------------ File Input ------------------------*/}
                <div className='space-y-2'>
                  <Label>Images</Label>
                  <div className='flex items-center gap-2'>
                    <Input
                      ref={fileInputRef}
                      type='file'
                      accept='image/jpeg,image/png,image/webp,image/gif'
                      multiple
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      data-testid='gallery-file-input'
                    />
                  </div>
                </div>

                {/*--------------------- Selected Images ----------------------*/}
                {previews.length > 0 && (
                  <div className='space-y-2'>
                    <Label>Selected Images ({String(previews.length)})</Label>
                    <div className='grid grid-cols-4 gap-2 max-h-48 overflow-y-auto rounded-lg border p-2'>
                      {previews.map((preview, index) => (
                        <div key={preview} className='relative group'>
                          <div className='relative aspect-square overflow-hidden rounded'>
                            <Image
                              src={preview}
                              alt={`Preview ${String(index + 1)}`}
                              fill
                              className='object-cover'
                              sizes='100px'
                            />
                          </div>
                          <button
                            type='button'
                            onClick={() => handleRemoveFile(index)}
                            className='absolute -right-1 -top-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground'
                            disabled={isUploading}
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => {
                    handleReset()
                    setIsDialogOpen(false)
                  }}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleUpload()}
                  disabled={isUploading || !galleryTitle.trim() || selectedFiles.length === 0}
                >
                  {isUploading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {isUploading ? 'Uploading...' : 'Create Gallery'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {galleries.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-center text-muted-foreground'>
            <Images className='h-12 w-12 mb-2 opacity-50' />
            <p>No galleries yet</p>
            <p className='text-xs'>Click &quot;Add Gallery&quot; to create one</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {galleries.map((gallery) => (
              <div
                key={gallery.titleAndID}
                className='flex items-center justify-between rounded-lg border px-4 py-3'
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
