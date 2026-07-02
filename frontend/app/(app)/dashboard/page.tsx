'use client'

import { WalletCard } from '@/components/wallet-card'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Mic, Send } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex flex-col md:flex-row h-full max-w-7xl mx-auto w-full p-4 md:p-6 gap-6">
      
      {/* Right Panel for Mobile (Stacks above chat) / Right Panel for Desktop */}
      <div className="w-full md:w-[40%] md:order-2 flex flex-col gap-6">
        <WalletCard />
        
        <Card className="p-6 flex-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-heading font-semibold text-cream">Recent Transactions</h3>
            <button className="text-sm text-ember hover:text-ember-hover transition-colors">
              View all &rarr;
            </button>
          </div>
          
          <div className="space-y-4">
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
      </div>

      {/* Chat Column (Left on Desktop, Bottom on Mobile) */}
      <div className="w-full md:w-[60%] md:order-1 flex flex-col h-[600px] md:h-full">
        <Card className="flex-1 flex flex-col p-0 overflow-hidden relative">
          
          {/* Header */}
          <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md z-10 flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-ember flex items-center justify-center">
                <span className="font-heading font-bold text-cream">AI</span>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-brown"></div>
            </div>
            <div>
              <h2 className="font-heading font-semibold text-cream">Lumo Assistant</h2>
              <p className="text-xs text-cream/70">Powered by Nomba</p>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-end">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-ember/20 text-ember mx-auto flex items-center justify-center mb-4">
                <span className="font-heading text-2xl font-bold">L</span>
              </div>
              <h3 className="font-heading text-xl font-medium text-cream mb-2">How can I help you today?</h3>
              <p className="text-sm text-cream/70 max-w-md mx-auto">
                Try asking me to send money, buy airtime, or check your transaction history.
              </p>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/5 border-t border-white/5 backdrop-blur-md">
            <div className="flex gap-2 overflow-x-auto pb-3 mb-1 no-scrollbar">
              {['Send ₦10k to John', 'Buy ₦1,000 Airtime', 'Pay DSTV bill'].map((chip) => (
                <button 
                  key={chip}
                  className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-cream transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
            
            <div className="relative flex items-center">
              <Input 
                placeholder="Type a message..." 
                className="pr-24 bg-brown-light border-white/10 rounded-full focus-visible:ring-ember/50"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button className="p-2 text-cream/50 hover:text-ember transition-colors rounded-full hover:bg-white/5">
                  <Mic size={18} />
                </button>
                <button className="p-2 bg-ember hover:bg-ember-hover text-cream transition-colors rounded-full shadow-lg shadow-ember/20">
                  <Send size={18} className="ml-0.5" />
                </button>
              </div>
            </div>
          </div>

        </Card>
      </div>
      
    </div>
  )
}
