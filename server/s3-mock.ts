import S3rver from 's3rver'
import path from 'path'
import fs from 'fs'
// @ts-ignore
import AWSAccount from 's3rver/lib/models/account.js'

const storageDir = path.resolve('./s3-storage')
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true })
}

const bucketDir = path.join(storageDir, 'veew-documents')
if (!fs.existsSync(bucketDir)) {
  fs.mkdirSync(bucketDir, { recursive: true })
}

// Register access keys so any S3 client authenticates seamlessly
if (AWSAccount?.DUMMY_ACCOUNT) {
  AWSAccount.DUMMY_ACCOUNT.createKeyPair('minioadmin', 'minioadmin')
  AWSAccount.DUMMY_ACCOUNT.createKeyPair('S3RVER', 'S3RVER')
}

const server = new S3rver({
  port: 9000,
  address: '0.0.0.0',
  silent: false,
  directory: storageDir,
  allowMismatchedSignatures: true,
  configureBuckets: [
    { name: 'veew-documents' }
  ],
})

server.run().then(() => {
  console.log('S3 mock server running on http://localhost:9000')
  console.log('Bucket "veew-documents" ready with S3 API')
})
