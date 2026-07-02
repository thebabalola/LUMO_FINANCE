'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Send, Smartphone, Wifi, ReceiptText, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function WalletCard() {
  const [showBalance, setShowBalance] = useState(true)
  const [displayBalance, setDisplayBalance] = useState(0)
  const [targetBalance, setTargetBalance] = useState(0)
  const [accountNumber, setAccountNumber] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
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
    if (showBalance && !isLoading) {
      let current = 0
      const duration = 1200
      const steps = 60
      const stepValue = targetBalance / steps
      const intervalTime = duration / steps
      
      const timer = setInterval(() => {
        current += stepValue
        if (current >= targetBalance) {
          setDisplayBalance(targetBalance)
          clearInterval(timer)
        } else {
          setDisplayBalance(Math.floor(current))
        }
      }, intervalTime)
      
      return () => clearInterval(timer)
    } else {
      setDisplayBalance(0)
      return undefined
    }
  }, [showBalance, targetBalance, isLoading])


  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-sm text-cream/70 mb-1">Total Balance</p>
          {isLoading ? (
            <div className="h-9 w-40 bg-white/10 animate-pulse rounded-md mb-1"></div>
          ) : showBalance ? (
            <h2 className="text-3xl font-heading font-bold text-cream">
              ₦{displayBalance.toLocaleString()}
            </h2>
          ) : (
            <h2 className="text-3xl font-heading font-bold text-cream">
              ••••••
            </h2>
          )}
          
          {isLoading ? (
            <div className="h-5 w-32 bg-white/10 animate-pulse rounded-md mt-1"></div>
          ) : (
            <p className="text-sm text-cream/50 mt-1">Lumo Wallet • {accountNumber}</p>
          )}
        </div>
        <button 
          onClick={() => setShowBalance(!showBalance)}
          disabled={isLoading}
          className="text-cream/50 hover:text-cream transition-colors p-2 bg-white/5 rounded-lg disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-ember hover:text-white text-cream rounded-xl transition-colors group">
          <Send size={20} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Send</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-ember hover:text-white text-cream rounded-xl transition-colors group">
          <Smartphone size={20} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Airtime</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-ember hover:text-white text-cream rounded-xl transition-colors group">
          <Wifi size={20} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Data</span>
        </button>
        <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 hover:bg-ember hover:text-white text-cream rounded-xl transition-colors group">
          <ReceiptText size={20} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium">Bills</span>
        </button>
      </div>
    </Card>
  )
}
