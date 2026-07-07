'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Send, Smartphone, Wifi, ReceiptText, ArrowDownLeft, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

const easeOutExpo = [0.21, 0.47, 0.32, 0.98] as const

interface TransactionListItem {
  id: string
  type: string
  amount: number
  recipient: string
  status: string
  timestamp: string
  reference: string
}

const typeIcons: Record<string, typeof Send> = {
  transfer: Send,
  airtime: Smartphone,
  data: Wifi,
  bill: ReceiptText,
  deposit: ArrowDownLeft,
}

const statusStyles: Record<string, string> = {
  completed: 'text-success bg-success/10',
  pending: 'text-yellow-400 bg-yellow-400/10',
  failed: 'text-danger bg-danger/10',
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const response = await fetch('/api/transactions?limit=50')
      const data = await response.json()
      if (!response.ok) {
        setLoadError(data.error ?? 'Failed to load transactions')
        return
      }
      setTransactions(data)
    } catch {
      setLoadError('Failed to load transactions. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easeOutExpo }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-2xl font-heading font-bold text-cream">Transactions</h1>
        <button
          onClick={fetchTransactions}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-cream/70 hover:text-cream bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : loadError ? (
        <Card className="p-8 text-center">
          <p className="text-danger mb-4">{loadError}</p>
          <button
            onClick={fetchTransactions}
            className="px-4 py-2 bg-ember hover:bg-ember-hover text-cream rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-cream/70 mb-2">No transactions yet</p>
          <p className="text-sm text-cream/50">
            Ask the Lumo assistant to send money, buy airtime, or pay a bill to get started.
          </p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden divide-y divide-white/5">
          {transactions.map((transaction, transactionIndex) => {
            const TypeIcon = typeIcons[transaction.type] ?? Send
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: Math.min(transactionIndex * 0.05, 0.6),
                  ease: easeOutExpo,
                }}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-ember/20 text-ember flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-ember group-hover:text-white transition-all duration-300">
                    <TypeIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cream truncate">
                      {transaction.recipient || transaction.type}
                    </p>
                    <p className="text-xs text-cream/50">
                      {formatDate(transaction.timestamp)}
                      {transaction.reference && ` • ${transaction.reference}`}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-cream">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                      statusStyles[transaction.status] ?? 'text-cream/50 bg-white/5'
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
