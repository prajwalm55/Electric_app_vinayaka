import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Users, Plus, Search, Phone, MapPin, ChevronDown, ChevronUp, Pencil, Eye, Trash2, FileDown, ExternalLink, FileText, CheckCircle2, UploadCloud } from 'lucide-react'
import { Header } from '../components/layout/AppLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { EmptyState, Modal, ModalFooter } from '../components/ui/Modal'
import { Tooltip } from '../components/ui/Tooltip'
import { useData } from '../context/DataContext'
import { api } from '../api/client'
import { formatCurrency } from '../utils/formatters'
import { getCustomerPaymentBalance } from '../utils/payments'
import { PaymentBalanceSummary } from '../components/common/PaymentTracker'
import { ProjectWorkCard } from '../components/common/ProjectWorkCard'
import type { ConnectionEntry, Contact, Customer, PropertyDocumentType, PropertyType, SiteClassification } from '../types'

export function CustomersPage() {
  const { customers, properties, projects, payments, deleteCustomer } = useData()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const navigate = useNavigate()

  const deleteBalance = deleteTarget
    ? getCustomerPaymentBalance(projects, payments, deleteTarget.id)
    : null

  const canConfirmDelete =
    deleteTarget != null && deleteConfirmName === deleteTarget.name && !deleting

  const openDeleteModal = (customer: Customer) => {
    setDeleteError('')
    setDeleteConfirmName('')
    setDeleteTarget(customer)
  }

  const resetDeleteModal = () => {
    setDeleteTarget(null)
    setDeleteConfirmName('')
    setDeleteError('')
  }

  const closeDeleteModal = () => {
    if (deleting) return
    resetDeleteModal()
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile.includes(search) ||
      c.village.toLowerCase().includes(search.toLowerCase()) ||
      c.aadhaar.includes(search),
  )

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !canConfirmDelete) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteCustomer(deleteTarget.id)
      resetDeleteModal()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete customer')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <Header title="Customers" subtitle={`${customers.length} total customers`} />

      <div className="px-4 lg:px-6 py-4 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search name, mobile, village..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-[44px]"
            />
          </div>
          <Button onClick={() => navigate('/customers/new')} className="shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={search ? 'Try a different search term' : 'Add your first customer to get started'}
            action={
              !search && (
                <Button onClick={() => navigate('/customers/new')}>
                  <Plus className="w-4 h-4" /> Add Customer
                </Button>
              )
            }
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[11%]" />
                  <col className="w-[13%]" />
                  <col className="w-[8%]" />
                  <col className="w-[8%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left align-middle px-4 py-3 font-semibold text-slate-600">Name</th>
                    <th className="text-left align-middle px-4 py-3 font-semibold text-slate-600">Mobile</th>
                    <th className="text-left align-middle px-4 py-3 font-semibold text-slate-600">Village</th>
                    <th className="text-center align-middle px-4 py-3 font-semibold text-slate-600">Properties</th>
                    <th className="text-center align-middle px-4 py-3 font-semibold text-slate-600">Projects</th>
                    <th className="text-right align-middle px-4 py-3 font-semibold text-slate-600">Amount</th>
                    <th className="text-right align-middle px-4 py-3 font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => {
                    const propCount = properties.filter((p) => p.customerId === customer.id).length
                    const projCount = projects.filter((p) => p.customerId === customer.id).length
                    const customerBalance = getCustomerPaymentBalance(projects, payments, customer.id)

                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 text-left align-middle">
                          <button
                            type="button"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            className="font-medium text-slate-900 hover:text-primary-700 text-left block max-w-full truncate"
                          >
                            {customer.name}
                          </button>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{customer.fatherSpouseName}</p>
                        </td>
                        <td className="px-4 py-3 text-left align-middle text-slate-700 tabular-nums">{customer.mobile}</td>
                        <td className="px-4 py-3 text-left align-middle text-slate-700 truncate">{customer.village}</td>
                        <td className="px-4 py-3 text-center align-middle text-slate-700 tabular-nums">{propCount}</td>
                        <td className="px-4 py-3 text-center align-middle text-slate-700 tabular-nums">{projCount}</td>
                        <td className="px-4 py-3 text-right align-middle whitespace-nowrap">
                          {customerBalance.hasTarget ? (
                            <Tooltip
                              label={
                                customerBalance.remaining > 0
                                  ? `Remaining: ${formatCurrency(customerBalance.remaining)}`
                                  : 'Fully paid'
                              }
                            >
                              <span className="inline-block font-medium text-slate-800 cursor-default tabular-nums">
                                <span className="text-green-700">{formatCurrency(customerBalance.paid)}</span>
                                <span className="text-slate-400 mx-1">/</span>
                                <span>{formatCurrency(customerBalance.agreedTotal!)}</span>
                              </span>
                            </Tooltip>
                          ) : customerBalance.paid > 0 ? (
                            <span className="font-medium text-green-700 tabular-nums">{formatCurrency(customerBalance.paid)}</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right align-middle">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Tooltip label="View">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/customers/${customer.id}`)
                                }}
                                className="p-2 rounded-lg text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
                                aria-label="View customer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip label="Edit">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/customers/${customer.id}/edit`)
                                }}
                                className="p-2 rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
                                aria-label="Edit customer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </Tooltip>
                            <Tooltip label="Delete">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDeleteModal(customer)
                                }}
                                className="p-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                aria-label="Delete customer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={deleteTarget != null}
        onClose={closeDeleteModal}
        title="Delete this customer?"
        size="sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-semibold">This action cannot be undone.</p>
              <p className="mt-1">
                This will permanently delete the customer and all related properties, projects, payments, and documents.
              </p>
            </div>

            {deleteBalance?.hasTarget && deleteBalance.remaining > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-semibold">Outstanding balance</p>
                <p className="mt-1">
                  Remaining due:{' '}
                  <span className="font-bold">{formatCurrency(deleteBalance.remaining)}</span>
                  {' '}(paid {formatCurrency(deleteBalance.paid)} of {formatCurrency(deleteBalance.agreedTotal!)})
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                To confirm, type the customer name exactly as shown below:
              </p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-900 select-all">
                {deleteTarget.name}
              </div>
              <Input
                label="Customer name"
                value={deleteConfirmName}
                onChange={(e) => {
                  setDeleteConfirmName(e.target.value)
                  setDeleteError('')
                }}
                placeholder={deleteTarget.name}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {deleteError && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <ModalFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDeleteModal}
                fullWidth
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteConfirm}
                fullWidth
                disabled={!canConfirmDelete}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete customer'}
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function CustomerFormPage() {
  const navigate = useNavigate()
  const { addCustomer, addContact, addProperty, addDocument, createProject } = useData()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    fatherSpouseName: '',
    mobile: '',
    village: '',
    panchayat: '',
    taluk: '',
    district: 'Chitradurga',
    pinCode: '',
    aadhaar: '',
    pan: '',
  })
  const [aadhaarFileObj, setAadhaarFileObj] = useState<File | null>(null)
  const [panFileObj, setPanFileObj] = useState<File | null>(null)
  const [contacts, setContacts] = useState<
    { name: string; relationship: string; mobile: string; whatsapp: string; notes: string }[]
  >([])
  const [property, setProperty] = useState({
    type: 'Domestic' as PropertyType,
    documentType: 'E-Swathu' as PropertyDocumentType,
    documentNumber: '',
    latitude: '',
    longitude: '',
  })
  const [siteClassification, setSiteClassification] = useState<SiteClassification>('Rural Panchayat')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [connections, setConnections] = useState<Omit<ConnectionEntry, 'id'>[]>([
    { type: 'Domestic', requiredLoad: '1 KW', phase: 'Single', remarks: '' },
  ])

  const addConnectionRow = () => {
    setConnections((prev) => [...prev, { type: 'Domestic', requiredLoad: '1 KW', phase: 'Single', remarks: '' }])
  }

  const updateConnectionRow = (index: number, field: keyof Omit<ConnectionEntry, 'id'>, value: string) => {
    setConnections((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const addContactRow = () => {
    setContacts((prev) => [...prev, { name: '', relationship: 'Son', mobile: '', whatsapp: '', notes: '' }])
  }

  const updateContactRow = (index: number, field: string, value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  const removeContactRow = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.fatherSpouseName.trim()) newErrors.fatherSpouseName = 'Father/Spouse name is required'
    if (!/^[6-9]\d{9}$/.test(form.mobile)) newErrors.mobile = 'Enter valid 10-digit mobile'
    if (!form.village.trim()) newErrors.village = 'Village is required'
    if (!form.panchayat.trim()) newErrors.panchayat = 'Panchayat is required'
    if (!form.taluk.trim()) newErrors.taluk = 'Taluk is required'
    if (!form.district.trim()) newErrors.district = 'District is required'
    if (!/^\d{6}$/.test(form.pinCode)) newErrors.pinCode = 'Enter valid 6-digit PIN'
    if (!/^\d{12}$/.test(form.aadhaar.replace(/\s/g, ''))) newErrors.aadhaar = 'Enter valid 12-digit Aadhaar'
    if (!property.documentNumber.trim()) newErrors.propertyDocumentNumber = 'Property document number is required'

    connections.forEach((conn, i) => {
      if (!conn.requiredLoad.trim()) newErrors[`connection_${i}_load`] = 'Load is required'
    })

    if (totalAmount && (Number.isNaN(Number(totalAmount)) || Number(totalAmount) <= 0)) {
      newErrors.totalAmount = 'Enter a valid total amount'
    }

    contacts.forEach((c, i) => {
      if (!c.name.trim()) newErrors[`contact_${i}_name`] = 'Contact name is required'
      if (c.mobile && !/^[6-9]\d{9}$/.test(c.mobile)) newErrors[`contact_${i}_mobile`] = 'Enter valid mobile'
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      const customer = await addCustomer({
        ...form,
        aadhaar: form.aadhaar.replace(/\s/g, ''),
        pan: form.pan || undefined,
      })

      for (const contact of contacts) {
        if (!contact.name.trim() || !contact.mobile.trim()) continue
        await addContact(customer.id, {
          name: contact.name,
          relationship: contact.relationship,
          mobile: contact.mobile,
          whatsapp: contact.whatsapp || contact.mobile,
          notes: contact.notes,
        })
      }

      const createdProperty = await addProperty({
        customerId: customer.id,
        type: property.type,
        documentType: property.documentType,
        documentNumber: property.documentNumber,
        latitude: property.latitude ? Number(property.latitude) : undefined,
        longitude: property.longitude ? Number(property.longitude) : undefined,
      })

      if (aadhaarFileObj) {
        try {
          const uploadRes = await api.upload(aadhaarFileObj, 'customers', customer.id, 'aadhaar')
          await addDocument({
            type: 'Aadhaar',
            fileName: aadhaarFileObj.name,
            description: 'Customer Aadhaar',
            customerId: customer.id,
            s3Key: uploadRes.s3Key,
            fileUrl: uploadRes.fileUrl,
            fileSize: uploadRes.fileSize,
            mimeType: uploadRes.mimeType,
          })
        } catch (uploadErr) {
          console.error('Failed to upload Aadhaar to S3:', uploadErr)
          await addDocument({
            type: 'Aadhaar',
            fileName: aadhaarFileObj.name,
            description: 'Customer Aadhaar',
            customerId: customer.id,
          })
        }
      }

      if (panFileObj) {
        try {
          const uploadRes = await api.upload(panFileObj, 'customers', customer.id, 'pan')
          await addDocument({
            type: 'PAN',
            fileName: panFileObj.name,
            description: 'Customer PAN card',
            customerId: customer.id,
            s3Key: uploadRes.s3Key,
            fileUrl: uploadRes.fileUrl,
            fileSize: uploadRes.fileSize,
            mimeType: uploadRes.mimeType,
          })
        } catch (uploadErr) {
          console.error('Failed to upload PAN to S3:', uploadErr)
          await addDocument({
            type: 'PAN',
            fileName: panFileObj.name,
            description: 'Customer PAN card',
            customerId: customer.id,
          })
        }
      }

      if (property.documentNumber) {
        await addDocument({
          type: property.documentType === 'Other' ? 'Other' : property.documentType,
          fileName: `${property.documentNumber}.pdf`,
          description: `Property ${property.documentType}`,
          propertyId: createdProperty.id,
          customerId: customer.id,
        })
      }

      const project = await createProject({
        customerId: customer.id,
        propertyId: createdProperty.id,
        siteClassification,
        connections,
        inspectionNotes,
        ...(totalAmount ? { totalAmount: Number(totalAmount) } : {}),
      })

      navigate(`/projects/${project.id}`)
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to save customer' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Header title="New Customer & Project" subtitle="Step 1: Customer · Step 2: Property · Step 3: Project & payment" backTo="/customers" />
      <form onSubmit={handleSubmit} className="px-4 lg:px-6 py-4 space-y-4 max-w-2xl">
        <div className="flex gap-2 text-[10px] font-medium">
          {['Customer', 'Property', 'Project'].map((step, i) => (
            <div key={step} className="flex-1 text-center py-2 rounded-lg bg-primary-50 text-primary-700 border border-primary-100">
              {i + 1}. {step}
            </div>
          ))}
        </div>
        {errors.form && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{errors.form}</div>
        )}

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">1. Personal details</h3>
          <div className="space-y-4">
            <Input label="Customer Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required error={errors.name} />
            <Input label="Father/Spouse Name" value={form.fatherSpouseName} onChange={(e) => handleChange('fatherSpouseName', e.target.value)} required error={errors.fatherSpouseName} />
            <Input label="Mobile / WhatsApp" type="tel" value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} required error={errors.mobile} maxLength={10} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Village" value={form.village} onChange={(e) => handleChange('village', e.target.value)} required error={errors.village} />
              <Input label="Panchayat" value={form.panchayat} onChange={(e) => handleChange('panchayat', e.target.value)} required error={errors.panchayat} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Taluk" value={form.taluk} onChange={(e) => handleChange('taluk', e.target.value)} required error={errors.taluk} />
              <Input label="District" value={form.district} onChange={(e) => handleChange('district', e.target.value)} required error={errors.district} />
            </div>
            <Input label="PIN Code" value={form.pinCode} onChange={(e) => handleChange('pinCode', e.target.value)} required error={errors.pinCode} maxLength={6} />
            <Input label="Aadhaar Number" value={form.aadhaar} onChange={(e) => handleChange('aadhaar', e.target.value)} required error={errors.aadhaar} maxLength={12} />
            <Input label="PAN Number (Optional)" value={form.pan} onChange={(e) => handleChange('pan', e.target.value)} />
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Customer Documents</h3>
          <div className="space-y-4">
            <div>
              <Input
                label="Aadhaar Document (PDF / Image)"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setAadhaarFileObj(e.target.files?.[0] || null)}
              />
              {aadhaarFileObj && (
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for S3 upload: {aadhaarFileObj.name} ({(aadhaarFileObj.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <div>
              <Input
                label="PAN Card Document (PDF / Image - Optional)"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setPanFileObj(e.target.files?.[0] || null)}
              />
              {panFileObj && (
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for S3 upload: {panFileObj.name} ({(panFileObj.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <p className="text-xs text-slate-500">Documents will be uploaded to secure S3 storage and accessible via signed URLs.</p>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Contacts (Optional)</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addContactRow}>
              <Plus className="w-4 h-4" /> Add Contact
            </Button>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-500">No contacts added. Add Son, Spouse, Site Contact, Agent, etc.</p>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="rounded-xl border border-slate-200 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500">Contact {index + 1}</p>
                    <button type="button" className="text-xs text-red-600" onClick={() => removeContactRow(index)}>
                      Remove
                    </button>
                  </div>
                  <Input label="Contact Name" value={contact.name} onChange={(e) => updateContactRow(index, 'name', e.target.value)} required error={errors[`contact_${index}_name`]} />
                  <Select
                    label="Relationship / Role"
                    value={contact.relationship}
                    onChange={(e) => updateContactRow(index, 'relationship', e.target.value)}
                    options={[
                      { value: 'Son', label: 'Son' },
                      { value: 'Spouse', label: 'Spouse' },
                      { value: 'Brother', label: 'Brother' },
                      { value: 'Site Contact', label: 'Site Contact' },
                      { value: 'Agent', label: 'Agent' },
                      { value: 'Other', label: 'Other' },
                    ]}
                  />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Input label="Mobile" type="tel" value={contact.mobile} onChange={(e) => updateContactRow(index, 'mobile', e.target.value)} maxLength={10} error={errors[`contact_${index}_mobile`]} />
                    <Input label="WhatsApp" type="tel" value={contact.whatsapp} onChange={(e) => updateContactRow(index, 'whatsapp', e.target.value)} maxLength={10} />
                  </div>
                  <Input label="Notes" value={contact.notes} onChange={(e) => updateContactRow(index, 'notes', e.target.value)} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">2. Property</h3>
          <div className="space-y-4">
            <Select
              label="Property Type"
              value={property.type}
              onChange={(e) => setProperty((prev) => ({ ...prev, type: e.target.value as PropertyType }))}
              options={[
                { value: 'Domestic', label: 'Domestic' },
                { value: 'Commercial', label: 'Commercial' },
                { value: 'Industrial', label: 'Industrial' },
                { value: 'Agricultural', label: 'Agricultural' },
              ]}
            />
            <Select
              label="Property Document Type"
              value={property.documentType}
              onChange={(e) => setProperty((prev) => ({ ...prev, documentType: e.target.value as PropertyDocumentType }))}
              options={[
                { value: 'E-Swathu', label: 'E-Swathu' },
                { value: 'Khata', label: 'Khata' },
                { value: 'RTC', label: 'RTC' },
                { value: 'Building License', label: 'Building License' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Input
              label="Property Document Number"
              value={property.documentNumber}
              onChange={(e) => {
                setProperty((prev) => ({ ...prev, documentNumber: e.target.value }))
                setErrors((prev) => ({ ...prev, propertyDocumentNumber: '' }))
              }}
              required
              error={errors.propertyDocumentNumber}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Latitude (GPS)"
                type="number"
                step="any"
                value={property.latitude}
                onChange={(e) => setProperty((prev) => ({ ...prev, latitude: e.target.value }))}
                placeholder="13.7963"
              />
              <Input
                label="Longitude (GPS)"
                type="number"
                step="any"
                value={property.longitude}
                onChange={(e) => setProperty((prev) => ({ ...prev, longitude: e.target.value }))}
                placeholder="76.2841"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!navigator.geolocation) return
                navigator.geolocation.getCurrentPosition((pos) => {
                  setProperty((prev) => ({
                    ...prev,
                    latitude: String(pos.coords.latitude),
                    longitude: String(pos.coords.longitude),
                  }))
                })
              }}
            >
              <MapPin className="w-4 h-4" /> Capture Current GPS
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">3. Project & payment</h3>
          <div className="space-y-4">
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
              onChange={(e) => {
                setTotalAmount(e.target.value)
                setErrors((prev) => ({ ...prev, totalAmount: '' }))
              }}
              placeholder="e.g. 50000"
              error={errors.totalAmount}
              min="0"
            />
            <p className="text-xs text-slate-400 -mt-2">Agreed total fee for this project. Used to track paid vs remaining balance.</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Connection Required</p>
              <Button type="button" variant="ghost" size="sm" onClick={addConnectionRow}>
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
            {connections.map((conn, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Select
                    label="Type"
                    value={conn.type}
                    onChange={(e) => updateConnectionRow(i, 'type', e.target.value)}
                    options={[
                      { value: 'Domestic', label: 'Domestic' },
                      { value: 'Commercial', label: 'Commercial' },
                      { value: 'Industrial', label: 'Industrial' },
                      { value: 'Temporary', label: 'Temporary' },
                    ]}
                  />
                  <Input
                    label="Load"
                    value={conn.requiredLoad}
                    onChange={(e) => updateConnectionRow(i, 'requiredLoad', e.target.value)}
                    required
                    error={errors[`connection_${i}_load`]}
                  />
                  <Select
                    label="Phase"
                    value={conn.phase}
                    onChange={(e) => updateConnectionRow(i, 'phase', e.target.value)}
                    options={[
                      { value: 'Single', label: 'Single' },
                      { value: 'Three', label: 'Three' },
                    ]}
                  />
                  <Input
                    label="Remarks"
                    value={conn.remarks}
                    onChange={(e) => updateConnectionRow(i, 'remarks', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <Textarea
              label="Inspection Notes"
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              placeholder="Site visit notes, meter location, etc."
            />
          </div>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} fullWidth disabled={saving}>Cancel</Button>
          <Button type="submit" fullWidth disabled={saving}>{saving ? 'Saving...' : 'Save & Start Project'}</Button>
        </div>
      </form>
    </div>
  )
}

export function CustomerDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { customers, properties, projects, documents, payments, addDocument } = useData()
  const [showProfile, setShowProfile] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadDocType, setUploadDocType] = useState<'Aadhaar' | 'PAN' | 'Other'>('Aadhaar')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const customer = customers.find((c) => c.id === id)

  if (!customer) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Customer not found</p>
        <Link to="/customers" className="text-primary-600 text-sm mt-2 inline-block">Back to customers</Link>
      </div>
    )
  }

  const customerProperties = properties.filter((p) => p.customerId === customer.id)
  const customerProjects = projects.filter((p) => p.customerId === customer.id)
  const propertyIds = new Set(customerProperties.map((p) => p.id))
  const customerDocs = documents.filter(
    (d) => d.customerId === customer.id || (d.propertyId && propertyIds.has(d.propertyId)),
  )
  const customerPayments = payments.filter((p) => p.customerId === customer.id)
  const customerBalance = getCustomerPaymentBalance(projects, payments, customer.id)

  const handleGenerateDocument = async () => {
    setGenerating(true)
    setGenerateError('')
    try {
      await api.download(`/customers/${customer.id}/lighting-form`, `lighting-form-${customer.id}.pdf`)
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate document')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <Header title={customer.name} subtitle={`${customer.village} · ${customer.mobile}`} backTo="/customers" />

      <div className="px-4 lg:px-6 py-4 space-y-4">
        <Button onClick={handleGenerateDocument} fullWidth disabled={generating}>
          <FileDown className="w-4 h-4" />
          {generating ? 'Generating document...' : 'Generate document'}
        </Button>
        {generateError && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{generateError}</div>
        )}

        <Button onClick={() => navigate(`/customers/${customer.id}/edit`)} fullWidth variant="outline">
          <Pencil className="w-4 h-4" /> Edit customer details
        </Button>

        <a
          href={`tel:${customer.mobile}`}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Phone className="w-4 h-4" /> Call {customer.mobile}
        </a>

        <Card padding="sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Overall payment</h3>
          <PaymentBalanceSummary balance={customerBalance} />
        </Card>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Projects & work</h2>
            <Button size="sm" onClick={() => navigate(`/projects/new?customerId=${customer.id}`)}>
              <Plus className="w-4 h-4" /> New
            </Button>
          </div>
          {customerProjects.length === 0 ? (
            <Card padding="sm">
              <p className="text-sm text-slate-500 text-center py-4">No projects yet</p>
              <Button fullWidth onClick={() => navigate(`/projects/new?customerId=${customer.id}`)}>
                Start project
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {customerProjects.map((proj) => (
                <ProjectWorkCard
                  key={proj.id}
                  project={proj}
                  customer={customer}
                  payments={payments}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  showStepper={false}
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowProfile((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
        >
          Customer details & documents
          {showProfile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showProfile && (
          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Personal details</h3>
              <dl className="grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ['Father/Spouse', customer.fatherSpouseName],
                  ['Mobile', customer.mobile],
                  ['Village', customer.village],
                  ['Panchayat', customer.panchayat],
                  ['Taluk', customer.taluk],
                  ['District', customer.district],
                  ['PIN Code', customer.pinCode],
                  ['Aadhaar', customer.aadhaar],
                  ...(customer.pan ? [['PAN', customer.pan]] : []),
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            {customer.contacts.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Contacts</h3>
                {customer.contacts.map((contact) => (
                  <div key={contact.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-xs text-slate-500">{contact.relationship}</p>
                    </div>
                    <p className="text-slate-600">{contact.mobile}</p>
                  </div>
                ))}
              </Card>
            )}

            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Properties</h3>
              {customerProperties.map((prop) => (
                <div key={prop.id} className="py-2 border-b border-slate-100 last:border-0 text-sm">
                  <p className="font-medium">{prop.type} · {prop.documentType}</p>
                  <p className="text-xs text-slate-500">{prop.documentNumber}</p>
                </div>
              ))}
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">Documents</h3>
                  <span className="text-xs text-slate-400">{customerDocs.length} files</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => { setShowUploadModal(true); setUploadError(''); setUploadFile(null) }}>
                  <UploadCloud className="w-4 h-4 mr-1 text-primary-600" /> Upload
                </Button>
              </div>
              {customerDocs.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {customerDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 text-xs truncate">{doc.type}</p>
                          <p className="text-[11px] text-slate-500 truncate">{doc.fileName}</p>
                        </div>
                      </div>
                      {doc.s3Key ? (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const url = await api.getDownloadUrl(doc.s3Key!)
                              window.open(url, '_blank')
                            } catch {
                              alert('Could not generate download link for this document.')
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" /> View / Download
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded shrink-0">
                          Metadata only
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {customerPayments.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">All payments</h3>
                {customerPayments.map((pay) => (
                  <div key={pay.id} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                    <div>
                      <p className="font-medium">{pay.type}</p>
                      <p className="text-xs text-slate-500">{pay.date} · {pay.projectId}</p>
                    </div>
                    <p className="font-semibold text-green-700">{formatCurrency(pay.amount)}</p>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        <Modal
          open={showUploadModal}
          onClose={() => !uploading && setShowUploadModal(false)}
          title="Upload Customer Document"
        >
          <div className="space-y-4">
            {uploadError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                {uploadError}
              </div>
            )}
            <Select
              label="Document Type"
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value as any)}
              options={[
                { value: 'Aadhaar', label: 'Aadhaar Card' },
                { value: 'PAN', label: 'PAN Card' },
                { value: 'Other', label: 'Other Document' },
              ]}
            />
            <Input
              label="Select Document File (PDF / Image)"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            {uploadFile && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for upload: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <p className="text-xs text-slate-400">
              The file will be securely uploaded to Garage S3 storage and linked to {customer.name}.
            </p>
          </div>
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUploadModal(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!uploadFile || uploading}
              onClick={async () => {
                if (!uploadFile) return
                setUploading(true)
                setUploadError('')
                try {
                  const fileType = uploadDocType === 'Aadhaar' ? 'aadhaar' : uploadDocType === 'PAN' ? 'pan' : 'other'
                  const uploadRes = await api.upload(uploadFile, 'customers', customer.id, fileType)
                  await addDocument({
                    type: uploadDocType,
                    fileName: uploadFile.name,
                    description: `Customer ${uploadDocType}`,
                    customerId: customer.id,
                    s3Key: uploadRes.s3Key,
                    fileUrl: uploadRes.fileUrl,
                    fileSize: uploadRes.fileSize,
                    mimeType: uploadRes.mimeType,
                  })
                  setShowUploadModal(false)
                  setUploadFile(null)
                } catch (err) {
                  setUploadError(err instanceof Error ? err.message : 'Upload failed')
                } finally {
                  setUploading(false)
                }
              }}
            >
              {uploading ? 'Uploading...' : 'Upload to Garage S3'}
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  )
}

type PropertyFormRow = {
  id?: string
  type: PropertyType
  documentType: PropertyDocumentType
  documentNumber: string
  latitude: string
  longitude: string
}

type ContactFormRow = {
  id?: string
  name: string
  relationship: string
  mobile: string
  whatsapp: string
  notes: string
}

export function CustomerEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { customers, properties, documents, updateCustomer, replaceContacts, addProperty, updateProperty, addDocument } = useData()
  const customer = customers.find((c) => c.id === id)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [form, setForm] = useState({
    name: '',
    fatherSpouseName: '',
    mobile: '',
    village: '',
    panchayat: '',
    taluk: '',
    district: 'Chitradurga',
    pinCode: '',
    aadhaar: '',
    pan: '',
  })
  const [contacts, setContacts] = useState<ContactFormRow[]>([])
  const [propertyRows, setPropertyRows] = useState<PropertyFormRow[]>([])
  const [aadhaarFileObj, setAadhaarFileObj] = useState<File | null>(null)
  const [panFileObj, setPanFileObj] = useState<File | null>(null)

  const customerProperties = properties.filter((p) => p.customerId === id)
  const propertyIds = new Set(customerProperties.map((p) => p.id))
  const customerDocs = documents.filter(
    (d) => d.customerId === id || (d.propertyId && propertyIds.has(d.propertyId)),
  )
  const loadedForId = useRef<string | null>(null)

  useEffect(() => {
    loadedForId.current = null
    setInitialized(false)
  }, [id])

  useEffect(() => {
    if (!customer || !id || loadedForId.current === id) return

    setForm({
      name: customer.name,
      fatherSpouseName: customer.fatherSpouseName,
      mobile: customer.mobile,
      village: customer.village,
      panchayat: customer.panchayat,
      taluk: customer.taluk,
      district: customer.district,
      pinCode: customer.pinCode,
      aadhaar: customer.aadhaar,
      pan: customer.pan || '',
    })
    setContacts(
      customer.contacts.map((c) => ({
        id: c.id,
        name: c.name,
        relationship: c.relationship,
        mobile: c.mobile,
        whatsapp: c.whatsapp,
        notes: c.notes,
      })),
    )
    setPropertyRows(
      customerProperties.map((p) => ({
        id: p.id,
        type: p.type,
        documentType: p.documentType,
        documentNumber: p.documentNumber,
        latitude: p.latitude != null ? String(p.latitude) : '',
        longitude: p.longitude != null ? String(p.longitude) : '',
      })),
    )
    loadedForId.current = id
    setInitialized(true)
  }, [customer, id, customerProperties, properties])

  const editBackTo = '/customers'

  if (!customer) {
    return (
      <div>
        <Header title="Edit Customer" subtitle="Customer not found" backTo="/customers" />
        <div className="p-6 text-center">
          <p className="text-slate-500">Customer not found</p>
          <Link to="/customers" className="text-primary-600 text-sm mt-2 inline-block">Back to customers</Link>
        </div>
      </div>
    )
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const addContactRow = () => {
    setContacts((prev) => [...prev, { name: '', relationship: 'Son', mobile: '', whatsapp: '', notes: '' }])
  }

  const updateContactRow = (index: number, field: string, value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  }

  const removeContactRow = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index))
  }

  const addPropertyRow = () => {
    setPropertyRows((prev) => [
      ...prev,
      { type: 'Domestic', documentType: 'E-Swathu', documentNumber: '', latitude: '', longitude: '' },
    ])
  }

  const updatePropertyRow = (index: number, field: keyof PropertyFormRow, value: string) => {
    setPropertyRows((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  const removePropertyRow = (index: number) => {
    setPropertyRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!form.name.trim()) newErrors.name = 'Name is required'
    if (!form.fatherSpouseName.trim()) newErrors.fatherSpouseName = 'Father/Spouse name is required'
    if (!/^[6-9]\d{9}$/.test(form.mobile)) newErrors.mobile = 'Enter valid 10-digit mobile'
    if (!form.village.trim()) newErrors.village = 'Village is required'
    if (!form.panchayat.trim()) newErrors.panchayat = 'Panchayat is required'
    if (!form.taluk.trim()) newErrors.taluk = 'Taluk is required'
    if (!form.district.trim()) newErrors.district = 'District is required'
    if (!/^\d{6}$/.test(form.pinCode)) newErrors.pinCode = 'Enter valid 6-digit PIN'
    if (!/^\d{12}$/.test(form.aadhaar.replace(/\s/g, ''))) newErrors.aadhaar = 'Enter valid 12-digit Aadhaar'

    propertyRows.forEach((p, i) => {
      if (!p.documentNumber.trim()) newErrors[`property_${i}_doc`] = 'Document number is required'
    })

    contacts.forEach((c, i) => {
      if (c.name.trim() && c.mobile && !/^[6-9]\d{9}$/.test(c.mobile)) {
        newErrors[`contact_${i}_mobile`] = 'Enter valid mobile'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      await updateCustomer(customer.id, {
        ...form,
        aadhaar: form.aadhaar.replace(/\s/g, ''),
        pan: form.pan || undefined,
      })

      const validContacts = contacts.filter((c) => c.name.trim() && c.mobile.trim())
      await replaceContacts(
        customer.id,
        validContacts.map((c) => ({
          ...(c.id ? { id: c.id } : {}),
          name: c.name,
          relationship: c.relationship,
          mobile: c.mobile,
          whatsapp: c.whatsapp || c.mobile,
          notes: c.notes,
        })) as Contact[],
      )

      for (const row of propertyRows) {
        const payload = {
          type: row.type,
          documentType: row.documentType,
          documentNumber: row.documentNumber,
          latitude: row.latitude ? Number(row.latitude) : undefined,
          longitude: row.longitude ? Number(row.longitude) : undefined,
        }
        if (row.id) {
          await updateProperty(row.id, payload)
        } else {
          await addProperty({ customerId: customer.id, ...payload })
        }
      }

      if (aadhaarFileObj) {
        try {
          const uploadRes = await api.upload(aadhaarFileObj, 'customers', customer.id, 'aadhaar')
          await addDocument({
            type: 'Aadhaar',
            fileName: aadhaarFileObj.name,
            description: 'Customer Aadhaar',
            customerId: customer.id,
            s3Key: uploadRes.s3Key,
            fileUrl: uploadRes.fileUrl,
            fileSize: uploadRes.fileSize,
            mimeType: uploadRes.mimeType,
          })
        } catch (uploadErr) {
          console.error('Failed to upload Aadhaar to S3:', uploadErr)
          await addDocument({ type: 'Aadhaar', fileName: aadhaarFileObj.name, description: 'Customer Aadhaar', customerId: customer.id })
        }
      }
      if (panFileObj) {
        try {
          const uploadRes = await api.upload(panFileObj, 'customers', customer.id, 'pan')
          await addDocument({
            type: 'PAN',
            fileName: panFileObj.name,
            description: 'Customer PAN card',
            customerId: customer.id,
            s3Key: uploadRes.s3Key,
            fileUrl: uploadRes.fileUrl,
            fileSize: uploadRes.fileSize,
            mimeType: uploadRes.mimeType,
          })
        } catch (uploadErr) {
          console.error('Failed to upload PAN to S3:', uploadErr)
          await addDocument({ type: 'PAN', fileName: panFileObj.name, description: 'Customer PAN card', customerId: customer.id })
        }
      }

      navigate(`/customers/${customer.id}`)
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  if (!initialized) {
    return (
      <div>
        <Header title="Edit Customer" subtitle={customer.name} backTo={editBackTo} />
        <div className="p-6 text-center text-slate-500 text-sm">Loading customer...</div>
      </div>
    )
  }

  return (
    <div>
      <Header title="Edit Customer" subtitle={customer.name} backTo={editBackTo} />
      <form onSubmit={handleSubmit} className="px-4 lg:px-6 py-4 space-y-4 max-w-2xl">
        {errors.form && (
          <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{errors.form}</div>
        )}

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Personal details</h3>
          <div className="space-y-4">
            <Input label="Customer Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required error={errors.name} />
            <Input label="Father/Spouse Name" value={form.fatherSpouseName} onChange={(e) => handleChange('fatherSpouseName', e.target.value)} required error={errors.fatherSpouseName} />
            <Input label="Mobile / WhatsApp" type="tel" value={form.mobile} onChange={(e) => handleChange('mobile', e.target.value)} required error={errors.mobile} maxLength={10} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Village" value={form.village} onChange={(e) => handleChange('village', e.target.value)} required error={errors.village} />
              <Input label="Panchayat" value={form.panchayat} onChange={(e) => handleChange('panchayat', e.target.value)} required error={errors.panchayat} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Taluk" value={form.taluk} onChange={(e) => handleChange('taluk', e.target.value)} required error={errors.taluk} />
              <Input label="District" value={form.district} onChange={(e) => handleChange('district', e.target.value)} required error={errors.district} />
            </div>
            <Input label="PIN Code" value={form.pinCode} onChange={(e) => handleChange('pinCode', e.target.value)} required error={errors.pinCode} maxLength={6} />
            <Input label="Aadhaar Number" value={form.aadhaar} onChange={(e) => handleChange('aadhaar', e.target.value)} required error={errors.aadhaar} maxLength={12} />
            <Input label="PAN Number (Optional)" value={form.pan} onChange={(e) => handleChange('pan', e.target.value)} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Contacts</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addContactRow}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-500">No contacts. Tap Add to create one.</p>
          ) : (
            contacts.map((contact, index) => (
              <div key={contact.id || `new-${index}`} className="rounded-xl border border-slate-200 p-3 space-y-3 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">Contact {index + 1}</p>
                  <button type="button" className="text-xs text-red-600" onClick={() => removeContactRow(index)}>Remove</button>
                </div>
                <Input label="Name" value={contact.name} onChange={(e) => updateContactRow(index, 'name', e.target.value)} />
                <Select label="Relationship" value={contact.relationship} onChange={(e) => updateContactRow(index, 'relationship', e.target.value)} options={[
                  { value: 'Son', label: 'Son' }, { value: 'Spouse', label: 'Spouse' }, { value: 'Brother', label: 'Brother' },
                  { value: 'Site Contact', label: 'Site Contact' }, { value: 'Agent', label: 'Agent' }, { value: 'Other', label: 'Other' },
                ]} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Mobile" type="tel" value={contact.mobile} onChange={(e) => updateContactRow(index, 'mobile', e.target.value)} maxLength={10} error={errors[`contact_${index}_mobile`]} />
                  <Input label="WhatsApp" type="tel" value={contact.whatsapp} onChange={(e) => updateContactRow(index, 'whatsapp', e.target.value)} maxLength={10} />
                </div>
                <Input label="Notes" value={contact.notes} onChange={(e) => updateContactRow(index, 'notes', e.target.value)} />
              </div>
            ))
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Properties</h3>
            <Button type="button" variant="ghost" size="sm" onClick={addPropertyRow}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          {propertyRows.length === 0 ? (
            <p className="text-sm text-slate-500">No properties. Tap Add to create one.</p>
          ) : (
            propertyRows.map((prop, index) => (
              <div key={prop.id || `new-${index}`} className="rounded-xl border border-slate-200 p-3 space-y-3 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">{prop.id || `New property ${index + 1}`}</p>
                  {!prop.id && (
                    <button type="button" className="text-xs text-red-600" onClick={() => removePropertyRow(index)}>Remove</button>
                  )}
                </div>
                <Select label="Property Type" value={prop.type} onChange={(e) => updatePropertyRow(index, 'type', e.target.value)} options={[
                  { value: 'Domestic', label: 'Domestic' }, { value: 'Commercial', label: 'Commercial' },
                  { value: 'Industrial', label: 'Industrial' }, { value: 'Agricultural', label: 'Agricultural' },
                ]} />
                <Select label="Document Type" value={prop.documentType} onChange={(e) => updatePropertyRow(index, 'documentType', e.target.value)} options={[
                  { value: 'E-Swathu', label: 'E-Swathu' }, { value: 'Khata', label: 'Khata' }, { value: 'RTC', label: 'RTC' },
                  { value: 'Building License', label: 'Building License' }, { value: 'Other', label: 'Other' },
                ]} />
                <Input label="Document Number" value={prop.documentNumber} onChange={(e) => updatePropertyRow(index, 'documentNumber', e.target.value)} required error={errors[`property_${index}_doc`]} />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Latitude" type="number" step="any" value={prop.latitude} onChange={(e) => updatePropertyRow(index, 'latitude', e.target.value)} />
                  <Input label="Longitude" type="number" step="any" value={prop.longitude} onChange={(e) => updatePropertyRow(index, 'longitude', e.target.value)} />
                </div>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Add documents</h3>
          {customerDocs.length > 0 && (
            <div className="mb-4 space-y-1">
              <p className="text-xs text-slate-500 mb-2">Existing documents:</p>
              {customerDocs.map((doc) => (
                <p key={doc.id} className="text-xs text-slate-600">{doc.type} — {doc.fileName}</p>
              ))}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <Input
                label="Upload New Aadhaar (PDF / Image)"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setAadhaarFileObj(e.target.files?.[0] || null)}
              />
              {aadhaarFileObj && (
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for S3 upload: {aadhaarFileObj.name} ({(aadhaarFileObj.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
            <div>
              <Input
                label="Upload New PAN Card (PDF / Image)"
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setPanFileObj(e.target.files?.[0] || null)}
              />
              {panFileObj && (
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready for S3 upload: {panFileObj.name} ({(panFileObj.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          </div>
        </Card>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(`/customers/${customer.id}`)} fullWidth disabled={saving}>Cancel</Button>
          <Button type="submit" fullWidth disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
        </div>
      </form>
    </div>
  )
}
