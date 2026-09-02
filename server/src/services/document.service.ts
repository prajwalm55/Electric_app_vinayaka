import { z } from 'zod'
import { store } from '../storage/createStore.js'
import type { DocumentRecord, Notification, ProjectPhoto } from '../types/domain.js'
import { nextId, nowIso } from '../utils/helpers.js'
import { recordActivity } from './activity.service.js'

const documentSchema = z.object({
  type: z.enum([
    'Aadhaar',
    'PAN',
    'E-Swathu',
    'Khata',
    'RTC',
    'Building License',
    'Application',
    'CR',
    'Field Report',
    'Estimate',
    'Power Sanction',
    'Work Order',
    'Fee Receipt',
    'Meter Purchase Receipt',
    'Other',
  ]),
  fileName: z.string().min(1),
  description: z.string().optional().default(''),
  customerId: z.string().optional(),
  propertyId: z.string().optional(),
  projectId: z.string().optional(),
})

const photoSchema = z.object({
  projectId: z.string().min(1),
  fileName: z.string().min(1),
  caption: z.string().optional().default(''),
})

export async function createDocument(body: unknown) {
  const input = documentSchema.parse(body)
  const doc: DocumentRecord = {
    ...input,
    id: await nextId(store, 'documents', 'DOC'),
    uploadDate: nowIso(),
  }
  await store.insert('documents', doc)
  await recordActivity({
    type: 'Document Uploaded',
    description: `${doc.type} document uploaded`,
    entityType: doc.projectId ? 'project' : 'customer',
    entityId: doc.projectId || doc.customerId || doc.propertyId || '',
  })
  return doc
}

export async function createPhoto(body: unknown) {
  const input = photoSchema.parse(body)
  const photo: ProjectPhoto = {
    ...input,
    id: await nextId(store, 'photos', 'PHO'),
    uploadDate: nowIso(),
  }
  await store.insert('photos', photo)
  return photo
}

export async function markNotificationRead(id: string) {
  return store.update<Notification>('notifications', id, { read: true })
}

export async function markAllNotificationsRead() {
  const notifications = await store.getAll<Notification>('notifications')
  await store.runInTransaction(async (tx) => {
    for (const notification of notifications) {
      if (!notification.read) {
        await tx.update<Notification>('notifications', notification.id, { read: true })
      }
    }
  })
}
