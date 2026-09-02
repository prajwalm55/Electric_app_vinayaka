import { z } from 'zod'
import { store } from '../storage/createStore.js'
import type { ConnectionEntry, Customer, Project, Property, ServiceRequest } from '../types/domain.js'
import { createDefaultStages } from '../seed/seedData.js'
import { AppError, nextId, nowIso, requireEntity, todayIso } from '../utils/helpers.js'
import { recordActivity } from './activity.service.js'

const connectionSchema = z.object({
  type: z.enum(['Domestic', 'Commercial', 'Industrial', 'Temporary']),
  requiredLoad: z.string().min(1),
  phase: z.enum(['Single', 'Three']),
  remarks: z.string().optional().default(''),
})

const createSchema = z.object({
  customerId: z.string().min(1),
  propertyId: z.string().min(1),
  siteClassification: z.enum(['Rural Panchayat', 'Urban Municipality', 'Revenue Site']),
  connections: z.array(connectionSchema).min(1),
  inspectionNotes: z.string().optional().default(''),
})

const statusSchema = z.object({
  status: z.enum([
    'New',
    'Inspection Pending',
    'Inspection Completed',
    'Fee Discussion',
    'Approved',
    'Rejected',
    'Cancelled',
    'Converted to Project',
  ]),
  inspectionNotes: z.string().optional(),
})

export async function listServiceRequests() {
  return store.getAll<ServiceRequest>('serviceRequests')
}

export async function getServiceRequest(id: string) {
  return requireEntity<ServiceRequest>(store, 'serviceRequests', id, 'Service request')
}

export async function createServiceRequest(body: unknown) {
  const input = createSchema.parse(body)
  await requireEntity<Customer>(store, 'customers', input.customerId, 'Customer')
  const property = await requireEntity<Property>(store, 'properties', input.propertyId, 'Property')
  if (property.customerId !== input.customerId) {
    throw new AppError(400, 'Property does not belong to this customer')
  }

  const connections: ConnectionEntry[] = []
  for (const connection of input.connections) {
    connections.push({
      ...connection,
      id: await nextId(store, 'connections', 'CN'),
    })
  }

  const request: ServiceRequest = {
    id: await nextId(store, 'serviceRequests', 'SR'),
    customerId: input.customerId,
    propertyId: input.propertyId,
    status: 'New',
    siteClassification: input.siteClassification,
    connections,
    inspectionNotes: input.inspectionNotes,
    notes: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await store.insert('serviceRequests', request)
  await recordActivity({
    type: 'Service Request Created',
    description: `Service request ${request.id} created`,
    entityType: 'service_request',
    entityId: request.id,
  })
  return request
}

export async function updateServiceRequest(id: string, body: unknown) {
  const request = await requireEntity<ServiceRequest>(store, 'serviceRequests', id, 'Service request')
  if (request.status === 'Converted to Project') {
    throw new AppError(400, 'Converted service requests cannot be updated')
  }
  const input = statusSchema.parse(body)
  const updated = await store.update<ServiceRequest>('serviceRequests', id, {
    ...input,
    updatedAt: nowIso(),
  })
  if (input.status === 'Inspection Completed') {
    await recordActivity({
      type: 'Inspection Completed',
      description: `Inspection completed for ${id}`,
      entityType: 'service_request',
      entityId: id,
    })
  }
  return updated
}

export async function convertToProject(serviceRequestId: string) {
  return store.runInTransaction(async (tx) => {
    const request = await requireEntity<ServiceRequest>(tx, 'serviceRequests', serviceRequestId, 'Service request')
    if (request.status === 'Converted to Project') {
      throw new AppError(400, 'Service request already converted')
    }
    if (request.status !== 'Approved') {
      throw new AppError(400, 'Only approved service requests can be converted')
    }

    const today = todayIso()
    const project: Project = {
      id: await nextId(tx, 'projects', 'PRJ'),
      serviceRequestId,
      customerId: request.customerId,
      propertyId: request.propertyId,
      status: 'Active',
      currentStage: 'File Preparation',
      stages: {
        ...createDefaultStages(),
        Inspection: {
          status: 'Completed',
          startDate: today,
          completionDate: today,
          notes: 'Converted from service request',
        },
        'File Preparation': { status: 'In Progress', startDate: today, notes: '' },
      },
      notes: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }

    await tx.insert('projects', project)
    await tx.update<ServiceRequest>('serviceRequests', serviceRequestId, {
      status: 'Converted to Project',
      updatedAt: nowIso(),
    })
    await recordActivity({
      type: 'Project Created',
      description: `Project ${project.id} created from ${serviceRequestId}`,
      entityType: 'project',
      entityId: project.id,
    }, tx)
    return project
  })
}
