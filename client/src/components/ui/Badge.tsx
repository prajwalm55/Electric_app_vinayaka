import { cn } from '../../utils/formatters'

const colorMap: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  'Inspection Pending': 'bg-amber-100 text-amber-700',
  'Inspection Completed': 'bg-teal-100 text-teal-700',
  'Fee Discussion': 'bg-orange-100 text-orange-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-slate-100 text-slate-600',
  'Converted to Project': 'bg-purple-100 text-purple-700',
  Active: 'bg-primary-100 text-primary-700',
  Completed: 'bg-green-100 text-green-700',
  'On Hold': 'bg-amber-100 text-amber-700',
  Pending: 'bg-slate-100 text-slate-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  Submitted: 'bg-indigo-100 text-indigo-700',
  Sanctioned: 'bg-green-100 text-green-700',
  Processing: 'bg-amber-100 text-amber-700',
  Received: 'bg-green-100 text-green-700',
  'Waiting for Inspection': 'bg-amber-100 text-amber-700',
  'Inspection Scheduled': 'bg-blue-100 text-blue-700',
  'Correction Required': 'bg-red-100 text-red-700',
}

export function Badge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        colorMap[status] || 'bg-slate-100 text-slate-600',
        className,
      )}
    >
      {status}
    </span>
  )
}
