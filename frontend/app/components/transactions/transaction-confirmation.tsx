'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Check, X, Loader2, ArrowRight } from 'lucide-react'

export interface TransactionIntent {
  type: 'transfer' | 'airtime' | 'data' | 'bills'
  recipientName: string
  bankOrProvider: string
  accountOrPhone: string
  amount: number
  fee: number
  total: number
}

interface TransactionConfirmationCardProps {
  intent: TransactionIntent
  onConfirm: (transactionPin: string) => Promise<void>
  onCancel: () => void
}

export function TransactionConfirmationCard({ intent, onConfirm, onCancel }: TransactionConfirmationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transactionPin, setTransactionPin] = useState('')

  const isPinValid = /^\d{4,6}$/.test(transactionPin)

  const handleConfirm = async () => {
    if (!isPinValid) {
      setError('Enter your 4-6 digit transaction PIN to confirm.')
      return
    }
    setIsProcessing(true)
    setError(null)
    try {
      await onConfirm(transactionPin)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const formatMoney = (amount: number) => `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Card className="w-full max-w-sm bg-white/10 border-white/20 backdrop-blur-md overflow-hidden relative">
      <div className="p-4 border-b border-white/10 bg-brown/40">
        <div className="flex items-center gap-2 text-cream">
          <div className="w-8 h-8 rounded-full bg-ember/20 flex items-center justify-center text-ember">
            <ArrowRight size={16} />
          </div>
          <span className="font-heading font-medium">
            {{ transfer: 'Send Money', airtime: 'Buy Airtime', data: 'Buy Data', bills: 'Pay Bill' }[intent.type]}
          </span>
        </div>
      </div>
      
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-cream/70">To:</span>
          <span className="font-medium text-cream">{intent.recipientName}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-cream/70">Bank:</span>
          <span className="font-medium text-cream">{intent.bankOrProvider} • {intent.accountOrPhone}</span>
        </div>
        <div className="h-px w-full bg-white/10 my-2"></div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-cream/70">Amount:</span>
          <span className="font-medium text-cream">{formatMoney(intent.amount)}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-cream/70">Fee:</span>
          <span className="font-medium text-cream">{formatMoney(intent.fee)}</span>
        </div>
        <div className="h-px w-full bg-white/10 my-2"></div>
        <div className="flex justify-between items-center text-base font-semibold">
          <span className="text-cream">Total:</span>
          <span className="text-ember">{formatMoney(intent.total)}</span>
        </div>

        <div className="pt-2">
          <label htmlFor="transaction-pin" className="block text-xs text-cream/70 mb-1.5">
            Transaction PIN
          </label>
          <input
            id="transaction-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={transactionPin}
            onChange={(event) => setTransactionPin(event.target.value.replace(/\D/g, ''))}
            disabled={isProcessing}
            placeholder="••••"
            className="w-full h-11 px-3 rounded-lg bg-white/5 border border-white/10 text-cream text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-ember/50 disabled:opacity-50"
          />
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md text-xs text-red-400 text-center">
            {error}
          </div>
        )}
      </div>

      <div className="p-3 bg-brown/40 border-t border-white/10 flex gap-2">
        <button 
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-cream text-sm font-medium transition-colors disabled:opacity-50"
        >
          <X size={16} />
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isProcessing || !isPinValid}
          className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg bg-success hover:bg-success/90 text-brown font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {isProcessing ? 'Processing' : 'Confirm'}
        </button>
      </div>
    </Card>
  )
}
