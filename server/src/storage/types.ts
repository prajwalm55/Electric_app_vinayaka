import type { DatabaseShape, SequenceKey } from '../types/domain.js'

export type { SequenceKey }

export type CollectionName = Exclude<keyof DatabaseShape, 'sequences'>

export interface Store {
  /**
   * Collection access that maps 1:1 to future Postgres tables.
   * Swap JsonStore for PostgresStore without changing services.
   */
  init(): Promise<void>
  getAll<T>(name: CollectionName): Promise<T[]>
  getById<T extends { id: string }>(name: CollectionName, id: string): Promise<T | undefined>
  insert<T extends { id: string }>(name: CollectionName, record: T): Promise<T>
  update<T extends { id: string }>(name: CollectionName, id: string, patch: Partial<T>): Promise<T>
  removeWhere<T>(name: CollectionName, predicate: (item: T) => boolean): Promise<number>
  deleteById(name: CollectionName, id: string): Promise<void>
  find<T>(name: CollectionName, predicate: (item: T) => boolean): Promise<T[]>
  nextSequence(key: SequenceKey): Promise<number>
  runInTransaction<T>(work: (store: Store) => Promise<T>): Promise<T>
  snapshot(): Promise<Pick<
    DatabaseShape,
    | 'customers'
    | 'properties'
    | 'serviceRequests'
    | 'projects'
    | 'documents'
    | 'payments'
    | 'photos'
    | 'activities'
    | 'notifications'
  >>
}
