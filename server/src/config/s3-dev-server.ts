import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '../..')

export async function ensureDevS3Server(endpoint: string, bucketName: string) {
  if (!endpoint.includes('localhost:9000') && !endpoint.includes('127.0.0.1:9000')) {
    return
  }

  try {
    const isRunning = await fetch('http://localhost:9000/')
      .then(() => true)
      .catch(() => false)

    if (isRunning) {
      console.log('S3 storage active on http://localhost:9000 (running)')
      return
    }

    const { default: S3rver } = await import('s3rver')
    // @ts-ignore
    const { default: AWSAccount } = await import('s3rver/lib/models/account.js')

    const storageDir = path.resolve(serverRoot, 's3-storage')
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true })
    }

    const bucketDir = path.join(storageDir, bucketName)
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true })
    }

    if (AWSAccount?.DUMMY_ACCOUNT) {
      AWSAccount.DUMMY_ACCOUNT.createKeyPair('minioadmin', 'minioadmin')
      AWSAccount.DUMMY_ACCOUNT.createKeyPair('S3RVER', 'S3RVER')
    }

    const server = new S3rver({
      port: 9000,
      address: '0.0.0.0',
      silent: true,
      directory: storageDir,
      allowMismatchedSignatures: true,
      configureBuckets: [{ name: bucketName }],
    })

    await server.run()
    console.log(`Local S3 mock storage active on http://localhost:9000 (bucket: ${bucketName})`)
  } catch (err) {
    console.warn('Notice: Local S3 service check/start:', err instanceof Error ? err.message : err)
  }
}
