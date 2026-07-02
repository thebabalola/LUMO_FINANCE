'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'transfer' | 'airtime' | 'bill' | 'data'
  amount: number
  recipient: string
  status: 'completed' | 'pending' | 'failed'
  timestamp: string
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions?limit=5')
        if (response.ok) {
          const data = await response.json()
          setTransactions(data)
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-900/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-900/20'
      case 'failed':
        return 'text-red-400 bg-red-900/20'
      default:
        return 'text-dark-400'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transfer':
        return '→'
      case 'airtime':
        return '📱'
      case 'bill':
        return '💡'
      case 'data':
        return '📊'
      default:
        return '•'
    }
  }

  return (
    <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
      <h3 className="text-lg font-semibold text-dark-50 mb-4">Recent Transactions</h3>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-dark-700 rounded animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-dark-400 text-sm text-center py-8">No transactions yet</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-smooth"
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl">{getTypeIcon(tx.type)}</div>
                <div>
                  <p className="text-sm font-medium text-dark-50">{tx.recipient}</p>
                  <p className="text-xs text-dark-400">{formatDate(tx.timestamp)}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-dark-50">
                  {formatCurrency(tx.amount)}
                </p>
                <p className={`text-xs font-medium ${getStatusColor(tx.status)}`}>
                  {tx.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
