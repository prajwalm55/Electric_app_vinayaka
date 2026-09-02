import type { NextFunction, Request, Response } from 'express'
import { verifyToken } from '../services/auth.service.js'
import { AppError } from '../utils/helpers.js'

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  if (!token) {
    next(new AppError(401, 'Authentication required'))
    return
  }
  req.userId = verifyToken(token)
  next()
}

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}
