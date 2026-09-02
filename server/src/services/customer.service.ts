import { z } from 'zod'
import { store } from '../storage/createStore.js'
import type { Contact, Customer } from '../types/domain.js'
import { nextId, nowIso, requireEntity } from '../utils/helpers.js'
import { recordActivity } from './activity.service.js'

const customerSchema = z.object({
  name: z.string().min(1),
  fatherSpouseName: z.string().min(1),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile'),
  village: z.string().min(1),
  panchayat: z.string().min(1),
  taluk: z.string().min(1),
  district: z.string().min(1),
  pinCode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN'),
  aadhaar: z.string().regex(/^\d{12}$/, 'Enter a valid 12-digit Aadhaar'),
  pan: z.string().optional(),
})

const contactSchema = z.object({
  name: z.string().min(1),
  relationship: z.string().min(1),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  whatsapp: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

export async function listCustomers() {
  return store.getAll<Customer>('customers')
}

export async function getCustomer(id: string) {
  return requireEntity<Customer>(store, 'customers', id, 'Customer')
}

export async function createCustomer(body: unknown) {
  const input = customerSchema.parse(body)
  const customer: Customer = {
    ...input,
    id: await nextId(store, 'customers', 'CUS'),
    contacts: [],
    notes: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  await store.insert('customers', customer)
  await recordActivity({
    type: 'Customer Created',
    description: `Customer ${customer.name} created`,
    entityType: 'customer',
    entityId: customer.id,
  })
  return customer
}

export async function updateCustomer(id: string, body: unknown) {
  await requireEntity<Customer>(store, 'customers', id, 'Customer')
  const input = customerSchema.partial().parse(body)
  return store.update<Customer>('customers', id, { ...input, updatedAt: nowIso() })
}

export async function addContact(customerId: string, body: unknown) {
  const customer = await requireEntity<Customer>(store, 'customers', customerId, 'Customer')
  const input = contactSchema.parse(body)
  const contact: Contact = {
    ...input,
    id: await nextId(store, 'contacts', 'CON'),
    whatsapp: input.whatsapp || input.mobile,
  }
  return store.update<Customer>('customers', customerId, {
    contacts: [...customer.contacts, contact],
    updatedAt: nowIso(),
  })
}

const contactInputSchema = contactSchema.extend({
  id: z.string().optional(),
})

export async function replaceContacts(customerId: string, body: unknown) {
  await requireEntity<Customer>(store, 'customers', customerId, 'Customer')
  const input = z.object({ contacts: z.array(contactInputSchema) }).parse(body)
  const contacts: Contact[] = []
  for (const entry of input.contacts) {
    contacts.push({
      id: entry.id || (await nextId(store, 'contacts', 'CON')),
      name: entry.name,
      relationship: entry.relationship,
      mobile: entry.mobile,
      whatsapp: entry.whatsapp || entry.mobile,
      notes: entry.notes || '',
    })
  }
  return store.update<Customer>('customers', customerId, { contacts, updatedAt: nowIso() })
}

export async function deleteCustomer(id: string) {
  const customer = await requireEntity<Customer>(store, 'customers', id, 'Customer')

  await store.runInTransaction(async (tx) => {
    const properties = await tx.find<{ id: string; customerId: string }>('properties', (p) => p.customerId === id)
    const propertyIds = new Set(properties.map((p) => p.id))
    const projects = await tx.find<{ id: string; customerId: string }>('projects', (p) => p.customerId === id)
    const projectIds = new Set(projects.map((p) => p.id))

    await tx.removeWhere('documents', (doc: { customerId?: string; propertyId?: string; projectId?: string }) =>
      doc.customerId === id ||
      (doc.propertyId != null && propertyIds.has(doc.propertyId)) ||
      (doc.projectId != null && projectIds.has(doc.projectId)),
    )
    await tx.removeWhere('payments', (pay: { customerId: string; projectId: string }) =>
      pay.customerId === id || projectIds.has(pay.projectId),
    )
    await tx.removeWhere('photos', (photo: { projectId: string }) => projectIds.has(photo.projectId))
    await tx.removeWhere('activities', (entry: { entityId: string }) =>
      entry.entityId === id || projectIds.has(entry.entityId),
    )
    await tx.removeWhere('notifications', (note: { entityId?: string }) =>
      note.entityId === id || (note.entityId != null && projectIds.has(note.entityId)),
    )
    await tx.removeWhere('serviceRequests', (req: { customerId: string }) => req.customerId === id)
    await tx.removeWhere('projects', (p: { customerId: string }) => p.customerId === id)
    await tx.removeWhere('properties', (p: { customerId: string }) => p.customerId === id)
    await tx.deleteById('customers', id)
  })

  await recordActivity({
    type: 'Customer Deleted',
    description: `Customer ${customer.name} (${id}) deleted`,
    entityType: 'customer',
    entityId: id,
  })

  return { ok: true }
}
