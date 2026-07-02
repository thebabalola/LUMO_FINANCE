'use client'

import { useState, useEffect } from 'react'

interface WalletData {
  balance: number
  accountName: string
  accountNumber: string
  currency: string
}

export default function WalletOverview() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await fetch('/api/wallet')
        if (response.ok) {
          const data = await response.json()
          setWallet(data)
        }
      } catch (error) {
        console.error('Failed to fetch wallet:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWallet()
  }, [])

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-lg border border-dark-700 p-6 animate-pulse">
        <div className="h-6 bg-dark-700 rounded w-32 mb-4" />
        <div className="h-10 bg-dark-700 rounded w-48" />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-lg p-8 text-white shadow-lg">
      <p className="text-primary-100 text-sm font-medium mb-2">Wallet Balance</p>
      <h2 className="text-4xl font-bold mb-1">
        {wallet ? `₦${wallet.balance.toLocaleString()}` : '₦0'}
      </h2>
      {wallet && (
        <>
          <p className="text-primary-100 text-sm">{wallet.accountName}</p>
          <p className="text-primary-200 text-xs mt-1">{wallet.accountNumber}</p>
        </>
      )}

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button className="bg-white/20 hover:bg-white/30 rounded-lg py-2 px-3 text-sm font-medium transition-smooth">
          Send
        </button>
        <button className="bg-white/20 hover:bg-white/30 rounded-lg py-2 px-3 text-sm font-medium transition-smooth">
          Receive
        </button>
        <button className="bg-white/20 hover:bg-white/30 rounded-lg py-2 px-3 text-sm font-medium transition-smooth">
          Airtime
        </button>
      </div>
    </div>
  )
}
