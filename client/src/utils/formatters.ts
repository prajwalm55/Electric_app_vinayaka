export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

// Compact Indian-numbering form for chart labels where full currency formatting is too wide.
export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_00_00_000) return `${sign}₹${trimDecimal(abs / 1_00_00_000)}Cr`
  if (abs >= 1_00_000) return `${sign}₹${trimDecimal(abs / 1_00_000)}L`
  if (abs >= 1_000) return `${sign}₹${trimDecimal(abs / 1_000)}K`
  return `${sign}₹${abs}`
}

function trimDecimal(value: number): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getStageIndex(stage: string, stages: readonly string[]): number {
  return stages.indexOf(stage as never)
}
