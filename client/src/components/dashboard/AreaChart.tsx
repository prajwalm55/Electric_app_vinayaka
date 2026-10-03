interface AreaChartProps {
  data: number[]
  currentValue: string
}

export function AreaChart({ data, currentValue }: AreaChartProps) {
  const maxValue = Math.max(...data)
  const minValue = Math.min(...data)
  const range = maxValue - minValue

  const getY = (value: number) => {
    return 100 - ((value - minValue) / range) * 80 - 10 // Leave 10% margin
  }

  // Create smooth area path
  const points = data.map((value, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: getY(value)
  }))

  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ')

  const areaPath = `${linePath} L 100,100 L 0,100 Z`

  return (
    <div className="relative h-48">
      {/* Current value badge */}
      <div className="absolute top-0 left-0 bg-cyan-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
        {currentValue}
      </div>

      {/* Area chart */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1e40af" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Filled area */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="1"
            fill="#06b6d4"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {/* Current value indicator */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="2"
          fill="#06b6d4"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="0.5"
          opacity="0.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  )
}
