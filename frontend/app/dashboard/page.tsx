'use client'

import { useState } from 'react'
import ChatInterface from '@/components/chat/chat-interface'
import WalletOverview from '@/components/dashboard/wallet-overview'
import RecentTransactions from '@/components/dashboard/recent-transactions'

export default function DashboardPage() {
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 overflow-auto">
      {/* Main content */}
      <div className="flex-1 space-y-6">
        <WalletOverview />
        <RecentTransactions />
      </div>

      {/* Chat sidebar */}
      <div className="w-full lg:w-96 flex flex-col">
        <ChatInterface />
      </div>
    </div>
  )
}
