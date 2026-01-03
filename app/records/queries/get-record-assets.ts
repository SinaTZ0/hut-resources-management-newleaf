'use server'

import { eq } from 'drizzle-orm'

import { db } from '@/lib/drizzle/db'
import { recordsTable, type AssetGallery, type AssetFile } from '@/lib/drizzle/schema'
import { isValidUUID } from '@/lib/utils/common-utils'
import type { QueryResult } from '@/types-and-schemas/common'

/*-------------------- Get Record Assets ---------------------*/
type RecordAssetsData = {
  thumbnailPath: string | null
  galleries: AssetGallery[]
  files: AssetFile[]
}

export async function getRecordAssets(recordId: string): Promise<QueryResult<RecordAssetsData>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(recordId)) {
      return { success: false, error: 'Invalid record ID' }
    }

    /*------------------------- Database -------------------------*/
    const result = await db
      .select({ assets: recordsTable.assets })
      .from(recordsTable)
      .where(eq(recordsTable.id, recordId))
      .limit(1)

    if (result.length === 0) {
      return { success: false, error: 'Record not found' }
    }

    const assets = result[0].assets

    return {
      success: true,
      data: {
        thumbnailPath: assets?.thumbnail?.path ?? null,
        galleries: assets?.galleries ?? [],
        files: assets?.files ?? [],
      },
    }
  } catch (error) {
    console.error('Get record assets error:', error)
    return { success: false, error: 'Failed to fetch record assets' }
  }
}

/*----------------- Get Gallery Images by ID -----------------*/
type GalleryImagesData = {
  titleAndID: string
  paths: string[]
}

export async function getGalleryImages(
  recordId: string,
  galleryTitleAndID: string
): Promise<QueryResult<GalleryImagesData>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(recordId)) {
      return { success: false, error: 'Invalid record ID' }
    }

    if (!galleryTitleAndID || galleryTitleAndID.trim().length === 0) {
      return { success: false, error: 'Gallery ID is required' }
    }

    /*------------------------- Database -------------------------*/
    const result = await db
      .select({ assets: recordsTable.assets })
      .from(recordsTable)
      .where(eq(recordsTable.id, recordId))
      .limit(1)

    if (result.length === 0) {
      return { success: false, error: 'Record not found' }
    }

    const assets = result[0].assets
    const gallery = assets?.galleries?.find((g) => g.titleAndID === galleryTitleAndID)

    if (!gallery) {
      return { success: false, error: 'Gallery not found' }
    }

    return {
      success: true,
      data: {
        titleAndID: gallery.titleAndID,
        paths: gallery.paths,
      },
    }
  } catch (error) {
    console.error('Get gallery images error:', error)
    return { success: false, error: 'Failed to fetch gallery images' }
  }
}

/*------------------ Get Files by Group ID -------------------*/
type FileGroupData = {
  titleAndID: string
  paths: string[]
}

export async function getFileGroup(
  recordId: string,
  fileGroupTitleAndID: string
): Promise<QueryResult<FileGroupData>> {
  try {
    /*------------------------ Validation ------------------------*/
    if (!isValidUUID(recordId)) {
      return { success: false, error: 'Invalid record ID' }
    }

    if (!fileGroupTitleAndID || fileGroupTitleAndID.trim().length === 0) {
      return { success: false, error: 'File group ID is required' }
    }

    /*------------------------- Database -------------------------*/
    const result = await db
      .select({ assets: recordsTable.assets })
      .from(recordsTable)
      .where(eq(recordsTable.id, recordId))
      .limit(1)

    if (result.length === 0) {
      return { success: false, error: 'Record not found' }
    }

    const assets = result[0].assets
    const fileGroup = assets?.files?.find((f) => f.titleAndID === fileGroupTitleAndID)

    if (!fileGroup) {
      return { success: false, error: 'File group not found' }
    }

    return {
      success: true,
      data: {
        titleAndID: fileGroup.titleAndID,
        paths: fileGroup.paths,
      },
    }
  } catch (error) {
    console.error('Get file group error:', error)
    return { success: false, error: 'Failed to fetch file group' }
  }
}
