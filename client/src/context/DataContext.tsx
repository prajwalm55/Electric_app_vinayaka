import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type {
  AppData,
  Contact,
  Customer,
  Property,
  Project,
  Document,
  Payment,
  ProjectPhoto,
  SiteClassification,
  ConnectionEntry,
} from '../types'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

interface DataContextType extends AppData {
  loading: boolean
  refresh: () => Promise<void>
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'contacts' | 'notes'>) => Promise<Customer>
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>
  deleteCustomer: (id: string) => Promise<void>
  addContact: (customerId: string, contact: Omit<Contact, 'id'>) => Promise<Customer>
  replaceContacts: (customerId: string, contacts: Contact[]) => Promise<void>
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Property>
  updateProperty: (id: string, updates: Partial<Omit<Property, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>) => Promise<void>
  createProject: (input: {
    customerId: string
    propertyId: string
    siteClassification: SiteClassification
    connections: Omit<ConnectionEntry, 'id'>[]
    inspectionNotes: string
    totalAmount?: number
  }) => Promise<Project>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment>
  addDocument: (doc: Omit<Document, 'id' | 'uploadDate'>) => Promise<Document>
  addPhoto: (photo: Omit<ProjectPhoto, 'id' | 'uploadDate'>) => Promise<ProjectPhoto>
  getCustomer: (id: string) => Customer | undefined
  getProperty: (id: string) => Property | undefined
  getProjectPayments: (projectId: string) => Payment[]
  search: (query: string) => SearchResult[]
}

export interface SearchResult {
  type: 'customer' | 'project' | 'property'
  id: string
  title: string
  subtitle: string
  link: string
}

const emptyData: AppData = {
  customers: [],
  properties: [],
  serviceRequests: [],
  projects: [],
  documents: [],
  payments: [],
  photos: [],
  activities: [],
  notifications: [],
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [data, setData] = useState<AppData>(emptyData)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    const snapshot = await api.get<AppData>('/data')
    setData(snapshot)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setData(emptyData)
      return
    }
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [isAuthenticated, refresh])

  const addCustomer = useCallback(
    async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'contacts' | 'notes'>) => {
      const created = await api.post<Customer>('/customers', customer)
      await refresh()
      return created
    },
    [refresh],
  )

  const updateCustomer = useCallback(
    async (id: string, updates: Partial<Customer>) => {
      await api.put(`/customers/${id}`, updates)
      await refresh()
    },
    [refresh],
  )

  const deleteCustomer = useCallback(
    async (id: string) => {
      await api.delete(`/customers/${id}`)
      await refresh()
    },
    [refresh],
  )

  const addContact = useCallback(
    async (customerId: string, contact: Omit<Contact, 'id'>) => {
      const updated = await api.post<Customer>(`/customers/${customerId}/contacts`, contact)
      await refresh()
      return updated
    },
    [refresh],
  )

  const replaceContacts = useCallback(
    async (customerId: string, contacts: Contact[]) => {
      await api.put(`/customers/${customerId}/contacts`, { contacts })
      await refresh()
    },
    [refresh],
  )

  const addProperty = useCallback(
    async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await api.post<Property>('/properties', property)
      await refresh()
      return created
    },
    [refresh],
  )

  const updateProperty = useCallback(
    async (id: string, updates: Partial<Omit<Property, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>) => {
      await api.put(`/properties/${id}`, updates)
      await refresh()
    },
    [refresh],
  )

  const createProject = useCallback(
    async (input: {
      customerId: string
      propertyId: string
      siteClassification: SiteClassification
      connections: Omit<ConnectionEntry, 'id'>[]
      inspectionNotes: string
      totalAmount?: number
    }) => {
      const created = await api.post<Project>('/projects', input)
      await refresh()
      return created
    },
    [refresh],
  )

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      await api.patch(`/projects/${id}`, updates)
      await refresh()
    },
    [refresh],
  )

  const addPayment = useCallback(
    async (payment: Omit<Payment, 'id'>) => {
      const created = await api.post<Payment>('/payments', payment)
      await refresh()
      return created
    },
    [refresh],
  )

  const addDocument = useCallback(
    async (doc: Omit<Document, 'id' | 'uploadDate'>) => {
      const created = await api.post<Document>('/documents', doc)
      await refresh()
      return created
    },
    [refresh],
  )

  const addPhoto = useCallback(
    async (photo: Omit<ProjectPhoto, 'id' | 'uploadDate'>) => {
      const created = await api.post<ProjectPhoto>('/photos', photo)
      await refresh()
      return created
    },
    [refresh],
  )

  const getCustomer = useCallback((id: string) => data.customers.find((c) => c.id === id), [data.customers])
  const getProperty = useCallback((id: string) => data.properties.find((p) => p.id === id), [data.properties])
  const getProjectPayments = useCallback(
    (projectId: string) => data.payments.filter((p) => p.projectId === projectId),
    [data.payments],
  )

  const search = useCallback(
    (query: string): SearchResult[] => {
      if (!query.trim()) return []
      const q = query.toLowerCase()
      const results: SearchResult[] = []

      data.customers.forEach((c) => {
        if (
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          c.aadhaar.includes(q) ||
          c.village.toLowerCase().includes(q)
        ) {
          results.push({
            type: 'customer',
            id: c.id,
            title: c.name,
            subtitle: `${c.mobile} · ${c.village}`,
            link: `/customers/${c.id}`,
          })
        }
      })

      data.properties.forEach((p) => {
        if (p.documentNumber.toLowerCase().includes(q)) {
          const customer = data.customers.find((c) => c.id === p.customerId)
          results.push({
            type: 'property',
            id: p.id,
            title: p.documentNumber,
            subtitle: `${p.type} · ${customer?.name || 'Unknown'}`,
            link: `/customers/${p.customerId}`,
          })
        }
      })

      data.projects.forEach((p) => {
        if (
          p.id.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q) ||
          (p.rrNumber && p.rrNumber.toLowerCase().includes(q)) ||
          p.connections?.some((c) => c.type.toLowerCase().includes(q))
        ) {
          const customer = data.customers.find((c) => c.id === p.customerId)
          results.push({
            type: 'project',
            id: p.id,
            title: p.id,
            subtitle: `${p.currentStage} · ${customer?.name || ''}`,
            link: `/projects/${p.id}`,
          })
        }
      })

      return results
    },
    [data],
  )

  return (
    <DataContext.Provider
      value={{
        ...data,
        loading,
        refresh,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addContact,
        replaceContacts,
        addProperty,
        updateProperty,
        createProject,
        updateProject,
        addPayment,
        addDocument,
        addPhoto,
        getCustomer,
        getProperty,
        getProjectPayments,
        search,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
