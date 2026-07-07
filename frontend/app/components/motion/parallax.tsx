'use client'

import { ReactNode, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

interface ParallaxProps {
  children: ReactNode
  /** How far the content drifts (in px) over the section's full scroll range. Negative moves up. */
  speed?: number
  className?: string
}

// Moves content vertically at a different rate than the page scroll,
// measured against the element's own journey through the viewport.
export function Parallax({ children, speed = -60, className }: ParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const parallaxY = useTransform(scrollYProgress, [0, 1], [-speed, speed])

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{ y: prefersReducedMotion ? 0 : parallaxY }}
    >
      {children}
    </motion.div>
  )
}
