'use client'

import { useEffect, useRef } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

interface AnimatedCounterProps {
  targetValue: number
  prefix?: string
  suffix?: string
  className?: string
}

// Counts from 0 to targetValue with a spring once the number scrolls into view.
export function AnimatedCounter({ targetValue, prefix = '', suffix = '', className }: AnimatedCounterProps) {
  const numberRef = useRef<HTMLSpanElement>(null)
  const isInView = useInView(numberRef, { once: true, margin: '-40px' })
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { damping: 40, stiffness: 90 })

  useEffect(() => {
    if (isInView) {
      motionValue.set(targetValue)
    }
  }, [isInView, targetValue, motionValue])

  useEffect(() => {
    return springValue.on('change', (latestValue) => {
      if (numberRef.current) {
        numberRef.current.textContent = `${prefix}${Math.round(latestValue).toLocaleString()}${suffix}`
      }
    })
  }, [springValue, prefix, suffix])

  return (
    <span ref={numberRef} className={className}>
      {prefix}0{suffix}
    </span>
  )
}
