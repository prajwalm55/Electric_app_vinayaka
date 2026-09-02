import { env } from '../config/env.js'
import { JsonStore } from './jsonStore.js'
import type { Store } from './types.js'

/**
 * Storage factory.
 *
 * Today: JSON file (`server/data/db.json`)
 * Next:  STORAGE_DRIVER=postgres → implement PostgresStore with the same Store interface.
 *        Services and routes do not change.
 */
export function createStore(): Store {
  switch (env.storageDriver) {
    case 'json':
      return new JsonStore()
    case 'postgres':
      throw new Error(
        'Postgres storage is not implemented yet. Keep STORAGE_DRIVER=json until the database layer is added.',
      )
    default:
      throw new Error(`Unknown STORAGE_DRIVER: ${env.storageDriver}`)
  }
}

export const store = createStore()
