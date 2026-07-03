import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx('lumo-card', className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

export { Card }
