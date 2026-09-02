import { ChevronRight, Phone } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { PaymentBalanceSummary } from './PaymentTracker'
import { WorkflowStepper } from './WorkflowStepper'
import type { Customer, Payment, Project } from '../../types'
import { getProjectPaymentBalance } from '../../utils/payments'

interface ProjectWorkCardProps {
  project: Project
  customer?: Customer
  payments: Payment[]
  onClick: () => void
  showStepper?: boolean
}

export function ProjectWorkCard({ project, customer, payments, onClick, showStepper = true }: ProjectWorkCardProps) {
  const balance = getProjectPaymentBalance(project, payments)
  const current = project.stages[project.currentStage]

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 hover:border-primary-200 hover:shadow-sm transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{customer?.name || 'Unknown customer'}</p>
          <p className="text-sm text-primary-600 font-medium mt-0.5">{project.currentStage}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {customer?.village} · {project.id}
            {current?.status ? ` · ${current.status}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge status={project.status} />
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </div>
      </div>

      {showStepper && (
        <div className="mt-3">
          <WorkflowStepper currentStage={project.currentStage} stages={project.stages} compact />
        </div>
      )}

      <div className="mt-3">
        <PaymentBalanceSummary balance={balance} size="sm" />
      </div>

      {customer?.mobile && (
        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1">
          <Phone className="w-3 h-3" /> {customer.mobile}
        </p>
      )}
    </button>
  )
}
