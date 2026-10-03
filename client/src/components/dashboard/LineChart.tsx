interface Dataset {
  data: number[]
  color: string
  label: string
  dashed?: boolean
}

interface LineChartProps {
  labels: string[]
  datasets: Dataset[]
}

export function LineChart({ labels, datasets }: LineChartProps) {
  const allValues = datasets.flatMap(d => d.data)
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const range = maxValue - minValue

  const getY = (value: number) => {
    return 100 - ((value - minValue) / range) * 100
  }

  const createPath = (data: number[]) => {
    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = getY(value)
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`
    }).join(' ')
    return points
  }

  return (
    <div className="relative h-48">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="border-t border-slate-700/30" />
        ))}
      </div>

      {/* Chart */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {datasets.map((dataset, idx) => (
          <g key={idx}>
            <path
              d={createPath(dataset.data)}
              fill="none"
              stroke={dataset.color}
              strokeWidth="0.5"
              strokeDasharray={dataset.dashed ? '2,2' : undefined}
              vectorEffect="non-scaling-stroke"
            />
            {/* Data points */}
            {dataset.data.map((value, i) => {
              const x = (i / (dataset.data.length - 1)) * 100
              const y = getY(value)
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1"
                  fill={dataset.color}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </g>
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-1">
        {labels.map((label, i) => (
          <span key={i} className="text-[10px] text-slate-500">
            {label}
          </span>
        ))}
      </div>

      {/* Hover tooltip placeholder */}
      <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100">
        Max • 68
      </div>
    </div>
  )
}
