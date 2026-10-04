import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client, s3Config } from '../config/s3.config.js'
import crypto from 'crypto'
import path from 'path'

export interface UploadFileParams {
  file: Express.Multer.File
  folder: 'customers' | 'properties' | 'projects'
  entityId: string
  fileType: 'aadhaar' | 'pan' | 'property-doc' | 'site-photo' | 'work-order' | 'estimate' | 'other'
}

export interface UploadResult {
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  s3Key: string
}

/**
 * Generate unique S3 key for file
 */
function generateS3Key(folder: string, entityId: string, originalFilename: string): string {
  const timestamp = Date.now()
  const randomString = crypto.randomBytes(6).toString('hex')
  const extension = path.extname(originalFilename)
  const sanitizedName = path.basename(originalFilename, extension).replace(/[^a-zA-Z0-9-_]/g, '_')

  return `${folder}/${entityId}/${sanitizedName}_${timestamp}_${randomString}${extension}`
}

/**
 * Upload file to S3/Garage
 */
export async function uploadFile(params: UploadFileParams): Promise<UploadResult> {
  const { file, folder, entityId } = params

  // Validate file size
  if (file.size > s3Config.maxFileSize) {
    throw new Error(`File size exceeds maximum allowed size of ${s3Config.maxFileSize / 1024 / 1024}MB`)
  }

  // Validate file type
  if (!s3Config.allowedMimeTypes.includes(file.mimetype)) {
    throw new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${s3Config.allowedMimeTypes.join(', ')}`)
  }

  const s3Key = generateS3Key(folder, entityId, file.originalname)

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadDate: new Date().toISOString(),
          entityId,
          folder,
        },
      })
    )

    return {
      fileUrl: `${s3Config.bucketName}/${s3Key}`,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      s3Key,
    }
  } catch (error) {
    console.error('S3 upload error:', error)
    throw new Error('Failed to upload file to storage')
  }
}

/**
 * Generate signed URL for downloading file
 */
export async function getFileDownloadUrl(s3Key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: s3Key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: s3Config.signedUrlExpiry,
    })

    return signedUrl
  } catch (error) {
    console.error('S3 signed URL error:', error)
    throw new Error('Failed to generate download URL')
  }
}

/**
 * Delete file from S3/Garage
 */
export async function deleteFile(s3Key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: s3Config.bucketName,
        Key: s3Key,
      })
    )
  } catch (error) {
    console.error('S3 delete error:', error)
    throw new Error('Failed to delete file from storage')
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: Express.Multer.File[],
  folder: 'customers' | 'properties' | 'projects',
  entityId: string,
  fileType: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) =>
    uploadFile({
      file,
      folder,
      entityId,
      fileType: fileType as any,
    })
  )

  return Promise.all(uploadPromises)
}
