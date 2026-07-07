'use client'

import { WalletCard } from '@/components/wallet-card'
import { Card } from '@/components/ui/card'
import ChatInterface from '@/components/chat/chat-interface'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

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
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        >
          <Card className="p-6 relative overflow-hidden">
            <motion.img 
              src="/transaction_3d_naira.png" 
              alt="3D Transaction" 
              className="absolute -right-6 -top-6 w-32 h-32 object-contain opacity-10 pointer-events-none"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            />
            
            <div className="flex justify-between items-center mb-4 relative z-10">
              <h3 className="font-heading font-semibold text-cream">Recent Transactions</h3>
              <button className="text-sm text-ember hover:text-ember-hover transition-colors">
                View all &rarr;
              </button>
            </div>
            
            <div className="space-y-4 relative z-10">
              {[
                { id: 1, title: 'Sent to David', date: 'Today, 14:30', amount: '-₦10,000' },
                { id: 2, title: 'Airtime Recharge', date: 'Yesterday, 09:15', amount: '-₦1,000' },
                { id: 3, title: 'DSTV Subscription', date: 'Jun 28, 18:45', amount: '-₦3,500' },
              ].map((txn) => (
                <div key={txn.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-white/5">
                  <div>
                    <p className="font-medium text-cream text-sm">{txn.title}</p>
                    <p className="text-xs text-cream/50 mt-1">{txn.date}</p>
                  </div>
                  <span className="font-medium text-cream">{txn.amount}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Chat Column (Left on Desktop, Bottom on Mobile) */}
      <div className="w-full md:w-[60%] md:order-1 flex flex-col h-[600px] md:h-[calc(100vh-6rem)] relative">
        <ChatInterface />
      </div>
      
    </div>
  )
}
