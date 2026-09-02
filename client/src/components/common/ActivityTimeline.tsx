import { formatDateTime } from '../../utils/formatters'
import type { ActivityEntry } from '../../types'

export function ActivityTimeline({ activities }: { activities: ActivityEntry[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">No activity yet</p>
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, i) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0 mt-1.5" />
            {i < activities.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{activity.type}</p>
            <p className="text-sm text-slate-600 mt-0.5">{activity.description}</p>
            <p className="text-xs text-slate-400 mt-1">{formatDateTime(activity.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
