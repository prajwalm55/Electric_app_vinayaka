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
  storageDriver: (process.env.STORAGE_DRIVER || 'json') as 'json' | 'postgres',
  dataDir: path.resolve(serverRoot, process.env.DATA_DIR || './data'),
  uploadDir: path.resolve(serverRoot, process.env.UPLOAD_DIR || './uploads'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
}
