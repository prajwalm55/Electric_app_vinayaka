import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { FolderKanban, Search, MapPin, Camera, FileText, CreditCard, Plus, Phone, ChevronDown, ChevronUp, Pencil, FileDown } from 'lucide-react'
import { Header } from '../components/layout/AppLayout'
import { Card, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Select, Textarea, Input } from '../components/ui/Input'
import { EmptyState, Modal, ModalFooter } from '../components/ui/Modal'
import { ProjectWorkCard } from '../components/common/ProjectWorkCard'
import { WorkflowStepper } from '../components/common/WorkflowStepper'
import { ActivityTimeline } from '../components/common/ActivityTimeline'
import { LoadingState } from '../components/ui/LoadingState'
import { PaymentTypeBreakdown, PaymentBalanceSummary } from '../components/common/PaymentTracker'
import { useData } from '../context/DataContext'
import { api } from '../api/client'
import { formatCurrency, formatDate } from '../utils/formatters'
import { getProjectPaymentBalance } from '../utils/payments'
import type { ConnectionEntry, DocumentCategory, ProjectStatus, SiteClassification, WorkflowStage, StageStatus, PaymentCategory, PaymentMode } from '../types'
import { WORKFLOW_STAGES } from '../types'

export function ProjectsPage() {
  const { projects, customers, payments, loading, error, retry } = useData()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'Active' | 'Completed' | 'Cancelled'>('all')
  const navigate = useNavigate()

  const filtered = projects.filter((p) => {
    const customer = customers.find((c) => c.id === p.customerId)
    const matchSearch =
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.rrNumber && p.rrNumber.toLowerCase().includes(search.toLowerCase()))
    const matchFilter = filter === 'all' || p.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <Header title="Work Queue" subtitle={`${projects.filter((p) => p.status === 'Active').length} active · ${projects.length} total`} />
      <div className="px-4 lg:px-6 py-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'Active', 'Completed', 'Cancelled'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-primary-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search projects, RR number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-[44px]"
            />
          </div>
          <Button onClick={() => navigate('/projects/new')} className="shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        {loading ? (
          <LoadingState label="Loading projects..." />
        ) : error ? (
          <LoadingState error={error} onRetry={retry} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects found" description="Start a new meter installation project for a customer" action={<Button onClick={() => navigate('/projects/new')}><Plus className="w-4 h-4" /> New Project</Button>} />
        ) : (
          <div className="space-y-3">
            {filtered.map((project) => (
              <ProjectWorkCard
                key={project.id}
                project={project}
                customer={customers.find((c) => c.id === project.customerId)}
                payments={payments}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const stageStatusOptions: Record<WorkflowStage, StageStatus[]> = {
  'Inspection': ['Pending', 'In Progress', 'Completed'],
  'File Preparation': ['Pending', 'In Progress', 'Completed'],
  'Power Sanction': ['Pending', 'Submitted', 'Sanctioned', 'Rejected'],
  'Work Order': ['Pending', 'Processing', 'Received'],
  'Meter Purchase': ['Pending', 'In Progress', 'Completed'],
  'Agency Inspection': ['Waiting for Inspection', 'Inspection Scheduled', 'Inspection Completed', 'Correction Required', 'Approved'],
  'RR Number & Closure': ['Pending', 'In Progress', 'Completed'],
}

export function ProjectDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { projects, customers, properties, photos, documents, activities, updateProject, getProjectPayments, addPayment } = useData()
  const [showStageModal, setShowStageModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showAmountModal, setShowAmountModal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [stageStatus, setStageStatus] = useState<StageStatus>('Pending')
  const [stageNotes, setStageNotes] = useState('')
  const [rrNumber, setRrNumber] = useState('')
  const [totalAmountInput, setTotalAmountInput] = useState('')
  const [amountError, setAmountError] = useState('')
  const [savingAmount, setSavingAmount] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [paymentForm, setPaymentForm] = useState({
    type: 'Customer Advance' as PaymentCategory,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'UPI' as PaymentMode,
    referenceNumber: '',
    remarks: '',
  })

  const project = projects.find((p) => p.id === id)
  if (!project) return <div className="p-6 text-center text-slate-500">Project not found</div>

  const customer = customers.find((c) => c.id === project.customerId)
  const property = properties.find((p) => p.id === project.propertyId)
  const projectPayments = getProjectPayments(project.id)
  const projectPhotos = photos.filter((p) => p.projectId === project.id)
  const projectDocs = documents.filter((d) => d.projectId === project.id)
  const projectActivities = activities.filter((a) => a.entityId === project.id)
  const paymentBalance = getProjectPaymentBalance(project, projectPayments)

  const openStageUpdate = () => {
    const current = project.stages[project.currentStage]
    setStageStatus(current.status as StageStatus)
    setStageNotes(current.notes)
    setShowStageModal(true)
  }

  const handleStageUpdate = async () => {
    const updatedStages = {
      ...project.stages,
      [project.currentStage]: {
        ...project.stages[project.currentStage],
        status: stageStatus,
        notes: stageNotes,
        ...(stageStatus === 'Completed' || stageStatus === 'Approved' || stageStatus === 'Sanctioned' || stageStatus === 'Received'
          ? { completionDate: new Date().toISOString().split('T')[0] }
          : {}),
      },
    }

    const currentIndex = WORKFLOW_STAGES.indexOf(project.currentStage)
    let nextStage = project.currentStage
    let projectStatus = project.status

    if (['Completed', 'Approved', 'Sanctioned', 'Received'].includes(stageStatus) && currentIndex < WORKFLOW_STAGES.length - 1) {
      nextStage = WORKFLOW_STAGES[currentIndex + 1]
      updatedStages[nextStage] = {
        ...updatedStages[nextStage],
        status: 'In Progress',
        startDate: new Date().toISOString().split('T')[0],
      }
    }

    if (project.currentStage === 'RR Number & Closure' && stageStatus === 'Completed') {
      projectStatus = 'Completed'
    }

    await updateProject(project.id, {
      stages: updatedStages,
      currentStage: nextStage,
      status: projectStatus,
      ...(rrNumber ? { rrNumber, rrReceivedDate: new Date().toISOString().split('T')[0] } : {}),
      ...(projectStatus === 'Completed' ? { completionDate: new Date().toISOString().split('T')[0] } : {}),
    })
    setShowStageModal(false)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentForm.amount) return
    await addPayment({
      projectId: project.id,
      customerId: project.customerId,
      type: paymentForm.type,
      amount: Number(paymentForm.amount),
      date: paymentForm.date,
      mode: paymentForm.mode,
      referenceNumber: paymentForm.referenceNumber,
      remarks: paymentForm.remarks,
    })
    setShowPaymentModal(false)
    setPaymentForm({
      type: 'Customer Advance',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      referenceNumber: '',
      remarks: '',
    })
  }

  const openAmountEdit = () => {
    setTotalAmountInput(project.totalAmount != null ? String(project.totalAmount) : '')
    setAmountError('')
    setShowAmountModal(true)
  }

  const handleAmountSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = Number(totalAmountInput)
    if (!totalAmountInput.trim() || Number.isNaN(value) || value <= 0) {
      setAmountError('Enter a valid total amount greater than 0')
      return
    }
    setSavingAmount(true)
    try {
      await updateProject(project.id, { totalAmount: value })
      setShowAmountModal(false)
    } catch (err) {
      setAmountError(err instanceof Error ? err.message : 'Failed to update amount')
    } finally {
      setSavingAmount(false)
    }
  }

  const handleGenerateDocument = async () => {
    setGenerating(true)
    setGenerateError('')
    try {
      await api.download(`/customers/${project.customerId}/lighting-form`, `lighting-form-${project.customerId}.pdf`)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate document')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <Header title={customer?.name || project.id} subtitle={`${project.currentStage} · ${project.id}`} backTo="/projects" />
      <div className="px-4 lg:px-6 py-4 space-y-4">
        <Button onClick={() => navigate(`/projects/${project.id}/edit`)} fullWidth variant="outline">
          <Pencil className="w-4 h-4" /> Edit work details
        </Button>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge status={project.status} />
          <Badge status={project.currentStage} />
          {project.rrNumber && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">RR: {project.rrNumber}</span>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={openStageUpdate} fullWidth>
            Update stage
          </Button>
          <Button variant="outline" onClick={() => setShowPaymentModal(true)} fullWidth>
            <CreditCard className="w-4 h-4" /> Record payment
          </Button>
        </div>

        {customer?.mobile && (
          <a
            href={`tel:${customer.mobile}`}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Phone className="w-4 h-4" /> Call {customer.mobile}
          </a>
        )}

        <Button onClick={handleGenerateDocument} fullWidth variant="outline" disabled={generating}>
          <FileDown className="w-4 h-4" />
          {generating ? 'Generating document...' : 'Generate document'}
        </Button>
        {generateError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{generateError}</div>
        )}

        <Card padding="sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <CardTitle>Payment status</CardTitle>
            <Button size="sm" variant="ghost" onClick={openAmountEdit}>
              <Pencil className="w-3.5 h-3.5" />
              {project.totalAmount != null ? 'Edit total' : 'Set total'}
            </Button>
          </div>
          <PaymentBalanceSummary balance={paymentBalance} />
        </Card>

        <Card>
          <CardTitle>Current stage</CardTitle>
          <div className="mt-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-base font-semibold text-primary-800">{project.currentStage}</p>
            <p className="text-sm text-primary-700 mt-1">{project.stages[project.currentStage]?.status || 'Pending'}</p>
            {project.stages[project.currentStage]?.notes && (
              <p className="text-xs text-primary-600 mt-2">{project.stages[project.currentStage].notes}</p>
            )}
          </div>
          <div className="mt-4">
            <WorkflowStepper currentStage={project.currentStage} stages={project.stages} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardTitle>Payments</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowPaymentModal(true)}>+ Add</Button>
          </div>
          {projectPayments.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No payments yet</p>
          ) : (
            <>
              <PaymentTypeBreakdown payments={projectPayments} />
              <div className="space-y-1">
                {projectPayments.slice(0, 5).map((pay) => (
                  <div key={pay.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                    <div>
                      <p className="font-medium">{pay.type}</p>
                      <p className="text-xs text-slate-500">{formatDate(pay.date)} · {pay.mode}</p>
                    </div>
                    <p className="font-semibold text-green-700">{formatCurrency(pay.amount)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
        >
          Property, docs & activity
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showDetails && (
          <div className="space-y-4">
            <Card padding="sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Property</h3>
              <p className="text-sm">{property?.type} · {property?.documentNumber}</p>
              {property?.latitude != null && property.longitude != null && (
                <a href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary-600 mt-2">
                  <MapPin className="w-3 h-3" /> Navigate to site
                </a>
              )}
            </Card>

            {(project.connections?.length || project.siteClassification || project.inspectionNotes) && (
              <Card padding="sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Work requirement</h3>
                {project.siteClassification && <p className="text-sm text-slate-600">Site: {project.siteClassification}</p>}
                {project.connections?.map((conn) => (
                  <p key={conn.id} className="text-sm py-1">{conn.type} · {conn.requiredLoad} · {conn.phase} Phase</p>
                ))}
                {project.inspectionNotes && <p className="text-xs text-slate-500 mt-2">{project.inspectionNotes}</p>}
              </Card>
            )}

            {(projectPhotos.length > 0 || projectDocs.length > 0) && (
              <Card padding="sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Files</h3>
                {projectPhotos.map((photo) => (
                  <div key={photo.id} className="flex items-center gap-2 py-1.5 text-sm">
                    <Camera className="w-4 h-4 text-slate-400" /> {photo.caption || photo.fileName}
                  </div>
                ))}
                {projectDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 py-1.5 text-sm">
                    <FileText className="w-4 h-4 text-slate-400" /> {doc.type} — {doc.fileName}
                  </div>
                ))}
              </Card>
            )}

            {projectActivities.length > 0 && (
              <Card padding="sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Activity</h3>
                <ActivityTimeline activities={projectActivities} />
              </Card>
            )}

            <Button variant="outline" fullWidth onClick={() => navigate(`/customers/${project.customerId}`)}>
              View customer profile
            </Button>
          </div>
        )}
      </div>

      <Modal open={showStageModal} onClose={() => setShowStageModal(false)} title={`Update: ${project.currentStage}`}>
        <div className="space-y-4">
          <Select
            label="Status"
            value={stageStatus}
            onChange={(e) => setStageStatus(e.target.value as StageStatus)}
            options={stageStatusOptions[project.currentStage].map((s) => ({ value: s, label: s }))}
          />
          <Textarea label="Notes" value={stageNotes} onChange={(e) => setStageNotes(e.target.value)} />
          {project.currentStage === 'RR Number & Closure' && (
            <Input label="RR Number" value={rrNumber} onChange={(e) => setRrNumber(e.target.value)} placeholder="Enter RR Number" />
          )}
        </div>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowStageModal(false)} fullWidth>Cancel</Button>
          <Button onClick={handleStageUpdate} fullWidth>Save</Button>
        </ModalFooter>
      </Modal>

      <Modal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Payment">
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <p className="text-sm text-slate-600">{customer?.name} · {project.id}</p>
          <Select
            label="Payment Type"
            value={paymentForm.type}
            onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value as PaymentCategory })}
            options={[
              { value: 'VEEW Service Charges', label: 'VEEW Service Charges' },
              { value: 'ESCOM Fees', label: 'ESCOM Fees' },
              { value: 'Meter Cost', label: 'Meter Cost' },
              { value: 'Customer Advance', label: 'Customer Advance' },
              { value: 'Final Customer Payment', label: 'Final Customer Payment' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <Input label="Amount (₹)" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required min="0" />
          <Input label="Date" type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} required />
          <Select
            label="Payment Mode"
            value={paymentForm.mode}
            onChange={(e) => setPaymentForm({ ...paymentForm, mode: e.target.value as PaymentMode })}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <Input label="Reference Number" value={paymentForm.referenceNumber} onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} />
          <Textarea label="Remarks" value={paymentForm.remarks} onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)} fullWidth>Cancel</Button>
            <Button type="submit" fullWidth>Save Payment</Button>
          </ModalFooter>
        </form>
      </Modal>

      <Modal open={showAmountModal} onClose={() => setShowAmountModal(false)} title="Edit total amount">
        <form onSubmit={handleAmountSave} className="space-y-4">
          <p className="text-sm text-slate-600">
            Agreed total for this work. Remaining balance updates automatically from payments.
          </p>
          <Input
            label="Total amount (₹)"
            type="number"
            min="1"
            step="1"
            value={totalAmountInput}
            onChange={(e) => {
              setTotalAmountInput(e.target.value)
              setAmountError('')
            }}
            required
            error={amountError}
            placeholder="e.g. 15000"
          />
          {projectPayments.length > 0 && (
            <p className="text-xs text-slate-500">
              Paid so far: {formatCurrency(paymentBalance.paid)}
            </p>
          )}
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowAmountModal(false)} fullWidth disabled={savingAmount}>
              Cancel
            </Button>
            <Button type="submit" fullWidth disabled={savingAmount}>
              {savingAmount ? 'Saving...' : 'Save total'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

export function ProjectFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { customers, properties, createProject } = useData()
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '')
  const [propertyId, setPropertyId] = useState('')
  const [siteClassification, setSiteClassification] = useState<SiteClassification>('Rural Panchayat')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [connections, setConnections] = useState<Omit<ConnectionEntry, 'id'>[]>([
    { type: 'Domestic', requiredLoad: '1 KW', phase: 'Single', remarks: '' },
  ])

  const customerProperties = properties.filter((p) => p.customerId === customerId)

  const addConnection = () => {
    setConnections((prev) => [...prev, { type: 'Domestic', requiredLoad: '1 KW', phase: 'Single', remarks: '' }])
  }

  const updateConnection = (index: number, field: keyof Omit<ConnectionEntry, 'id'>, value: string) => {
    setConnections((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || !propertyId) return
    setSaving(true)
    try {
      const project = await createProject({
        customerId,
        propertyId,
        siteClassification,
        connections,
        inspectionNotes,
        ...(totalAmount ? { totalAmount: Number(totalAmount) } : {}),
      })
      navigate(`/projects/${project.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="Start New Project" subtitle="Customer → Property → 7-stage workflow" backTo="/projects" />
      <form onSubmit={handleSubmit} className="px-4 lg:px-6 py-4 space-y-4 max-w-2xl">
        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Customer & Property</h3>
          <div className="space-y-4">
            <Select
              label="Customer"
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setPropertyId('') }}
              required
              options={[{ value: '', label: 'Select customer' }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Select
              label="Property"
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              required
              options={[
                { value: '', label: customerId ? 'Select property' : 'Select customer first' },
                ...customerProperties.map((p) => ({ value: p.id, label: `${p.type} - ${p.documentNumber}` })),
              ]}
            />
            <Select
              label="Site Classification"
              value={siteClassification}
              onChange={(e) => setSiteClassification(e.target.value as SiteClassification)}
              options={[
                { value: 'Rural Panchayat', label: 'Rural Panchayat' },
                { value: 'Urban Municipality', label: 'Urban Municipality' },
                { value: 'Revenue Site', label: 'Revenue Site' },
              ]}
            />
            <Input
              label="Total Project Amount (₹)"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="e.g. 50000"
              min="0"
            />
            <p className="text-xs text-slate-400 -mt-2">Agreed total fee — tracks paid vs remaining balance.</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Connection Required</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addConnection}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          {connections.map((conn, i) => (
            <Card key={i} padding="sm" className="mb-2">
              <div className="grid sm:grid-cols-2 gap-3">
                <Select
                  label="Type"
                  value={conn.type}
                  onChange={(e) => updateConnection(i, 'type', e.target.value)}
                  options={[
                    { value: 'Domestic', label: 'Domestic' },
                    { value: 'Commercial', label: 'Commercial' },
                    { value: 'Industrial', label: 'Industrial' },
                    { value: 'Temporary', label: 'Temporary' },
                  ]}
                />
                <Input label="Load" value={conn.requiredLoad} onChange={(e) => updateConnection(i, 'requiredLoad', e.target.value)} />
                <Select
                  label="Phase"
                  value={conn.phase}
                  onChange={(e) => updateConnection(i, 'phase', e.target.value)}
                  options={[{ value: 'Single', label: 'Single' }, { value: 'Three', label: 'Three' }]}
                />
                <Input label="Remarks" value={conn.remarks} onChange={(e) => updateConnection(i, 'remarks', e.target.value)} />
              </div>
            </Card>
          ))}
          <Textarea label="Inspection Notes" value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} />
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} fullWidth disabled={saving}>Cancel</Button>
          <Button type="submit" fullWidth disabled={saving}>{saving ? 'Starting...' : 'Start Project'}</Button>
        </div>
      </form>
    </div>
  )
}

type ConnectionFormRow = Omit<ConnectionEntry, 'id'> & { id?: string }

export function ProjectEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { projects, customers, properties, documents, photos, updateProject, addDocument } = useData()
  const project = projects.find((p) => p.id === id)
  const customer = customers.find((c) => c.id === project?.customerId)
  const customerProperties = properties.filter((p) => p.customerId === project?.customerId)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const loadedForId = useRef<string | null>(null)

  const [propertyId, setPropertyId] = useState('')
  const [siteClassification, setSiteClassification] = useState<SiteClassification>('Rural Panchayat')
  const [status, setStatus] = useState<ProjectStatus>('Active')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [rrNumber, setRrNumber] = useState('')
  const [rrReceivedDate, setRrReceivedDate] = useState('')
  const [closingRemarks, setClosingRemarks] = useState('')
  const [connections, setConnections] = useState<ConnectionFormRow[]>([])
  const [newDocFile, setNewDocFile] = useState('')
  const [newDocType, setNewDocType] = useState<DocumentCategory>('Field Report')

  const projectDocs = documents.filter((d) => d.projectId === id)
  const projectPhotos = photos.filter((p) => p.projectId === id)

  useEffect(() => {
    loadedForId.current = null
    setInitialized(false)
  }, [id])

  useEffect(() => {
    if (!project || !id || loadedForId.current === id) return

    setPropertyId(project.propertyId)
    setSiteClassification(project.siteClassification || 'Rural Panchayat')
    setStatus(project.status)
    setInspectionNotes(project.inspectionNotes || '')
    setTotalAmount(project.totalAmount != null ? String(project.totalAmount) : '')
    setRrNumber(project.rrNumber || '')
    setRrReceivedDate(project.rrReceivedDate || '')
    setClosingRemarks(project.closingRemarks || '')
    setConnections(
      (project.connections || []).map((c) => ({
        id: c.id,
        type: c.type,
        requiredLoad: c.requiredLoad,
        phase: c.phase,
        remarks: c.remarks || '',
      })),
    )
    loadedForId.current = id
    setInitialized(true)
  }, [project, id])

  if (!project) {
    return (
      <div>
        <Header title="Edit Work" subtitle="Project not found" backTo="/projects" />
        <div className="p-6 text-center">
          <p className="text-slate-500">Project not found</p>
          <Link to="/projects" className="text-primary-600 text-sm mt-2 inline-block">Back to work queue</Link>
        </div>
      </div>
    )
  }

  const addConnection = () => {
    setConnections((prev) => [...prev, { type: 'Domestic', requiredLoad: '1 KW', phase: 'Single', remarks: '' }])
  }

  const updateConnection = (index: number, field: keyof ConnectionFormRow, value: string) => {
    setConnections((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  const removeConnection = (index: number) => {
    setConnections((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!propertyId) newErrors.propertyId = 'Select a property'
    if (connections.length === 0) newErrors.connections = 'Add at least one connection'
    if (totalAmount && (Number.isNaN(Number(totalAmount)) || Number(totalAmount) <= 0)) {
      newErrors.totalAmount = 'Enter a valid total amount'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      await updateProject(project.id, {
        propertyId,
        siteClassification,
        status,
        inspectionNotes,
        connections: connections.map((c) => ({
          id: c.id ?? '',
          type: c.type,
          requiredLoad: c.requiredLoad,
          phase: c.phase,
          remarks: c.remarks,
        })),
        ...(totalAmount ? { totalAmount: Number(totalAmount) } : {}),
        rrNumber: rrNumber || undefined,
        rrReceivedDate: rrReceivedDate || undefined,
        closingRemarks: closingRemarks || undefined,
      })

      if (newDocFile) {
        await addDocument({
          type: newDocType,
          fileName: newDocFile,
          description: 'Project document',
          projectId: project.id,
          customerId: project.customerId,
        })
      }

      navigate(`/projects/${project.id}`)
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  if (!initialized) {
    return (
      <div>
        <Header title="Edit Work" subtitle={project.id} backTo="/projects" />
        <div className="p-6 text-center text-slate-500 text-sm">Loading project...</div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Edit Work" subtitle={`${customer?.name || project.id} · ${project.id}`} backTo="/projects" />
      <form onSubmit={handleSubmit} className="px-4 lg:px-6 py-4 space-y-4 max-w-2xl">
        {errors.form && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{errors.form}</div>
        )}

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Work details</h3>
          <div className="space-y-4">
            <Input label="Customer" value={customer?.name || 'Unknown'} readOnly />
            <Input label="Project ID" value={project.id} readOnly />
            <Select
              label="Property"
              value={propertyId}
              onChange={(e) => {
                setPropertyId(e.target.value)
                setErrors((prev) => ({ ...prev, propertyId: '' }))
              }}
              required
              error={errors.propertyId}
              options={[
                { value: '', label: 'Select property' },
                ...customerProperties.map((p) => ({ value: p.id, label: `${p.type} · ${p.documentNumber}` })),
              ]}
            />
            <Select
              label="Site Classification"
              value={siteClassification}
              onChange={(e) => setSiteClassification(e.target.value as SiteClassification)}
              options={[
                { value: 'Rural Panchayat', label: 'Rural Panchayat' },
                { value: 'Urban Municipality', label: 'Urban Municipality' },
                { value: 'Revenue Site', label: 'Revenue Site' },
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Completed', label: 'Completed' },
                { value: 'On Hold', label: 'On Hold' },
                { value: 'Cancelled', label: 'Cancelled' },
              ]}
            />
            <Input
              label="Total Project Amount (₹)"
              type="number"
              value={totalAmount}
              onChange={(e) => {
                setTotalAmount(e.target.value)
                setErrors((prev) => ({ ...prev, totalAmount: '' }))
              }}
              placeholder="e.g. 50000"
              min="0"
              error={errors.totalAmount}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Connections required</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addConnection}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          {errors.connections && <p className="text-xs text-red-600 mb-2">{errors.connections}</p>}
          {connections.length === 0 ? (
            <p className="text-sm text-slate-500">No connections. Tap Add to create one.</p>
          ) : (
            connections.map((conn, index) => (
              <div key={conn.id || `new-${index}`} className="rounded-xl border border-slate-200 p-3 mb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">Connection {index + 1}</p>
                  <button type="button" className="text-xs text-red-600" onClick={() => removeConnection(index)}>Remove</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Select
                    label="Type"
                    value={conn.type}
                    onChange={(e) => updateConnection(index, 'type', e.target.value)}
                    options={[
                      { value: 'Domestic', label: 'Domestic' },
                      { value: 'Commercial', label: 'Commercial' },
                      { value: 'Industrial', label: 'Industrial' },
                      { value: 'Temporary', label: 'Temporary' },
                    ]}
                  />
                  <Input label="Load" value={conn.requiredLoad} onChange={(e) => updateConnection(index, 'requiredLoad', e.target.value)} />
                  <Select
                    label="Phase"
                    value={conn.phase}
                    onChange={(e) => updateConnection(index, 'phase', e.target.value)}
                    options={[{ value: 'Single', label: 'Single' }, { value: 'Three', label: 'Three' }]}
                  />
                  <Input label="Remarks" value={conn.remarks} onChange={(e) => updateConnection(index, 'remarks', e.target.value)} />
                </div>
              </div>
            ))
          )}
          <Textarea label="Inspection Notes" value={inspectionNotes} onChange={(e) => setInspectionNotes(e.target.value)} />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Closure details</h3>
          <div className="space-y-4">
            <Input label="RR Number" value={rrNumber} onChange={(e) => setRrNumber(e.target.value)} placeholder="Enter RR number" />
            <Input label="RR Received Date" type="date" value={rrReceivedDate} onChange={(e) => setRrReceivedDate(e.target.value)} />
            <Textarea label="Closing Remarks" value={closingRemarks} onChange={(e) => setClosingRemarks(e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Documents & photos</h3>
          {(projectDocs.length > 0 || projectPhotos.length > 0) && (
            <div className="mb-4 space-y-1">
              <p className="text-xs text-slate-500 mb-2">Existing files:</p>
              {projectDocs.map((doc) => (
                <p key={doc.id} className="text-xs text-slate-600">{doc.type} — {doc.fileName}</p>
              ))}
              {projectPhotos.map((photo) => (
                <p key={photo.id} className="text-xs text-slate-600">Photo — {photo.fileName}</p>
              ))}
            </div>
          )}
          <div className="space-y-4">
            <Select
              label="Document Type"
              value={newDocType}
              onChange={(e) => setNewDocType(e.target.value as DocumentCategory)}
              options={[
                { value: 'Field Report', label: 'Field Report' },
                { value: 'Work Order', label: 'Work Order' },
                { value: 'Power Sanction', label: 'Power Sanction' },
                { value: 'Application', label: 'Application' },
                { value: 'Estimate', label: 'Estimate' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Input label="Add document" type="file" accept=".pdf,image/*" onChange={(e) => setNewDocFile(e.target.files?.[0]?.name || '')} />
          </div>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(`/projects/${project.id}`)} fullWidth disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
