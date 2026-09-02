import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env.js'
import type { DatabaseShape, SequenceKey } from '../types/domain.js'
import { createSeedDatabase } from '../seed/seedData.js'
import type { CollectionName, Store } from './types.js'
import { AppError } from '../utils/helpers.js'

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

export class JsonStore implements Store {
  private db!: DatabaseShape
  private readonly mutex = new Mutex()
  private txDepth = 0
  private readonly filePath: string

  constructor(dataDir = env.dataDir) {
    this.filePath = path.join(dataDir, 'db.json')
  }

  async init() {
    await mkdir(path.dirname(this.filePath), { recursive: true })
    try {
      const raw = await readFile(this.filePath, 'utf8')
      this.db = JSON.parse(raw) as DatabaseShape
    } catch {
      this.db = await createSeedDatabase()
      await this.persist()
    }
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
      await this.persist()
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
      await this.persist()
      return next
    })
  }

  async removeWhere<T>(name: CollectionName, predicate: (item: T) => boolean): Promise<number> {
    return this.withLock(async () => {
      const list = this.collection(name) as T[]
      const initial = list.length
      const next = list.filter((item) => !predicate(item as T))
      ;(this.db[name] as unknown as T[]) = next
      await this.persist()
      return initial - next.length
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
      await this.persist()
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
      this.txDepth += 1
      const snapshot = structuredClone(this.db)
      try {
        const result = await work(this)
        this.txDepth -= 1
        await this.persist()
        return result
      } catch (error) {
        this.db = snapshot
        this.txDepth -= 1
        throw error
      }
    })
  }

  private collection(name: CollectionName): { id: string }[] {
    return this.db[name] as unknown as { id: string }[]
  }

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    if (this.txDepth > 0) return fn()
    return this.mutex.run(fn)
  }

  private async persist() {
    if (this.txDepth > 0) return
    const tmp = `${this.filePath}.tmp`
    await writeFile(tmp, JSON.stringify(this.db, null, 2), 'utf8')
    await rename(tmp, this.filePath)
  }
}
