interface MetricCardProps {
  title: string
  mainValue: string
  mainUnit: string
  secondaryValue: string
  secondaryUnit: string
  gradient: string
  onClick?: () => void
}

export function MetricCard({
  title,
  mainValue,
  mainUnit,
  secondaryValue,
  secondaryUnit,
  gradient,
  onClick
}: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-left hover:scale-[1.02] transition-transform shadow-lg`}
    >
      <div className="text-white/90 text-sm font-medium mb-4">{title}</div>
      <div className="flex items-baseline gap-3">
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-white">{mainValue}</span>
          <span className="text-2xl font-medium text-white/80 ml-1">{mainUnit}</span>
        </div>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-white">{secondaryValue}</span>
          <span className="text-xl font-medium text-white/80 ml-1">{secondaryUnit}</span>
        </div>
      </div>
    </button>
  )
}
