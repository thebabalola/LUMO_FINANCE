import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={clsx(
          'flex h-12 w-full rounded-xl border bg-white/5 px-4 py-2 text-sm text-cream placeholder:text-cream-darkMuted transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ember focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-danger focus-visible:ring-danger' : 'border-white/10',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
