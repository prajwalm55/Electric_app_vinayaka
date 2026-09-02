import { store } from '../storage/createStore.js'
import type { Customer, Project, Property } from '../types/domain.js'

export interface SearchResult {
  type: 'customer' | 'project' | 'property'
  id: string
  title: string
  subtitle: string
  link: string
}

export async function searchRecords(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const [customers, properties, projects] = await Promise.all([
    store.getAll<Customer>('customers'),
    store.getAll<Property>('properties'),
    store.getAll<Project>('projects'),
  ])

  const results: SearchResult[] = []

  for (const customer of customers) {
    if (
      customer.name.toLowerCase().includes(q) ||
      customer.mobile.includes(q) ||
      customer.aadhaar.includes(q) ||
      customer.village.toLowerCase().includes(q)
    ) {
      results.push({
        type: 'customer',
        id: customer.id,
        title: customer.name,
        subtitle: `${customer.mobile} · ${customer.village}`,
        link: `/customers/${customer.id}`,
      })
    }
  }

  for (const property of properties) {
    if (property.documentNumber.toLowerCase().includes(q)) {
      const customer = customers.find((item) => item.id === property.customerId)
      results.push({
        type: 'property',
        id: property.id,
        title: property.documentNumber,
        subtitle: `${property.type} · ${customer?.name || 'Unknown'}`,
        link: `/customers/${property.customerId}`,
      })
    }
  }

  for (const project of projects) {
    const connectionMatch = project.connections?.some(
      (connection) =>
        connection.type.toLowerCase().includes(q) ||
        connection.requiredLoad.toLowerCase().includes(q),
    )
    if (
      project.id.toLowerCase().includes(q) ||
      project.status.toLowerCase().includes(q) ||
      (project.rrNumber && project.rrNumber.toLowerCase().includes(q)) ||
      connectionMatch
    ) {
      const customer = customers.find((item) => item.id === project.customerId)
      results.push({
        type: 'project',
        id: project.id,
        title: project.id,
        subtitle: `${project.currentStage} · ${customer?.name || ''}`,
        link: `/projects/${project.id}`,
      })
    }
  }

  return results
}
