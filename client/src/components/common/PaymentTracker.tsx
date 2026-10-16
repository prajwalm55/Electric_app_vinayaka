import { ChevronRight, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardTitle } from '../ui/Card'
import { formatCurrency, formatDate } from '../../utils/formatters'
import type { CustomerPaymentSummary, PaymentBalance } from '../../utils/payments'
import type { Payment } from '../../types'

interface PaymentTrackerProps {
  summaries: CustomerPaymentSummary[]
  title?: string
  compact?: boolean
  showCustomerLink?: boolean
  onProjectClick?: (projectId: string) => void
}

export function PaymentBalanceSummary({
  balance,
  size = 'md',
}: {
  balance: PaymentBalance
  size?: 'sm' | 'md' | 'lg'
}) {
  const { agreedTotal, paid, remaining, hasTarget, progressPercent } = balance

  if (!hasTarget && paid === 0) {
    return <p className="text-xs text-slate-500">No payment target set</p>
  }

  const labelClass = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const valueClass = size === 'lg' ? 'text-lg font-bold' : size === 'sm' ? 'text-xs font-semibold' : 'text-sm font-bold'

  return (
    <div className="space-y-2">
      {hasTarget && (
        <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
          <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-2">
            <p className={`${labelClass} text-slate-500`}>Total</p>
            <p className={`${valueClass} break-words text-slate-900`}>{formatCurrency(agreedTotal!)}</p>
          </div>
          <div className="min-w-0 rounded-lg bg-green-50 px-2.5 py-2">
            <p className={`${labelClass} text-green-700`}>Paid</p>
            <p className={`${valueClass} break-words text-green-800`}>{formatCurrency(paid)}</p>
          </div>
          <div className="min-w-0 rounded-lg bg-amber-50 px-2.5 py-2">
            <p className={`${labelClass} text-amber-700`}>Remaining</p>
            <p className={`${valueClass} break-words text-amber-800`}>{formatCurrency(remaining)}</p>
          </div>
        </div>
      )}

      {!hasTarget && paid > 0 && (
        <div className="rounded-lg bg-green-50 px-3 py-2">
          <p className={`${labelClass} text-green-700`}>Paid so far</p>
          <p className={`${valueClass} text-green-800`}>{formatCurrency(paid)}</p>
        </div>
      )}

      {hasTarget && (
        <div>
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>{progressPercent}% collected</span>
            {remaining === 0 && <span className="text-green-600 font-medium">Fully paid</span>}
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${remaining === 0 ? 'bg-green-500' : 'bg-primary-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function PaymentTracker({
  summaries,
  title = 'Payment Tracking',
  compact = false,
  showCustomerLink = true,
  onProjectClick,
}: PaymentTrackerProps) {
  const navigate = useNavigate()

  if (summaries.length === 0) {
    return (
      <Card>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-slate-500 py-4 text-center">No payment targets or payments yet</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-3 space-y-4">
        {summaries.map(({ customer, projects, balance, paymentCount }) => (
          <div key={customer.id} className="rounded-xl border border-slate-200 overflow-hidden">
            <div
              className={`px-3 pt-3 pb-2 bg-slate-50 ${showCustomerLink ? 'cursor-pointer hover:bg-slate-100' : ''}`}
              onClick={showCustomerLink ? () => navigate(`/customers/${customer.id}`) : undefined}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.village} · {paymentCount} payment(s)</p>
                </div>
                {showCustomerLink && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
              </div>
              <PaymentBalanceSummary balance={balance} size="sm" />
            </div>

            {projects.length > 1 && (
              <div className="divide-y divide-slate-100">
                {projects.map(({ project, payments, balance: projectBalance }) => (
                  <div key={project.id} className="px-3 py-2">
                    <div
                      className="flex items-center justify-between cursor-pointer hover:opacity-80"
                      onClick={() => (onProjectClick ? onProjectClick(project.id) : navigate(`/projects/${project.id}`))}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary-600">{project.id}</p>
                        <p className="text-xs text-slate-500">{project.currentStage} · {project.status}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <PaymentBalanceSummary balance={projectBalance} size="sm" />
                    </div>

                    {!compact && payments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {payments.map((payment) => (
                          <PaymentRow key={payment.id} payment={payment} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {projects.length === 1 && (
              <div className="divide-y divide-slate-100">
                {projects.map(({ project, payments }) => (
                  <div key={project.id} className="px-3 py-2">
                    <div
                      className="flex items-center justify-between cursor-pointer hover:opacity-80"
                      onClick={() => (onProjectClick ? onProjectClick(project.id) : navigate(`/projects/${project.id}`))}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary-600">{project.id}</p>
                        <p className="text-xs text-slate-500">{project.currentStage} · {project.status}</p>
                      </div>
                    </div>

                    {!compact && payments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {payments.map((payment) => (
                          <PaymentRow key={payment.id} payment={payment} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export function PaymentRow({ payment }: { payment: Payment }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 pl-2 border-l-2 border-green-100">
      <div className="flex items-start gap-2 min-w-0">
        <CreditCard className="w-3.5 h-3.5 text-green-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-800 truncate">{payment.type}</p>
          <p className="text-[10px] text-slate-400">{formatDate(payment.date)} · {payment.mode}</p>
        </div>
      </div>
      <p className="text-xs font-semibold text-green-700 shrink-0 whitespace-nowrap">{formatCurrency(payment.amount)}</p>
    </div>
  )
}

export function PaymentTypeBreakdown({ payments }: { payments: Payment[] }) {
  const byType = payments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.type] = (acc[payment.type] || 0) + payment.amount
    return acc
  }, {})

  const entries = Object.entries(byType)
  if (entries.length === 0) return null

  return (
    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
      {entries.map(([type, amount]) => (
        <div key={type} className="rounded-lg bg-green-50 px-3 py-2">
          <p className="text-[10px] text-green-700 font-medium truncate">{type}</p>
          <p className="text-sm font-bold text-green-800">{formatCurrency(amount)}</p>
        </div>
      ))}
    </div>
  )
}
