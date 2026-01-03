import path from 'node:path'
import { mkdir, writeFile, readdir } from 'node:fs/promises'

import sharp from 'sharp'

/*------------------------ Constants -------------------------*/
const UPLOADS_BASE_DIR = 'public/uploads/records'
const THUMBNAIL_SIZE = 200
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
])
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Slug helpers moved to `slug-utils` to avoid pulling server-only deps into client bundles
import { toSlug } from './slug-utils'

/*-------------------- Validation Helpers --------------------*/
export function isValidImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mimeType)
}

export function isValidFileType(mimeType: string): boolean {
  return ALLOWED_FILE_TYPES.has(mimeType) || ALLOWED_IMAGE_TYPES.has(mimeType)
}

export function isValidImageSize(size: number): boolean {
  return size <= MAX_IMAGE_SIZE
}

export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE
}

/*----------------------- Path Helpers -----------------------*/
/**
 * Get the absolute path for record uploads directory
 */
export function getRecordUploadsPath(recordId: string): string {
  return path.join(process.cwd(), UPLOADS_BASE_DIR, recordId)
}

/**
 * Get the public URL path (relative to /public)
 */
export function getPublicPath(recordId: string, ...segments: string[]): string {
  return `/uploads/records/${recordId}/${segments.join('/')}`
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true })
}

/*--------------------- Thumbnail Upload ---------------------*/
type ThumbnailResult =
  | {
      success: true
      path: string
    }
  | {
      success: false
      error: string
    }

/**
 * Process and save thumbnail image
 * Resizes to 200x200 WebP format
 */
export async function saveThumbnail(recordId: string, file: File): Promise<ThumbnailResult> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidImageType(file.type)) {
      return { success: false, error: 'Invalid image type. Allowed: JPEG, PNG, WebP, GIF' }
    }

    if (!isValidImageSize(file.size)) {
      return { success: false, error: 'Image too large. Maximum 10MB allowed' }
    }

    /*---------------------- Process Image -----------------------*/
    const buffer = Buffer.from(await file.arrayBuffer())

    const processedBuffer = await sharp(buffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toBuffer()

    /*--------------------------- Save ---------------------------*/
    const uploadsPath = getRecordUploadsPath(recordId)
    await ensureDir(uploadsPath)

    const filename = 'thumbnail.webp'
    const filePath = path.join(uploadsPath, filename)
    await writeFile(filePath, processedBuffer)

    const publicPath = getPublicPath(recordId, filename)

    return { success: true, path: publicPath }
  } catch (error) {
    console.error('Thumbnail save error:', error)
    return { success: false, error: 'Failed to process thumbnail image' }
  }
}

/*---------------------- Gallery Upload ----------------------*/
type GalleryUploadResult =
  | {
      success: true
      paths: string[]
    }
  | {
      success: false
      error: string
    }

/**
 * Save gallery images
 * Path: /public/uploads/records/{recordId}/gallery-{slug}/{filename}
 */
export async function saveGalleryImages(
  recordId: string,
  titleAndID: string,
  files: File[]
): Promise<GalleryUploadResult> {
  try {
    if (files.length === 0) {
      return { success: false, error: 'No files provided' }
    }

    /*------------------------ Validation ------------------------*/
    for (const file of files) {
      if (!isValidImageType(file.type)) {
        return {
          success: false,
          error: `Invalid image type for ${file.name}. Allowed: JPEG, PNG, WebP, GIF`,
        }
      }
      if (!isValidImageSize(file.size)) {
        return { success: false, error: `Image ${file.name} too large. Maximum 10MB allowed` }
      }
    }

    /*--------------------------- Save ---------------------------*/
    const slug = toSlug(titleAndID)
    const galleryDir = path.join(getRecordUploadsPath(recordId), `gallery-${slug}`)
    await ensureDir(galleryDir)

    const savedPaths: string[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = path.join(galleryDir, sanitizedName)

      await writeFile(filePath, buffer)
      savedPaths.push(getPublicPath(recordId, `gallery-${slug}`, sanitizedName))
    }

    return { success: true, paths: savedPaths }
  } catch (error) {
    console.error('Gallery save error:', error)
    return { success: false, error: 'Failed to save gallery images' }
  }
}

/*----------------------- Files Upload -----------------------*/
type FilesUploadResult =
  | {
      success: true
      paths: string[]
    }
  | {
      success: false
      error: string
    }

/**
 * Save files
 * Path: /public/uploads/records/{recordId}/files-{slug}/{filename}
 */
export async function saveFiles(
  recordId: string,
  titleAndID: string,
  files: File[]
): Promise<FilesUploadResult> {
  try {
    if (files.length === 0) {
      return { success: false, error: 'No files provided' }
    }

    /*------------------------ Validation ------------------------*/
    for (const file of files) {
      if (!isValidFileType(file.type)) {
        return { success: false, error: `Invalid file type for ${file.name}` }
      }
      if (!isValidFileSize(file.size)) {
        return { success: false, error: `File ${file.name} too large. Maximum 50MB allowed` }
      }
    }

    /*--------------------------- Save ---------------------------*/
    const slug = toSlug(titleAndID)
    const filesDir = path.join(getRecordUploadsPath(recordId), `files-${slug}`)
    await ensureDir(filesDir)

    const savedPaths: string[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())

      // Sanitize filename
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = path.join(filesDir, sanitizedName)

      await writeFile(filePath, buffer)
      savedPaths.push(getPublicPath(recordId, `files-${slug}`, sanitizedName))
    }

    return { success: true, paths: savedPaths }
  } catch (error) {
    console.error('Files save error:', error)
    return { success: false, error: 'Failed to save files' }
  }
}

/*------------------- Get Gallery Contents -------------------*/
type GalleryContentsResult =
  | {
      success: true
      paths: string[]
    }
  | {
      success: false
      error: string
    }

/**
 * Get all images in a gallery folder
 */
export async function getGalleryContents(
  recordId: string,
  titleAndID: string
): Promise<GalleryContentsResult> {
  try {
    const slug = toSlug(titleAndID)
    const galleryDir = path.join(getRecordUploadsPath(recordId), `gallery-${slug}`)

    const files = await readdir(galleryDir)
    const paths = files.map((file) => getPublicPath(recordId, `gallery-${slug}`, file))

    return { success: true, paths }
  } catch (error) {
    console.error('Get gallery contents error:', error)
    return { success: false, error: 'Failed to get gallery contents' }
  }
}

/*---------------------- Get File Path -----------------------*/
/**
 * Get the public path for a specific file
 * Note: exported from a module with `use server` — must be async to be a valid Server Action
 */
export function getFilePath(recordId: string, titleAndID: string, filename: string): string {
  const slug = toSlug(titleAndID)
  return getPublicPath(recordId, `files-${slug}`, filename)
}
