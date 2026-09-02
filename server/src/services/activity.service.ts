import type { ActivityEntry } from '../types/domain.js'
import type { Store } from '../storage/types.js'
import { store as defaultStore } from '../storage/createStore.js'
import { nextId, nowIso } from '../utils/helpers.js'

export async function recordActivity(input: Omit<ActivityEntry, 'id' | 'createdAt'>, db: Store = defaultStore) {
  const entry: ActivityEntry = {
    ...input,
    id: await nextId(db, 'activities', 'ACT'),
    createdAt: nowIso(),
  }
  await db.insert('activities', entry)
  return entry
}
