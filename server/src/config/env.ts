import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '../..')

dotenv.config({ path: path.join(serverRoot, '.env') })

export const env = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Temporary demo switch. Keep false for any real/client production deployment.
  demoMode: process.env.DEMO_MODE === 'true',
  storageDriver: (process.env.STORAGE_DRIVER || 'json') as 'json' | 'postgres',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl: process.env.DATABASE_SSL !== 'false',
  dataDir: path.resolve(serverRoot, process.env.DATA_DIR || './data'),
  uploadDir: path.resolve(serverRoot, process.env.UPLOAD_DIR || './uploads'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  // S3/Garage Configuration
  s3Endpoint: process.env.S3_ENDPOINT || 'https://kebs3ui.velgen.tech',
  s3Region: process.env.S3_REGION || 'garage',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  s3BucketName: process.env.S3_BUCKET_NAME || 'veew-documents',
  s3UsePathStyle: process.env.S3_USE_PATH_STYLE === 'true' || true,
  // File Upload Configuration
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'application/pdf,image/jpeg,image/jpg,image/png').split(','),
  signedUrlExpiry: Number(process.env.SIGNED_URL_EXPIRY) || 3600, // 1 hour
}
