import { mkdir } from 'node:fs/promises'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { ensureDevS3Server } from './config/s3-dev-server.js'
import { store } from './storage/createStore.js'

async function start() {
  await mkdir(env.uploadDir, { recursive: true })
  await ensureDevS3Server(env.s3Endpoint, env.s3BucketName)
  await store.init()

  const app = createApp()
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`VEEW OS API listening on http://localhost:${env.port}`)
    console.log(`Storage driver: ${env.storageDriver}`)
  })
}

start().catch((error) => {
  console.error('Failed to start server', error)
  process.exit(1)
})
