import { Card } from '../ui/Card'
import { cn } from '../../utils/formatters'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate'
  onClick?: () => void
}

const colors = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  slate: 'bg-slate-100 text-slate-600',
}

export function StatCard({ label, value, icon: Icon, color = 'blue', onClick }: StatCardProps) {
  return (
    <Card onClick={onClick} padding="sm" className="flex items-center gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 truncate">{label}</p>
      </div>
    </Card>
  )
}
