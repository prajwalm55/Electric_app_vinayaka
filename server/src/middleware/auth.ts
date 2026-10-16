import type { NextFunction, Request, Response } from 'express'
import { env } from '../config/env.js'
import { verifyToken } from '../services/auth.service.js'
import { AppError } from '../utils/helpers.js'

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // Temporary demo mode: use the seeded demo user without requiring a token.
  // Set DEMO_MODE=false before exposing this application to real users.
  if (env.demoMode) {
    req.userId = 'USR-001'
    next()
    return
  }

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
