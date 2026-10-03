interface DonutData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutData[]
  centerText: string
  centerLabel: string
}

export function DonutChart({ data, centerText, centerLabel }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  let currentAngle = -90 // Start from top

  const segments = data.map(item => {
    const percentage = (item.value / total) * 100
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle

    // Calculate arc path
    const startX = 50 + 35 * Math.cos((startAngle * Math.PI) / 180)
    const startY = 50 + 35 * Math.sin((startAngle * Math.PI) / 180)
    const endX = 50 + 35 * Math.cos((endAngle * Math.PI) / 180)
    const endY = 50 + 35 * Math.sin((endAngle * Math.PI) / 180)
    const largeArc = angle > 180 ? 1 : 0

    return {
      ...item,
      percentage,
      path: `M 50 50 L ${startX} ${startY} A 35 35 0 ${largeArc} 1 ${endX} ${endY} Z`
    }
  })

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-72 h-72 mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Donut segments */}
          {segments.map((segment, i) => (
            <path
              key={i}
              d={segment.path}
              fill={segment.color}
              className="hover:opacity-80 transition-opacity"
            />
          ))}
          {/* Center circle */}
          <circle cx="50" cy="50" r="25" fill="#ffffff" />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-slate-800">{centerText}</div>
          <div className="text-sm text-slate-500 mt-1">{centerLabel}</div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 w-full">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-slate-600">{item.label}</span>
            </div>
            <span className="text-sm font-semibold text-slate-800">
              {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
