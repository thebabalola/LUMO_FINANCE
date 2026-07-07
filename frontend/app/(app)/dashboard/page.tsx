'use client'

import { motion } from 'framer-motion'
import { WalletCard } from '@/components/wallet-card'
import { Card } from '@/components/ui/card'
import ChatInterface from '@/components/chat/chat-interface'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('Good day')
  const userName = 'Babalola' // In a real app, fetch from auth context

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  return (
    <div className="flex flex-col md:flex-row h-full max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">

      {/* Right Panel for Mobile (Stacks above chat) / Right Panel for Desktop */}
      <div className="w-full md:w-[40%] md:order-2 flex flex-col gap-6">
        
        {/* Dynamic Greeting */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-2"
        >
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-cream flex items-center gap-2">
            {greeting}, {userName} <span className="animate-wave inline-block origin-[70%_70%]">👋</span>
          </h2>
          <p className="text-sm text-cream/70 mt-1">Here&apos;s what&apos;s happening with your finances today.</p>
        </motion.div>

        <WalletCard />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: easeOutExpo }}
          className="flex-1 flex flex-col"
        >
          <Card className="p-6 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading font-semibold text-cream">Recent Transactions</h3>
              <button className="text-sm text-ember hover:text-ember-hover transition-colors group">
                View all <span className="inline-block group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 1, title: 'Sent to David', date: 'Today, 14:30', amount: '-₦10,000' },
                { id: 2, title: 'Airtime Recharge', date: 'Yesterday, 09:15', amount: '-₦1,000' },
                { id: 3, title: 'DSTV Subscription', date: 'Jun 28, 18:45', amount: '-₦3,500' },
              ].map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 + index * 0.1, ease: easeOutExpo }}
                  className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div>
                    <p className="font-medium text-cream text-sm">{txn.title}</p>
                    <p className="text-xs text-cream/50 mt-1">{txn.date}</p>
                  </div>
                  <span className="font-medium text-cream tabular-nums">{txn.amount}</span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Chat Column (Left on Desktop, Bottom on Mobile) */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05, ease: easeOutExpo }}
        className="w-full md:w-[60%] md:order-1 flex flex-col h-[600px] md:h-[calc(100vh-6rem)]"
      >
        <ChatInterface />
      </motion.div>

    </div>
  )
}
