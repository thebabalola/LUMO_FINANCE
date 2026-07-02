'use client'

import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Send, Smartphone, Wifi, ReceiptText } from 'lucide-react'
import anime from 'animejs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function WalletCard() {
  const [showBalance, setShowBalance] = useState(true)
  const balanceRef = useRef<HTMLHeadingElement>(null)
  
  const targetBalance = 125430
  
  useEffect(() => {
    if (showBalance && balanceRef.current) {
      anime({
        targets: balanceRef.current,
        innerHTML: [0, targetBalance],
        round: 1,
        duration: 1200,
        easing: 'easeOutExpo',
        update: (anim) => {
          if (balanceRef.current) {
            balanceRef.current.innerHTML =
              '₦' + Math.floor(Number(anim.animations[0].currentValue)).toLocaleString()
          }
        },
      })
    }
  }, [showBalance])

  return (
    <Card className="p-6 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-sm text-cream/70 mb-1">Total Balance</p>
          {showBalance ? (
            <h2 ref={balanceRef} className="text-3xl font-heading font-bold text-cream">
              ₦0
            </h2>
          ) : (
            <h2 className="text-3xl font-heading font-bold text-cream">
              ••••••
            </h2>
          )}
          <p className="text-sm text-cream/50 mt-1">Lumo Wallet • 0123456789</p>
        </div>
        <button 
          onClick={() => setShowBalance(!showBalance)}
          className="text-cream/50 hover:text-cream transition-colors p-2 bg-white/5 rounded-lg"
        >
          {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
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
