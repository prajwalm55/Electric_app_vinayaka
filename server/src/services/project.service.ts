import { z } from 'zod'
import { store } from '../storage/createStore.js'
import type { ConnectionEntry, Customer, Project, Property } from '../types/domain.js'
import { createDefaultStages } from '../seed/seedData.js'
import { AppError, nextId, nowIso, requireEntity, todayIso } from '../utils/helpers.js'
import { recordActivity } from './activity.service.js'

const connectionSchema = z.object({
  type: z.enum(['Domestic', 'Commercial', 'Industrial', 'Temporary']),
  requiredLoad: z.string().min(1),
  phase: z.enum(['Single', 'Three']),
  remarks: z.string().optional().default(''),
})

const connectionInputSchema = connectionSchema.extend({
  id: z.string().optional(),
})

const createSchema = z.object({
  customerId: z.string().min(1),
  propertyId: z.string().min(1),
  siteClassification: z.enum(['Rural Panchayat', 'Urban Municipality', 'Revenue Site']),
  connections: z.array(connectionSchema).min(1),
  inspectionNotes: z.string().optional().default(''),
  totalAmount: z.number().positive().optional(),
})

const patchSchema = z.object({
  status: z.enum(['Active', 'Completed', 'Cancelled', 'On Hold']).optional(),
  currentStage: z
    .enum([
      'Inspection',
      'File Preparation',
      'Power Sanction',
      'Work Order',
      'Meter Purchase',
      'Agency Inspection',
      'RR Number & Closure',
    ])
    .optional(),
  stages: z.record(z.any()).optional(),
  siteClassification: z.enum(['Rural Panchayat', 'Urban Municipality', 'Revenue Site']).optional(),
  propertyId: z.string().min(1).optional(),
  connections: z.array(connectionInputSchema).optional(),
  inspectionNotes: z.string().optional(),
  totalAmount: z.number().positive().optional(),
  rrNumber: z.string().optional(),
  rrReceivedDate: z.string().optional(),
  completionDate: z.string().optional(),
  closingRemarks: z.string().optional(),
})

export async function listProjects() {
  return store.getAll<Project>('projects')
}

export async function getProject(id: string) {
  return requireEntity<Project>(store, 'projects', id, 'Project')
}

export async function createProject(body: unknown) {
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

  const today = todayIso()
  const project: Project = {
    id: await nextId(store, 'projects', 'PRJ'),
    customerId: input.customerId,
    propertyId: input.propertyId,
    status: 'Active',
    currentStage: 'Inspection',
    siteClassification: input.siteClassification,
    connections,
    inspectionNotes: input.inspectionNotes,
    ...(input.totalAmount != null ? { totalAmount: input.totalAmount } : {}),
    stages: {
      ...createDefaultStages(),
      Inspection: { status: 'In Progress', startDate: today, notes: input.inspectionNotes },
    },
    notes: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  await store.insert('projects', project)
  await recordActivity({
    type: 'Project Created',
    description: `Project ${project.id} started for meter installation`,
    entityType: 'project',
    entityId: project.id,
  })
  return project
}

export async function updateProject(id: string, body: unknown) {
  const existing = await requireEntity<Project>(store, 'projects', id, 'Project')
  const input = patchSchema.parse(body)

  const { connections: inputConnections, propertyId, ...rest } = input

  if (propertyId) {
    const property = await requireEntity<Property>(store, 'properties', propertyId, 'Property')
    if (property.customerId !== existing.customerId) {
      throw new AppError(400, 'Property does not belong to this customer')
    }
  }

  let connections = existing.connections
  if (inputConnections) {
    connections = []
    for (const connection of inputConnections) {
      connections.push({
        type: connection.type,
        requiredLoad: connection.requiredLoad,
        phase: connection.phase,
        remarks: connection.remarks,
        id: connection.id || (await nextId(store, 'connections', 'CN')),
      })
    }
  }

  const updated = await store.update<Project>('projects', id, {
    ...rest,
    ...(propertyId ? { propertyId } : {}),
    connections,
    stages: input.stages ? { ...existing.stages, ...input.stages } : existing.stages,
    updatedAt: nowIso(),
  })

  if (input.rrNumber && input.rrNumber !== existing.rrNumber) {
    await recordActivity({
      type: 'RR Number Added',
      description: `RR Number ${input.rrNumber} added to ${id}`,
      entityType: 'project',
      entityId: id,
    })
  }

  if (updated.status === 'Completed' && existing.status !== 'Completed') {
    await recordActivity({
      type: 'Project Completed',
      description: `Project ${id} marked completed`,
      entityType: 'project',
      entityId: id,
    })
  }

  return updated
}
