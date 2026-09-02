import { Link } from 'react-router-dom'
import { cn } from '../../utils/formatters'

const sizeClasses = {
  /** Mobile header — compact mark */
  xs: 'h-7 w-auto max-w-[88px]',
  sm: 'h-9 w-auto max-w-[110px]',
  /** Default inline usage */
  md: 'h-11 w-auto max-w-[140px]',
  lg: 'h-14 w-auto max-w-[180px]',
  xl: 'h-[4.25rem] w-auto max-w-[240px]',
  /** Sidebar — fills width, caps height */
  sidebar: 'w-auto max-w-full h-auto max-h-[88px] mx-auto',
}

interface LogoProps {
  size?: keyof typeof sizeClasses
  className?: string
  linked?: boolean
}

export function Logo({ size = 'md', className, linked = false }: LogoProps) {
  const image = (
    <img
      src="/logo.jpg"
      alt="Vinayaka Electricals"
      className={cn('object-contain block', sizeClasses[size], className)}
    />
  )

  if (linked) {
    return (
      <Link
        to="/"
        className={cn(
          'shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300/60 rounded-lg',
          size === 'sidebar' ? 'block w-full' : 'inline-flex',
        )}
        aria-label="Go to home"
      >
        {image}
      </Link>
    )
  }

  return image
}
