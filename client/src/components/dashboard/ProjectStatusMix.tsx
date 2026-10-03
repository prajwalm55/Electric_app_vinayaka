import { Card, CardTitle } from '../ui/Card'
import type { Project, ProjectStatus } from '../../types'

// Project status is a state, not an arbitrary category, so it wears the fixed status
// palette (reserved, never themed) rather than the categorical series order.
const STATUS_ORDER: { status: ProjectStatus; color: string; label: string }[] = [
  { status: 'Active', color: '#2a78d6', label: 'Active' },
  { status: 'Completed', color: '#0ca30c', label: 'Completed' },
  { status: 'On Hold', color: '#fab219', label: 'On hold' },
  { status: 'Cancelled', color: '#d03b3b', label: 'Cancelled' },
]

export function ProjectStatusMix({ projects }: { projects: Project[] }) {
  const total = projects.length
  const counts = STATUS_ORDER.map((s) => ({
    ...s,
    count: projects.filter((p) => p.status === s.status).length,
  })).filter((s) => s.count > 0)

  return (
    <Card padding="sm">
      <CardTitle className="mb-0.5">Project mix</CardTitle>
      <p className="text-xs text-slate-500 mb-4">All {total} project{total === 1 ? '' : 's'}, by status</p>

      {total === 0 ? (
        <p className="text-sm text-slate-500 text-center py-6">No projects yet</p>
      ) : (
        <>
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
            {counts.map((s) => (
              <div
                key={s.status}
                style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
            {counts.map((s) => (
              <div key={s.status} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-slate-600">
                  {s.label} <span className="font-semibold text-slate-800">{s.count}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
