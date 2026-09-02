import { cn } from '../../utils/formatters'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ children, className, onClick, padding = 'md' }: CardProps) {
  const paddings = { sm: 'p-3', md: 'p-4', lg: 'p-6' }
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/80 shadow-sm',
        paddings[padding],
        onClick && 'cursor-pointer hover:border-primary-200 hover:shadow-md transition-all active:scale-[0.99]',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-semibold text-slate-900', className)}>{children}</h3>
}
