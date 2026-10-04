import { S3Client } from '@aws-sdk/client-s3'
import { env } from './env.js'

export const s3Client = new S3Client({
  endpoint: env.s3Endpoint,
  region: env.s3Region,
  credentials: {
    accessKeyId: env.s3AccessKeyId,
    secretAccessKey: env.s3SecretAccessKey,
  },
  forcePathStyle: env.s3UsePathStyle,
})

export const s3Config = {
  bucketName: env.s3BucketName,
  maxFileSize: env.maxFileSize,
  allowedMimeTypes: env.allowedFileTypes,
  signedUrlExpiry: env.signedUrlExpiry,
}
