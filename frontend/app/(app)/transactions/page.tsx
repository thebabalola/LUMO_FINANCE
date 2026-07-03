'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, ArrowDownRight, ArrowUpRight, Clock, Download } from 'lucide-react'
import { clsx } from 'clsx'

const MOCK_TRANSACTIONS = [
  { id: 'tx-1', title: 'Transfer to John Doe', amount: 10000, type: 'debit', status: 'success', date: '2026-07-03T14:30:00Z', reference: 'NMB-2026-847291' },
  { id: 'tx-2', title: 'Salary Deposit', amount: 450000, type: 'credit', status: 'success', date: '2026-07-01T08:15:00Z', reference: 'NMB-2026-112349' },
  { id: 'tx-3', title: 'Airtime Purchase', amount: 1000, type: 'debit', status: 'success', date: '2026-06-30T19:45:00Z', reference: 'NMB-2026-992831' },
  { id: 'tx-4', title: 'Netflix Subscription', amount: 5000, type: 'debit', status: 'pending', date: '2026-06-29T10:00:00Z', reference: 'NMB-2026-556123' },
  { id: 'tx-5', title: 'Transfer from Alice', amount: 25000, type: 'credit', status: 'success', date: '2026-06-28T16:20:00Z', reference: 'NMB-2026-881234' },
]

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = MOCK_TRANSACTIONS.filter(tx => 
    tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.reference.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-cream mb-2">Transactions</h1>
          <p className="text-cream/70">View and manage your recent activity.</p>
        </div>
        <Button variant="outline" className="flex items-center gap-2 border-white/10 text-cream bg-white/5 hover:bg-white/10">
          <Download size={16} />
          Export Statement
        </Button>
      </div>

      <Card className="p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-cream/40" size={18} />
          <Input 
            placeholder="Search by name or reference..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/20 border-white/10 text-cream w-full"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2 border-white/10 text-cream hover:bg-white/5">
          <Filter size={16} />
          Filters
        </Button>
      </Card>

      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((tx) => (
            <Card key={tx.id} className="p-4 hover:bg-white/5 transition-colors cursor-pointer group border-white/5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    tx.type === 'credit' ? "bg-success/10 text-success" : "bg-ember/10 text-ember"
                  )}>
                    {tx.type === 'credit' ? <ArrowDownRight size={24} /> : <ArrowUpRight size={24} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-cream text-lg">{tx.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-cream/50 mt-1">
                      <span>{new Date(tx.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Ref: {tx.reference}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={clsx(
                    "font-bold text-lg",
                    tx.type === 'credit' ? "text-success" : "text-cream"
                  )}>
                    {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {tx.status === 'pending' && <Clock size={12} className="text-amber-500" />}
                    <span className={clsx(
                      "text-xs capitalize font-medium",
                      tx.status === 'success' ? "text-success/70" : "text-amber-500/70"
                    )}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-cream/20">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-semibold text-cream mb-2">No transactions found</h3>
            <p className="text-cream/50">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
