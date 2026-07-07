'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { Eye, EyeOff, Send, Smartphone, Wifi, ReceiptText, Loader2 } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'

const quickActions = [
  { label: 'Send', icon: Send, chatPrefill: 'Send ' },
  { label: 'Airtime', icon: Smartphone, chatPrefill: 'Buy Airtime ' },
  { label: 'Data', icon: Wifi, chatPrefill: 'Buy Data ' },
  { label: 'Bills', icon: ReceiptText, chatPrefill: 'Pay Bill ' },
]

export function WalletCard() {
  const [showBalance, setShowBalance] = useState(true)
  const [targetBalance, setTargetBalance] = useState(0)
  const [accountNumber, setAccountNumber] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const balanceRef = useRef<HTMLSpanElement>(null)
  const balanceMotionValue = useMotionValue(0)
  const balanceSpring = useSpring(balanceMotionValue, { damping: 34, stiffness: 80 })

  const { setInputValue } = useChatStore()

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch('/api/wallet')
        if (!res.ok) throw new Error('Failed to fetch wallet')
        const data = await res.json()
        setTargetBalance(data.balance)
        setAccountNumber(data.accountNumber)
      } catch (err) {
        console.error(err)
        // Fallback for demo
        setTargetBalance(125430)
        setAccountNumber('0123456789')
      } finally {
        setIsLoading(false)
      }
    }
    fetchWallet()
  }, [])

  useEffect(() => {
    if (!isLoading && showBalance) {
      balanceMotionValue.set(targetBalance)
    }
  }, [isLoading, showBalance, targetBalance, balanceMotionValue])

  useEffect(() => {
    return balanceSpring.on('change', (latestValue) => {
      if (balanceRef.current) {
        balanceRef.current.textContent = `₦${Math.round(latestValue).toLocaleString()}`
      }
    })
  }, [balanceSpring])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="card-sheen noise-overlay relative rounded-2xl border border-white/10 bg-gradient-to-br from-brown-light via-brown to-brown-deep p-6 mb-6 shadow-3d overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-ember/20 blur-[70px] pointer-events-none"
      />

      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <p className="text-sm text-cream/70 mb-1">Total Balance</p>
          {isLoading ? (
            <div className="h-9 w-40 bg-white/10 animate-pulse rounded-md mb-1"></div>
          ) : showBalance ? (
            <h2 className="text-3xl font-heading font-bold text-cream tabular-nums">
              <span ref={balanceRef}>₦0</span>
            </h2>
          ) : (
            <h2 className="text-3xl font-heading font-bold text-cream tracking-widest">••••••</h2>
          )}

          {isLoading ? (
            <div className="h-5 w-32 bg-white/10 animate-pulse rounded-md mt-1"></div>
          ) : (
            <p className="text-sm text-cream/50 mt-1 font-mono">Lumo Wallet • {accountNumber}</p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setShowBalance(!showBalance)}
          disabled={isLoading}
          className="text-cream/50 hover:text-cream transition-colors p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50"
          aria-label={showBalance ? 'Hide balance' : 'Show balance'}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
        </motion.button>
      </div>

      <div className="relative z-10 grid grid-cols-4 gap-2">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.07, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setInputValue(action.chatPrefill)}
            className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-ember hover:text-white hover:shadow-lg hover:shadow-ember/30 text-cream rounded-xl transition-colors duration-300 group"
          >
            <action.icon size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
