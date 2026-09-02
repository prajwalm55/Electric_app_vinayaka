import type { CollectionName, SequenceKey, Store } from '../storage/types.js'

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export async function requireEntity<T extends { id: string }>(
  store: Store,
  collection: CollectionName,
  id: string,
  label: string,
): Promise<T> {
  const entity = await store.getById<T>(collection, id)
  if (!entity) throw new AppError(404, `${label} not found`)
  return entity
}

export function nowIso() {
  return new Date().toISOString()
}

export function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export async function nextId(store: Store, key: SequenceKey, prefix: string) {
  const n = await store.nextSequence(key)
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(5, '0')}`
}
