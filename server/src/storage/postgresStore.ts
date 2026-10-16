import { Pool } from 'pg'
import type { DatabaseShape, SequenceKey } from '../types/domain.js'
import { createSeedDatabase } from '../seed/seedData.js'
import { AppError } from '../utils/helpers.js'
import type { CollectionName, Store } from './types.js'
import { env } from '../config/env.js'

type StoredName = CollectionName | 'users' | 'sequences'

class Mutex {
  private chain = Promise.resolve()

  run<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn, fn)
    this.chain = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }
}

/**
 * PostgreSQL-backed implementation of the existing Store interface.
 *
 * Collections are stored as JSONB rows so the current service layer can move
 * from the local JSON file to Supabase without changing every route/service.
 * This is appropriate for the current single-instance demo deployment. A
 * future scale-up can normalize the collections into relational tables.
 */
export class PostgresStore implements Store {
  private readonly pool: Pool
  private readonly mutex = new Mutex()
  private db!: DatabaseShape

  constructor(databaseUrl = env.databaseUrl) {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when STORAGE_DRIVER=postgres')
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 3,
      ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
    })
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS veew_store (
        name TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const result = await this.pool.query<{ name: StoredName; data: DatabaseShape[StoredName] }>(
      'SELECT name, data FROM veew_store',
    )

    if (result.rowCount === 0) {
      this.db = await createSeedDatabase()
      await this.persistAll()
      return
    }

    const seeded = await createSeedDatabase()
    this.db = seeded
    for (const row of result.rows) {
      this.db[row.name] = row.data as never
    }

    // Add any newly introduced collections/sequences without overwriting data.
    await this.persistAll()
  }

  async getAll<T>(name: CollectionName): Promise<T[]> {
    return this.withLock(async () => [...(this.collection(name) as T[])])
  }

  async getById<T extends { id: string }>(name: CollectionName, id: string): Promise<T | undefined> {
    return this.withLock(async () => (this.collection(name) as T[]).find((item) => item.id === id))
  }

  async insert<T extends { id: string }>(name: CollectionName, record: T): Promise<T> {
    return this.withLock(async () => {
      ;(this.collection(name) as T[]).push(record)
      await this.persist(name)
      return record
    })
  }

  async update<T extends { id: string }>(name: CollectionName, id: string, patch: Partial<T>): Promise<T> {
    return this.withLock(async () => {
      const list = this.collection(name) as T[]
      const index = list.findIndex((item) => item.id === id)
      if (index === -1) throw new AppError(404, `${name} record not found`)
      const next = { ...list[index], ...patch }
      list[index] = next
      await this.persist(name)
      return next
    })
  }

  async removeWhere<T>(name: CollectionName, predicate: (item: T) => boolean): Promise<number> {
    return this.withLock(async () => {
      const list = this.collection(name) as T[]
      const next = list.filter((item) => !predicate(item))
      ;(this.db[name] as unknown as T[]) = next
      await this.persist(name)
      return list.length - next.length
    })
  }

  async deleteById(name: CollectionName, id: string): Promise<void> {
    const removed = await this.removeWhere(name, (item: { id: string }) => item.id === id)
    if (removed === 0) throw new AppError(404, `${name} record not found`)
  }

  async find<T>(name: CollectionName, predicate: (item: T) => boolean): Promise<T[]> {
    return this.withLock(async () => (this.collection(name) as T[]).filter(predicate))
  }

  async nextSequence(key: SequenceKey): Promise<number> {
    return this.withLock(async () => {
      this.db.sequences[key] += 1
      await this.persist('sequences')
      return this.db.sequences[key]
    })
  }

  async snapshot() {
    return this.withLock(async () => ({
      customers: [...this.db.customers],
      properties: [...this.db.properties],
      serviceRequests: [...this.db.serviceRequests],
      projects: [...this.db.projects],
      documents: [...this.db.documents],
      payments: [...this.db.payments],
      photos: [...this.db.photos],
      activities: [...this.db.activities],
      notifications: [...this.db.notifications],
    }))
  }

  async runInTransaction<T>(work: (store: Store) => Promise<T>): Promise<T> {
    return this.mutex.run(async () => {
      const snapshot = structuredClone(this.db)
      try {
        const result = await work(this)
        await this.persistAll()
        return result
      } catch (error) {
        this.db = snapshot
        throw error
      }
    })
  }

  private collection(name: CollectionName) {
    return this.db[name] as unknown as { id: string }[]
  }

  private async withLock<T>(fn: () => Promise<T>) {
    return this.mutex.run(fn)
  }

  private async persist(name: StoredName) {
    await this.pool.query(
      `
        INSERT INTO veew_store (name, data, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (name)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `,
      [name, JSON.stringify(this.db[name])],
    )
  }

  private async persistAll() {
    const names: StoredName[] = [
      'users',
      'sequences',
      'customers',
      'properties',
      'serviceRequests',
      'projects',
      'documents',
      'payments',
      'photos',
      'activities',
      'notifications',
    ]

    for (const name of names) await this.persist(name)
  }
}
