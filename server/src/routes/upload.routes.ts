import { Router } from 'express'
import multer from 'multer'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth } from '../middleware/auth.js'
import * as uploadService from '../services/upload.service.js'
import { s3Config } from '../config/s3.config.js'

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: s3Config.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    if (s3Config.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`))
    }
  },
})

export const uploadRouter = Router()

// All upload routes require authentication
uploadRouter.use(requireAuth)

/**
 * POST /api/upload/single
 * Upload a single file
 */
uploadRouter.post(
  '/single',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const { folder, entityId, fileType } = req.body

    if (!folder || !entityId || !fileType) {
      res.status(400).json({ error: 'Missing required fields: folder, entityId, fileType' })
      return
    }

    const result = await uploadService.uploadFile({
      file: req.file,
      folder,
      entityId,
      fileType,
    })

    res.status(201).json(result)
  })
)

/**
 * POST /api/upload/multiple
 * Upload multiple files
 */
uploadRouter.post(
  '/multiple',
  upload.array('files', 10), // Max 10 files
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[]

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files provided' })
      return
    }

    const { folder, entityId, fileType } = req.body

    if (!folder || !entityId || !fileType) {
      res.status(400).json({ error: 'Missing required fields: folder, entityId, fileType' })
      return
    }

    const results = await uploadService.uploadMultipleFiles(files, folder, entityId, fileType)

    res.status(201).json({ files: results })
  })
)

/**
 * GET /api/upload/download-url/:s3Key
 * Get signed download URL
 */
uploadRouter.get(
  '/download-url',
  asyncHandler(async (req, res) => {
    const { s3Key } = req.query

    if (!s3Key || typeof s3Key !== 'string') {
      res.status(400).json({ error: 'Missing s3Key parameter' })
      return
    }

    const signedUrl = await uploadService.getFileDownloadUrl(s3Key)

    res.json({ url: signedUrl })
  })
)

/**
 * DELETE /api/upload/:s3Key
 * Delete file from S3
 */
uploadRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    const { s3Key } = req.query

    if (!s3Key || typeof s3Key !== 'string') {
      res.status(400).json({ error: 'Missing s3Key parameter' })
      return
    }

    await uploadService.deleteFile(s3Key)

    res.json({ ok: true, message: 'File deleted successfully' })
  })
)
