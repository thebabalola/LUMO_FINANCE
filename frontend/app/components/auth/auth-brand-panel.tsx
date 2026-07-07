'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const

interface AuthBrandPanelProps {
  headline: ReactNode
  subline: string
}

// Left-hand branding column shared by the login and register pages.
export function AuthBrandPanel({ headline, subline }: AuthBrandPanelProps) {
  return (
    <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-black/20 border-r border-white/5 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-ember/15 blur-[130px] pointer-events-none animate-aurora"
      />
      <div
        aria-hidden
        className="absolute bottom-[-20%] right-[-10%] w-[420px] h-[420px] rounded-full bg-ember/10 blur-[120px] pointer-events-none animate-aurora [animation-delay:5s]"
      />
      <div aria-hidden className="absolute inset-0 bg-grid-faint pointer-events-none" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-16">
            <span className="w-10 h-10 rounded-xl bg-ember flex items-center justify-center shadow-lg shadow-ember/25">
              <span className="text-cream dark:text-cream font-bold text-xl font-heading">L</span>
            </span>
            <span className="font-heading text-2xl font-bold tracking-tight text-cream">Lumo</span>
          </Link>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: easeOutExpo }}
          className="text-5xl font-heading font-bold text-cream leading-[1.1] mb-6"
        >
          {headline}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: easeOutExpo }}
          className="text-lg text-cream/70 max-w-md"
        >
          {subline}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45, ease: easeOutExpo }}
        className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-md hover:border-ember/25 transition-colors duration-300"
      >
        <div className="flex gap-3 items-center mb-3">
          <ShieldCheck className="text-success" size={24} />
          <h4 className="font-semibold text-cream">Bank-Grade Security</h4>
        </div>
        <p className="text-sm text-cream/70">
          Your funds are protected by Nomba&apos;s production-grade infrastructure. Every payment
          needs your personal PIN — the assistant can never spend on its own.
        </p>
      </motion.div>
    </div>
  )
}
