import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { router } from './routes/index.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: env.corsOrigin, credentials: true }))
  app.use(express.json({ limit: '2mb' }))
  app.use('/api', router)
  app.use(errorHandler)
  return app
}
