import { Card, CardTitle } from '../ui/Card'
import { formatCompactCurrency } from '../../utils/formatters'
import type { Payment } from '../../types'

// Categorical slot 1 (blue) from the validated default palette — a single series, so no legend needed.
const BAR_COLOR = '#2a78d6'
const MONTHS_SHOWN = 6

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

export function CollectionTrendChart({ payments }: { payments: Payment[] }) {
  const now = new Date()
  const months = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS_SHOWN - 1 - i), 1)
    return { key: monthKey(d), label: d.toLocaleDateString('en-IN', { month: 'short' }) }
  })

  const totalsByMonth = new Map<string, number>()
  for (const payment of payments) {
    const key = monthKey(new Date(payment.date))
    totalsByMonth.set(key, (totalsByMonth.get(key) || 0) + payment.amount)
  }

  const series = months.map((m) => ({ ...m, total: totalsByMonth.get(m.key) || 0 }))
  const maxTotal = Math.max(...series.map((m) => m.total), 1)
  const isEmpty = series.every((m) => m.total === 0)

  return (
    <Card padding="sm">
      <CardTitle className="mb-0.5">Collection trend</CardTitle>
      <p className="text-xs text-slate-500 mb-4">Payments received, last {MONTHS_SHOWN} months</p>

      {isEmpty ? (
        <p className="text-sm text-slate-500 text-center py-8">No payments recorded yet</p>
      ) : (
        <div className="flex items-end justify-between gap-2 h-28">
          {series.map((m) => {
            const heightPercent = Math.max((m.total / maxTotal) * 100, m.total > 0 ? 6 : 0)
            const isCurrent = m.key === monthKey(now)
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <span
                  className={`text-[10px] font-semibold ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}
                  style={{ opacity: m.total > 0 ? 1 : 0 }}
                >
                  {formatCompactCurrency(m.total)}
                </span>
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[24px] rounded-t-[4px] transition-all"
                    style={{
                      height: `${heightPercent}%`,
                      minHeight: m.total > 0 ? 4 : 0,
                      backgroundColor: BAR_COLOR,
                      opacity: isCurrent ? 1 : 0.55,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400">{m.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
