'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle2, Share2, Copy } from 'lucide-react'
import { TransactionIntent } from './transaction-confirmation'
import { formatTime } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface TransactionReceiptCardProps {
  intent: TransactionIntent
  reference: string
  onDone: () => void
}

export function TransactionReceiptCard({ intent, reference, onDone }: TransactionReceiptCardProps) {
  
  const handleCopyRef = () => {
    navigator.clipboard.writeText(reference)
    toast.success('Reference copied to clipboard', {
      style: { background: '#3A0D12', color: '#FCECDC', border: '1px solid rgba(255,255,255,0.1)' }
    })
  }

  const formatMoney = (amount: number) => `₦${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Card className="w-full max-w-sm bg-white/10 border-success/30 backdrop-blur-md overflow-hidden relative shadow-lg shadow-success/10">
      
      {/* Decorative success background */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-success/20 to-transparent pointer-events-none" />

      <div className="p-6 pt-8 flex flex-col items-center text-center relative z-10 border-b border-white/10">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center text-success mb-3 ring-4 ring-success/10">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="font-heading font-semibold text-lg text-cream">Transfer Successful</h3>
        <p className="text-sm text-cream/70 mt-1">{formatTime(new Date())}</p>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="bg-black/20 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-xs text-cream/60 mb-1">Total Amount</span>
          <span className="text-2xl font-heading font-bold text-success">{formatMoney(intent.total)}</span>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-cream/70">To:</span>
            <span className="font-medium text-cream">{intent.recipientName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-cream/70">Bank:</span>
            <span className="font-medium text-cream text-right">{intent.bankOrProvider}<br/><span className="text-xs text-cream/70">{intent.accountOrPhone}</span></span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-cream/70">Fee:</span>
            <span className="font-medium text-cream">{formatMoney(intent.fee)}</span>
          </div>
          
          <div className="h-px w-full bg-white/10 my-1"></div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-cream/70">Ref:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-cream bg-white/5 px-2 py-1 rounded">{reference}</span>
              <button onClick={handleCopyRef} className="text-cream/50 hover:text-ember transition-colors">
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex gap-2 border-t border-white/10 bg-black/10">
        <button 
          className="flex-1 py-2 px-3 flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 text-cream text-sm font-medium transition-colors"
        >
          <Share2 size={16} />
          Share
        </button>
        <button 
          onClick={onDone}
          className="flex-1 py-2 px-3 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-cream font-medium text-sm transition-colors"
        >
          Done
        </button>
      </div>
    </Card>
  )
}
