'use client'

import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { FileIcon, FolderPlus, Loader2, X, File } from 'lucide-react'

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
import type { AssetFile } from '@/lib/drizzle/schema'

import { uploadFiles } from '../../actions/upload-assets'

/*-------------------------- Types ---------------------------*/
type FilesUploadProps = {
  readonly recordId: string
  readonly existingFiles?: AssetFile[]
  readonly testId?: string
}

/*--------------------- File Size Helper ---------------------*/
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/*------------------------ Component -------------------------*/
export function FilesUpload({ recordId, existingFiles = [], testId }: FilesUploadProps) {
  /*-------------------------- State ---------------------------*/
  const [fileGroups, setFileGroups] = useState<AssetFile[]>(existingFiles)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [groupTitle, setGroupTitle] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /*------------------------- Handlers -------------------------*/
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const maxSize = 50 * 1024 * 1024 // 50MB

    const validFiles: File[] = []

    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`${file.name}: Too large. Maximum 50MB.`)
        continue
      }
      validFiles.push(file)
    }

    setSelectedFiles((prev) => [...prev, ...validFiles])
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleReset = useCallback(() => {
    setGroupTitle('')
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleUpload = useCallback(async () => {
    if (!groupTitle.trim()) {
      toast.error('Please enter a file group name')
      return
    }

    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      for (const file of selectedFiles) {
        formData.append('files', file)
      }

      const result = await uploadFiles(recordId, groupTitle, formData)

      if (result.success) {
        toast.success('Files uploaded successfully')
        setFileGroups((prev) => [
          ...prev,
          { titleAndID: result.data.titleAndID, paths: result.data.paths },
        ])
        handleReset()
        setIsDialogOpen(false)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }, [recordId, groupTitle, selectedFiles, handleReset])

  /*-------------------------- Render --------------------------*/
  return (
    <Card data-testid={testId}>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg'>Files</CardTitle>
            <CardDescription>Upload and organize files for this record</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                data-testid={testId ? `${testId}-add-btn` : 'files-add-btn'}
              >
                <FolderPlus className='mr-2 h-4 w-4' />
                Add Files
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>
                  Enter a name for this file group and select files to upload
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                {/*------------------------ Group Name ------------------------*/}
                <div className='space-y-2'>
                  <Label htmlFor='group-title'>File Group Name</Label>
                  <Input
                    id='group-title'
                    placeholder='e.g., Documentation'
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    disabled={isUploading}
                    data-testid='files-group-title-input'
                  />
                  <p className='text-xs text-muted-foreground'>
                    This name will be used to organize your files
                  </p>
                </div>

                {/*------------------------ File Input ------------------------*/}
                <div className='space-y-2'>
                  <Label>Files</Label>
                  <Input
                    ref={fileInputRef}
                    type='file'
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                    data-testid='files-file-input'
                  />
                  <p className='text-xs text-muted-foreground'>
                    Max 50MB per file. Common document and archive formats supported.
                  </p>
                </div>

                {/*---------------------- Selected Files ----------------------*/}
                {selectedFiles.length > 0 && (
                  <div className='space-y-2'>
                    <Label>Selected Files ({String(selectedFiles.length)})</Label>
                    <div className='max-h-48 overflow-y-auto rounded-lg border p-2 space-y-1'>
                      {selectedFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${String(index)}`}
                          className='flex items-center justify-between rounded px-2 py-1 hover:bg-muted'
                        >
                          <div className='flex items-center gap-2 overflow-hidden'>
                            <File className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                            <span className='text-sm truncate'>{file.name}</span>
                            <span className='text-xs text-muted-foreground flex-shrink-0'>
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <button
                            type='button'
                            onClick={() => handleRemoveFile(index)}
                            className='flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-destructive hover:text-destructive-foreground'
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
                  disabled={isUploading || !groupTitle.trim() || selectedFiles.length === 0}
                >
                  {isUploading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                  {isUploading ? 'Uploading...' : 'Upload Files'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {fileGroups.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-8 text-center text-muted-foreground'>
            <FileIcon className='h-12 w-12 mb-2 opacity-50' />
            <p>No files yet</p>
            <p className='text-xs'>Click &quot;Add Files&quot; to upload</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {fileGroups.map((group) => (
              <div
                key={group.titleAndID}
                className='flex items-center justify-between rounded-lg border px-4 py-3'
              >
                <div className='flex items-center gap-3'>
                  <FileIcon className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <p className='font-medium'>{fromSlug(group.titleAndID)}</p>
                    <p className='text-xs text-muted-foreground'>
                      {group.paths.length} file{group.paths.length !== 1 ? 's' : ''}
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
