import { cn } from '../../utils/formatters'
import type { WorkflowStage } from '../../types'
import { WORKFLOW_STAGES } from '../../types'
import { Check } from 'lucide-react'

interface WorkflowStepperProps {
  currentStage: WorkflowStage
  stages: Record<WorkflowStage, { status: string }>
  compact?: boolean
}

export function WorkflowStepper({ currentStage, stages, compact }: WorkflowStepperProps) {
  const currentIndex = WORKFLOW_STAGES.indexOf(currentStage)

  if (compact) {
    return (
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {WORKFLOW_STAGES.map((stage, i) => {
          const isComplete = stages[stage]?.status === 'Completed' || stages[stage]?.status === 'Approved' || stages[stage]?.status === 'Sanctioned' || stages[stage]?.status === 'Received'
          const isCurrent = stage === currentStage
          return (
            <div key={stage} className="flex items-center shrink-0">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                  isComplete ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-500',
                )}
              >
                {isComplete ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < WORKFLOW_STAGES.length - 1 && (
                <div className={cn('w-4 h-0.5', i < currentIndex ? 'bg-green-400' : 'bg-slate-200')} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {WORKFLOW_STAGES.map((stage, i) => {
        const stageData = stages[stage]
        const isComplete =
          stageData?.status === 'Completed' ||
          stageData?.status === 'Approved' ||
          stageData?.status === 'Sanctioned' ||
          stageData?.status === 'Received'
        const isCurrent = stage === currentStage
        const isLast = i === WORKFLOW_STAGES.length - 1

        return (
          <div key={stage} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  isComplete ? 'bg-green-500 text-white' : isCurrent ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-slate-200 text-slate-500',
                )}
              >
                {isComplete ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {!isLast && (
                <div className={cn('w-0.5 flex-1 min-h-[24px]', isComplete ? 'bg-green-400' : 'bg-slate-200')} />
              )}
            </div>
            <div className={cn('pb-5 flex-1', isLast && 'pb-0')}>
              <p className={cn('text-sm font-medium', isCurrent ? 'text-primary-700' : isComplete ? 'text-green-700' : 'text-slate-600')}>
                {stage}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{stageData?.status || 'Pending'}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
