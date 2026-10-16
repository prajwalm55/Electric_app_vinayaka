import { LoaderCircle } from 'lucide-react'
import { Button } from './Button'

export function LoadingState({ label = 'Loading data...' }: { label?: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-slate-200 bg-white p-6">
      <Button type="button" disabled variant="secondary" aria-busy="true">
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        {label}
      </Button>
    </div>
  )
}
