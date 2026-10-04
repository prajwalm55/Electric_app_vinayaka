import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { router } from './routes/index.js'

export function createApp() {
  const app = express()
  app.use(cors({ origin: env.corsOrigin, credentials: true }))
  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb', extended: true }))
  app.use('/api', router)
  app.use(errorHandler)
  return app
}
