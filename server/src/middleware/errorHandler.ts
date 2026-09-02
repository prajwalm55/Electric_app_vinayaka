import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../utils/helpers.js'

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: error.issues[0]?.message || 'Validation failed',
      details: error.issues,
    })
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({ error: error.message })
  }

  console.error(error)
  return res.status(500).json({ error: 'Internal server error' })
}
