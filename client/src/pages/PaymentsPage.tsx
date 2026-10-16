import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Plus, Search } from 'lucide-react'
import { Header } from '../components/layout/AppLayout'
import { Card, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { Modal, ModalFooter } from '../components/ui/Modal'
import { LoadingState } from '../components/ui/LoadingState'
import { PaymentTypeBreakdown, PaymentBalanceSummary } from '../components/common/PaymentTracker'
import { useData } from '../context/DataContext'
import { formatCurrency } from '../utils/formatters'
import { buildCustomerPaymentSummaries } from '../utils/payments'
import type { PaymentCategory, PaymentMode } from '../types'

export function PaymentsPage() {
  const navigate = useNavigate()
  const { payments, projects, customers, addPayment, loading } = useData()
  const [showModal, setShowModal] = useState(false)
  const [customerFilter, setCustomerFilter] = useState('')
  const [form, setForm] = useState({
    customerId: '',
    projectId: '',
    type: 'Customer Advance' as PaymentCategory,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    mode: 'UPI' as PaymentMode,
    referenceNumber: '',
    remarks: '',
  })

  const summaries = useMemo(
    () => buildCustomerPaymentSummaries(payments, customers, projects),
    [payments, customers, projects],
  )

  const filteredSummaries = customerFilter
    ? summaries.filter((s) => s.customer.id === customerFilter)
    : summaries

  const customerProjects = projects.filter((p) => p.customerId === form.customerId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customerId || !form.projectId || !form.amount) return

    await addPayment({
      projectId: form.projectId,
      customerId: form.customerId,
      type: form.type,
      amount: Number(form.amount),
      date: form.date,
      mode: form.mode,
      referenceNumber: form.referenceNumber,
      remarks: form.remarks,
    })

    setShowModal(false)
    setForm({
      customerId: '',
      projectId: '',
      type: 'Customer Advance',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      mode: 'UPI',
      referenceNumber: '',
      remarks: '',
    })
  }

  return (
    <div>
      <Header title="Payments" subtitle="Total · Paid · Remaining for each customer & project" />

      <div className="px-4 lg:px-6 py-4 space-y-4">
        <Button onClick={() => setShowModal(true)} fullWidth>
          <Plus className="w-4 h-4" /> Record Payment
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-11 appearance-none"
          >
            <option value="">All customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.village}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingState label="Loading payments..." />
        ) : filteredSummaries.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No payments for this selection</p>
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" /> Record First Payment
              </Button>
            </div>
          </Card>
        ) : (
          filteredSummaries.map((summary) => (
            <Card key={summary.customer.id}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <CardTitle className="truncate">{summary.customer.name}</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5 break-words">{summary.customer.mobile} · {summary.customer.village}</p>
                </div>
                <p className="text-xs text-slate-500 shrink-0">{summary.paymentCount} payment(s)</p>
              </div>

              {summary.projects.length > 1 && (
                <PaymentBalanceSummary balance={summary.balance} />
              )}

              <div className={`space-y-3 ${summary.projects.length > 1 ? 'mt-4' : ''}`}>
                {summary.projects.map(({ project, payments: projectPayments, balance }) => (
                  <div key={project.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div
                      className="flex items-center justify-between px-3 py-2.5 bg-slate-50 cursor-pointer hover:bg-slate-100"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div>
                        <p className="text-sm font-semibold text-primary-600">{project.id}</p>
                        <p className="text-xs text-slate-500">{project.currentStage}</p>
                      </div>
                    </div>

                    <div className="px-3 py-3 space-y-3">
                      <PaymentBalanceSummary balance={balance} size="sm" />
                      {projectPayments.length > 0 && (
                        <>
                          <PaymentTypeBreakdown payments={projectPayments} />
                          <div className="space-y-1">
                            {projectPayments.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-slate-900 break-words">{payment.type}</p>
                                  <p className="text-xs text-slate-500 break-words">{payment.date} · {payment.mode}</p>
                                  {payment.referenceNumber && (
                                    <p className="text-[10px] text-slate-400">Ref: {payment.referenceNumber}</p>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-green-700 shrink-0">{formatCurrency(payment.amount)}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {projectPayments.length === 0 && !balance.hasTarget && (
                      <p className="text-xs text-slate-400 px-3 pb-3">No payments recorded for this project yet</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Customer"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value, projectId: '' })}
            required
            options={[
              { value: '', label: 'Select customer' },
              ...customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.village}` })),
            ]}
          />
          <Select
            label="Project"
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
            required
            options={[
              { value: '', label: form.customerId ? 'Select project' : 'Select customer first' },
              ...customerProjects.map((p) => ({ value: p.id, label: `${p.id} · ${p.currentStage}` })),
            ]}
          />
          <Select
            label="Payment Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as PaymentCategory })}
            options={[
              { value: 'VEEW Service Charges', label: 'VEEW Service Charges' },
              { value: 'ESCOM Fees', label: 'ESCOM Fees' },
              { value: 'Meter Cost', label: 'Meter Cost' },
              { value: 'Customer Advance', label: 'Customer Advance' },
              { value: 'Final Customer Payment', label: 'Final Customer Payment' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <Input label="Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0" />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Select
            label="Payment Mode"
            value={form.mode}
            onChange={(e) => setForm({ ...form, mode: e.target.value as PaymentMode })}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Other', label: 'Other' },
            ]}
          />
          <Input label="Reference Number" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
          <Textarea label="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          <ModalFooter>
            <Button type="button" variant="outline" onClick={() => setShowModal(false)} fullWidth>Cancel</Button>
            <Button type="submit" fullWidth>Save Payment</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  )
}
