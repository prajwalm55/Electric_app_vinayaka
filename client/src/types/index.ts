export type PropertyType = 'Domestic' | 'Commercial' | 'Industrial' | 'Agricultural'
export type PropertyDocumentType = 'E-Swathu' | 'Khata' | 'RTC' | 'Building License' | 'Other'
export type ConnectionType = 'Domestic' | 'Commercial' | 'Industrial' | 'Temporary'
export type SiteClassification = 'Rural Panchayat' | 'Urban Municipality' | 'Revenue Site'
export type Phase = 'Single' | 'Three'

export type ServiceRequestStatus =
  | 'New'
  | 'Inspection Pending'
  | 'Inspection Completed'
  | 'Fee Discussion'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Converted to Project'

export type ProjectStatus = 'Active' | 'Completed' | 'Cancelled' | 'On Hold'

export type WorkflowStage =
  | 'Inspection'
  | 'File Preparation'
  | 'Power Sanction'
  | 'Work Order'
  | 'Meter Purchase'
  | 'Agency Inspection'
  | 'RR Number & Closure'

export type StageStatus = 'Pending' | 'In Progress' | 'Completed' | 'Submitted' | 'Sanctioned' | 'Rejected' | 'Processing' | 'Received' | 'Waiting for Inspection' | 'Inspection Scheduled' | 'Inspection Completed' | 'Correction Required' | 'Approved'

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Other'
export type PaymentCategory =
  | 'VEEW Service Charges'
  | 'ESCOM Fees'
  | 'Meter Cost'
  | 'Customer Advance'
  | 'Final Customer Payment'
  | 'Other'

export type DocumentCategory =
  | 'Aadhaar'
  | 'PAN'
  | 'E-Swathu'
  | 'Khata'
  | 'RTC'
  | 'Building License'
  | 'Application'
  | 'CR'
  | 'Field Report'
  | 'Estimate'
  | 'Power Sanction'
  | 'Work Order'
  | 'Fee Receipt'
  | 'Meter Purchase Receipt'
  | 'Other'

export type NotificationType = 'missing_document' | 'pending_payment' | 'follow_up' | 'next_stage' | 'agency_inspection' | 'general'

export interface Contact {
  id: string
  name: string
  relationship: string
  mobile: string
  whatsapp: string
  notes: string
}

export interface Customer {
  id: string
  name: string
  fatherSpouseName: string
  mobile: string
  village: string
  panchayat: string
  taluk: string
  district: string
  pinCode: string
  aadhaar: string
  pan?: string
  contacts: Contact[]
  notes: Note[]
  createdAt: string
  updatedAt: string
}

export interface Property {
  id: string
  customerId: string
  type: PropertyType
  documentNumber: string
  documentType: PropertyDocumentType
  latitude?: number
  longitude?: number
  sitePhoto?: string
  createdAt: string
  updatedAt: string
}

export interface ConnectionEntry {
  id: string
  type: ConnectionType
  requiredLoad: string
  phase: Phase
  remarks: string
}

export interface ServiceRequest {
  id: string
  customerId: string
  propertyId: string
  status: ServiceRequestStatus
  siteClassification: SiteClassification
  connections: ConnectionEntry[]
  inspectionNotes: string
  notes: Note[]
  createdAt: string
  updatedAt: string
}

export interface StageData {
  status: StageStatus
  startDate?: string
  completionDate?: string
  notes: string
}

export interface Project {
  id: string
  serviceRequestId?: string
  customerId: string
  propertyId: string
  status: ProjectStatus
  currentStage: WorkflowStage
  siteClassification?: SiteClassification
  connections?: ConnectionEntry[]
  inspectionNotes?: string
  totalAmount?: number
  stages: Record<WorkflowStage, StageData>
  rrNumber?: string
  rrReceivedDate?: string
  completionDate?: string
  closingRemarks?: string
  notes: Note[]
  createdAt: string
  updatedAt: string
}

export interface Document {
  id: string
  type: DocumentCategory
  fileName: string
  uploadDate: string
  description: string
  customerId?: string
  propertyId?: string
  projectId?: string
}

export interface Payment {
  id: string
  projectId: string
  customerId: string
  type: PaymentCategory
  amount: number
  date: string
  mode: PaymentMode
  referenceNumber: string
  remarks: string
}

export interface ProjectPhoto {
  id: string
  projectId: string
  fileName: string
  caption: string
  uploadDate: string
}

export interface Note {
  id: string
  text: string
  createdAt: string
}

export interface ActivityEntry {
  id: string
  type: string
  description: string
  entityType: 'customer' | 'service_request' | 'project'
  entityId: string
  createdAt: string
}

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  entityType?: 'customer' | 'service_request' | 'project' | 'payment'
  entityId?: string
  read: boolean
  createdAt: string
}

export interface UserProfile {
  name: string
  mobile: string
  email: string
  companyName: string
  companyLocation: string
  notificationPreferences: {
    missingDocuments: boolean
    pendingPayments: boolean
    followUps: boolean
    stageReminders: boolean
    agencyInspection: boolean
  }
}

export interface AppData {
  customers: Customer[]
  properties: Property[]
  serviceRequests: ServiceRequest[]
  projects: Project[]
  documents: Document[]
  payments: Payment[]
  photos: ProjectPhoto[]
  activities: ActivityEntry[]
  notifications: Notification[]
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
  'Inspection',
  'File Preparation',
  'Power Sanction',
  'Work Order',
  'Meter Purchase',
  'Agency Inspection',
  'RR Number & Closure',
]
