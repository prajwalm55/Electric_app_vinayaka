import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { env } from '../config/env.js'
import { store } from '../storage/createStore.js'
import type { PublicUser, User } from '../types/domain.js'
import { AppError } from '../utils/helpers.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

const loginSchema = z.object({
  password: z.string().min(1),
})

const profileSchema = z.object({
  name: z.string().min(1).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
  email: z.string().email().optional(),
  companyName: z.string().min(1).optional(),
  companyLocation: z.string().min(1).optional(),
  notificationPreferences: z
    .object({
      missingDocuments: z.boolean(),
      pendingPayments: z.boolean(),
      followUps: z.boolean(),
      stageReminders: z.boolean(),
      agencyInspection: z.boolean(),
    })
    .optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
})

function toPublic(user: User): PublicUser {
  const { passwordHash, ...profile } = user
  void passwordHash
  return profile
}

function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions)
}

export async function login(body: unknown) {
  const { password } = loginSchema.parse(body)
  const users = await store.getAll<User>('users')
  const user = users[0]
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(401, 'Invalid password')
  }
  return { token: signToken(user.id), profile: toPublic(user) }
}

export async function getProfile(userId: string) {
  const user = await store.getById<User>('users', userId)
  if (!user) throw new AppError(401, 'Session expired')
  return toPublic(user)
}

export async function updateProfile(userId: string, body: unknown) {
  const patch = profileSchema.parse(body)
  const user = await store.update<User>('users', userId, patch)
  return toPublic(user)
}

export async function changePassword(userId: string, body: unknown) {
  const { currentPassword, newPassword } = passwordSchema.parse(body)
  const user = await store.getById<User>('users', userId)
  if (!user) throw new AppError(401, 'Session expired')
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError(400, 'Current password is incorrect')
  }
  await store.update<User>('users', userId, { passwordHash: await hashPassword(newPassword) })
}

export function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub: string }
    return payload.sub
  } catch {
    throw new AppError(401, 'Invalid or expired session')
  }
}
