interface BarChartProps {
  labels: string[]
  data: number[]
}

export function BarChart({ labels, data }: BarChartProps) {
  const maxValue = Math.max(...data, 1) // Ensure at least 1 to avoid division by zero

  return (
    <div className="h-52 mt-6">
      <div className="h-full flex items-end justify-between gap-2">
        {data.map((value, i) => {
          const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0
          const isHighest = value === maxValue && value > 0

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex justify-center items-end h-full">
                {value > 0 ? (
                  <div
                    className="w-full max-w-8 rounded-t-lg transition-all relative group"
                    style={{
                      height: `${Math.max(heightPercent, 8)}%`,
                      background: isHighest
                        ? 'linear-gradient(to top, #3b82f6, #06b6d4)'
                        : 'linear-gradient(to top, #cbd5e1, #94a3b8)',
                    }}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      ₹{value.toLocaleString('en-IN')}
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-8 h-1 bg-slate-200 rounded" />
                )}
              </div>
              <span className="text-xs text-slate-600">{labels[i]}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
