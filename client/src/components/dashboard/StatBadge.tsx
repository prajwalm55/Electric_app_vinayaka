interface StatBadgeProps {
  icon: string
  label: string
  value: number
  change: string
  variant: 'purple' | 'blue'
}

export function StatBadge({ icon, label, value, change, variant }: StatBadgeProps) {
  const bgColor = variant === 'purple' ? 'bg-purple-500/10' : 'bg-blue-500/10'
  const borderColor = variant === 'purple' ? 'border-purple-500/20' : 'border-blue-500/20'
  const iconBg = variant === 'purple' ? 'bg-purple-500/20' : 'bg-blue-500/20'
  const changeColor = variant === 'purple' ? 'text-purple-400' : 'text-blue-400'

  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-3 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <div className={`${iconBg} w-10 h-10 rounded-lg flex items-center justify-center text-xl`}>
          {icon}
        </div>
        <div>
          <div className="text-white font-semibold">{label}</div>
          <div className={`text-xs ${changeColor} font-medium`}>{change}</div>
        </div>
      </div>
      <div className="text-white text-xl font-bold">{value}</div>
    </div>
  )
}
