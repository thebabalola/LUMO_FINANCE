'use client'

import { ClipboardEvent, KeyboardEvent, useRef } from 'react'
import { motion } from 'framer-motion'

interface OtpInputProps {
  value: string
  onChange: (nextValue: string) => void
  length?: number
  disabled?: boolean
}

// Six individual digit boxes that behave like one field: typing advances,
// backspace retreats, and pasting a full code fills every box at once.
export function OtpInput({ value, onChange, length = 6, disabled }: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const focusBox = (index: number) => {
    inputRefs.current[Math.max(0, Math.min(index, length - 1))]?.focus()
  }

  const handleDigitChange = (index: number, rawInput: string) => {
    const digit = rawInput.replace(/\D/g, '').slice(-1)
    if (!digit) {
      onChange(value.slice(0, index))
      return
    }
    const digits = value.split('')
    digits[index] = digit
    onChange(digits.join('').slice(0, length))
    focusBox(index + 1)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !value[index]) {
      focusBox(index - 1)
    }
    if (event.key === 'ArrowLeft') focusBox(index - 1)
    if (event.key === 'ArrowRight') focusBox(index + 1)
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pastedDigits) {
      onChange(pastedDigits)
      focusBox(pastedDigits.length - 1)
    }
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {Array.from({ length }).map((_, index) => (
        <motion.input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element
          }}
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.06, type: 'spring', damping: 20, stiffness: 300 }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={value[index] ?? ''}
          onChange={(event) => handleDigitChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-white/5 border border-white/10 text-center text-2xl font-heading font-semibold text-cream focus:outline-none focus:ring-2 focus:ring-ember/60 focus:border-ember/40 focus:scale-105 transition-all duration-200 disabled:opacity-50"
        />
      ))}
    </div>
  )
}
