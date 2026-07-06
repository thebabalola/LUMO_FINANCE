'use client'

import { MouseEvent, ReactNode, useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Maximum tilt in degrees at the card's edges. */
  maxTiltDegrees?: number
}

// Tilts toward the cursor in 3D and lights up a spotlight that follows it.
export function TiltCard({ children, className, maxTiltDegrees = 6 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const pointerX = useMotionValue(0.5)
  const pointerY = useMotionValue(0.5)

  const rotateX = useSpring(
    useTransform(pointerY, [0, 1], [maxTiltDegrees, -maxTiltDegrees]),
    { damping: 20, stiffness: 200 }
  )
  const rotateY = useSpring(
    useTransform(pointerX, [0, 1], [-maxTiltDegrees, maxTiltDegrees]),
    { damping: 20, stiffness: 200 }
  )
  const spotlightBackground = useTransform(
    [pointerX, pointerY],
    ([x, y]) =>
      `radial-gradient(420px circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgb(255 255 255 / 0.06), transparent 65%)`
  )

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || prefersReducedMotion) return
    const bounds = cardRef.current.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width)
    pointerY.set((event.clientY - bounds.top) / bounds.height)
  }

  const handleMouseLeave = () => {
    pointerX.set(0.5)
    pointerY.set(0.5)
  }

  return (
    <motion.div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: prefersReducedMotion ? 0 : rotateX,
        rotateY: prefersReducedMotion ? 0 : rotateY,
        transformStyle: 'preserve-3d',
        transformPerspective: 900,
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
        style={{ background: spotlightBackground }}
      />
      {children}
    </motion.div>
  )
}
