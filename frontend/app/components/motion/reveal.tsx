'use client'

import { ReactNode, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

interface RevealProps {
  children: ReactNode
  delay?: number
  duration?: number
  distance?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  once?: boolean
  className?: string
}

// Fades content in as it scrolls into view, drifting from the given direction.
export function Reveal({
  children,
  delay = 0,
  duration = 0.7,
  distance = 32,
  direction = 'up',
  once = true,
  className,
}: RevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once, margin: '-80px' })
  const prefersReducedMotion = useReducedMotion()

  const offsetByDirection = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
  }[direction]

  const hiddenState = prefersReducedMotion
    ? { opacity: 0 }
    : { opacity: 0, ...offsetByDirection }

  return (
    <motion.div
      ref={containerRef}
      className={className}
      initial={hiddenState}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : hiddenState}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerRevealProps {
  children: ReactNode[]
  className?: string
  childClassName?: string
  staggerDelay?: number
}

// Reveals a list of children one after another once the group scrolls into view.
export function StaggerReveal({
  children,
  className,
  childClassName,
  staggerDelay = 0.12,
}: StaggerRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={containerRef}
      className={className}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          className={childClassName}
          variants={{
            hidden: { opacity: 0, y: 32 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
