import { z } from 'zod'
import { store } from '../storage/createStore.js'
import type { Property } from '../types/domain.js'
import { nextId, nowIso, requireEntity } from '../utils/helpers.js'
import type { Customer } from '../types/domain.js'

const propertySchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(['Domestic', 'Commercial', 'Industrial', 'Agricultural']),
  documentNumber: z.string().min(1),
  documentType: z.enum(['E-Swathu', 'Khata', 'RTC', 'Building License', 'Other']),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  sitePhoto: z.string().optional(),
})

export async function listProperties() {
  return store.getAll<Property>('properties')
}

export async function createProperty(body: unknown) {
  const input = propertySchema.parse(body)
  await requireEntity<Customer>(store, 'customers', input.customerId, 'Customer')
  const property: Property = {
    ...input,
    id: await nextId(store, 'properties', 'PROP'),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  await store.insert('properties', property)
  return property
}

export async function getProperty(id: string) {
  return requireEntity<Property>(store, 'properties', id, 'Property')
}

export async function updateProperty(id: string, body: unknown) {
  await requireEntity<Property>(store, 'properties', id, 'Property')
  const input = propertySchema.omit({ customerId: true }).partial().parse(body)
  return store.update<Property>('properties', id, { ...input, updatedAt: nowIso() })
}
