import { clsx } from 'clsx'

interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-4',
  }

  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-solid border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
