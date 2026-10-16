import { LoaderCircle } from 'lucide-react'
import { Button } from './Button'

export function LoadingState({
  label = 'Loading data...',
  error,
  onRetry,
}: {
  label?: string
  error?: string | null
  onRetry?: () => void
}) {
  if (error) {
    return (
      <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm text-amber-900">{error}</p>
        {onRetry && <Button type="button" onClick={onRetry}>Retry</Button>}
      </div>
    )
  }

  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-slate-200 bg-white p-6">
      <Button type="button" disabled variant="secondary" aria-busy="true">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        {label}
      </Button>
    </div>
  )
}
