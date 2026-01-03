'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle/db'
import { recordsTable, type Assets, type AssetGallery, type AssetFile } from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import { saveThumbnail, saveGalleryImages, saveFiles } from '@/lib/utils/file-utils'
import { toSlug } from '@/lib/utils/slug-utils'
import type { ActionResult } from '@/types-and-schemas/common'

/*--------------------- Upload Thumbnail ---------------------*/
export async function uploadThumbnail(
  recordId: string,
  formData: FormData
): Promise<ActionResult<{ path: string }>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(recordId)) {
      return { success: false, error: 'Invalid record ID' }
    }

    const file = formData.get('thumbnail') as File | null
    if (!file || file.size === 0) {
      return { success: false, error: 'No thumbnail file provided' }
    }

    /*---------------- Verify Record Exists in DB ----------------*/
    const existingRecords = await db
      .select({ id: recordsTable.id, assets: recordsTable.assets })
      .from(recordsTable)
      .where(eq(recordsTable.id, recordId))
      .limit(1)

    if (existingRecords.length === 0) {
      return { success: false, error: 'Record not found' }
    }

    /*------------------------ Save File -------------------------*/
    const result = await saveThumbnail(recordId, file)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    /*--------------------- Update Database ----------------------*/
    const currentAssets = existingRecords[0].assets ?? {}
    const updatedAssets: Assets = {
      ...currentAssets,
      thumbnail: { path: result.path },
    }

    await db
      .update(recordsTable)
      .set({ assets: updatedAssets, updatedAt: new Date() })
      .where(eq(recordsTable.id, recordId))

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/records')
    revalidatePath(`/records/${recordId}`)

    return { success: true, data: { path: result.path } }
  } catch (error) {
    console.error('Upload thumbnail error:', error)
    return { success: false, error: 'Failed to upload thumbnail' }
  }
}

/*---------------------- Upload Gallery ----------------------*/
export async function uploadGallery(
  recordId: string,
  galleryTitle: string,
  formData: FormData
): Promise<ActionResult<{ titleAndID: string; paths: string[] }>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(recordId)) {
      return { success: false, error: 'Invalid record ID' }
    }

    if (!galleryTitle || galleryTitle.trim().length === 0) {
      return { success: false, error: 'Gallery title is required' }
    }

    const files = formData.getAll('images') as File[]
    if (files.length === 0 || files.every((f) => f.size === 0)) {
      return { success: false, error: 'No images provided' }
    }

    // Filter out empty file entries
    const validFiles = files.filter((f) => f.size > 0)

    /*---------------- Verify Record Exists in DB ----------------*/
    const existingRecords = await db
      .select({ id: recordsTable.id, assets: recordsTable.assets })
      .from(recordsTable)
      .where(eq(recordsTable.id, recordId))
      .limit(1)

    if (existingRecords.length === 0) {
      return { success: false, error: 'Record not found' }
    }

    /*-------------------- Check Duplicate ID --------------------*/
    const slug = toSlug(galleryTitle)
    const currentAssets = existingRecords[0].assets ?? {}
    const existingGalleries = currentAssets.galleries ?? []

    if (existingGalleries.some((g) => g.titleAndID === slug)) {
      return { success: false, error: 'A gallery with this name already exists' }
    }

    /*------------------------ Save Files ------------------------*/
    const result = await saveGalleryImages(recordId, galleryTitle, validFiles)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    /*--------------------- Update Database ----------------------*/
    const newGallery: AssetGallery = {
      titleAndID: slug,
      paths: result.paths,
    }

    const updatedAssets: Assets = {
      ...currentAssets,
      galleries: [...existingGalleries, newGallery],
    }

    await db
      .update(recordsTable)
      .set({ assets: updatedAssets, updatedAt: new Date() })
      .where(eq(recordsTable.id, recordId))

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/records')
    revalidatePath(`/records/${recordId}`)

    return { success: true, data: { titleAndID: slug, paths: result.paths } }
  } catch (error) {
    console.error('Upload gallery error:', error)
    return { success: false, error: 'Failed to upload gallery' }
  }
}

/*----------------------- Upload Files -----------------------*/
export async function uploadFiles(
  recordId: string,
  fileGroupTitle: string,
  formData: FormData
): Promise<ActionResult<{ titleAndID: string; paths: string[] }>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(recordId)) {
      return { success: false, error: 'Invalid record ID' }
    }

    if (!fileGroupTitle || fileGroupTitle.trim().length === 0) {
      return { success: false, error: 'File group title is required' }
    }

    const files = formData.getAll('files') as File[]
    if (files.length === 0 || files.every((f) => f.size === 0)) {
      return { success: false, error: 'No files provided' }
    }

    // Filter out empty file entries
    const validFiles = files.filter((f) => f.size > 0)

    /*---------------- Verify Record Exists in DB ----------------*/
    const existingRecords = await db
      .select({ id: recordsTable.id, assets: recordsTable.assets })
      .from(recordsTable)
      .where(eq(recordsTable.id, recordId))
      .limit(1)

    if (existingRecords.length === 0) {
      return { success: false, error: 'Record not found' }
    }

    /*-------------------- Check Duplicate ID --------------------*/
    const slug = toSlug(fileGroupTitle)
    const currentAssets = existingRecords[0].assets ?? {}
    const existingFiles = currentAssets.files ?? []

    if (existingFiles.some((f) => f.titleAndID === slug)) {
      return { success: false, error: 'A file group with this name already exists' }
    }

    /*------------------------ Save Files ------------------------*/
    const result = await saveFiles(recordId, fileGroupTitle, validFiles)
    if (!result.success) {
      return { success: false, error: result.error }
    }

    /*--------------------- Update Database ----------------------*/
    const newFileGroup: AssetFile = {
      titleAndID: slug,
      paths: result.paths,
    }

    const updatedAssets: Assets = {
      ...currentAssets,
      files: [...existingFiles, newFileGroup],
    }

    await db
      .update(recordsTable)
      .set({ assets: updatedAssets, updatedAt: new Date() })
      .where(eq(recordsTable.id, recordId))

    /*------------------------ Revalidate ------------------------*/
    revalidatePath('/records')
    revalidatePath(`/records/${recordId}`)

    return { success: true, data: { titleAndID: slug, paths: result.paths } }
  } catch (error) {
    console.error('Upload files error:', error)
    return { success: false, error: 'Failed to upload files' }
  }
}
