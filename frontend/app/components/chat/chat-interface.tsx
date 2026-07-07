'use client'

import { useRef, useEffect } from 'react'
import ChatMessages from './chat-messages'
import ChatInput from './chat-input'
import { useChatStore } from '@/store/chat-store'
import { Card } from '@/components/ui/card'
import { PendingAction } from '@/types/chat'
import { TransactionIntent } from '../transactions/transaction-confirmation'

// Shapes a backend pending action into the fields the confirmation card
// displays. Amounts arrive in kobo; the UI shows naira.
function pendingActionToIntent(pendingAction: PendingAction): TransactionIntent {
  const typeLabels: Record<PendingAction['type'], string> = {
    transfer: 'Bank Transfer',
    airtime: 'Airtime',
    data: 'Mobile Data',
    bill: 'Bill Payment',
  }
  const amountNaira = pendingAction.amount_kobo / 100
  return {
    type: pendingAction.type === 'bill' ? 'bills' : pendingAction.type,
    recipientName: pendingAction.recipient_name || pendingAction.recipient,
    bankOrProvider: typeLabels[pendingAction.type],
    accountOrPhone: pendingAction.recipient,
    amount: amountNaira,
    fee: 0,
    total: amountNaira,
  }
}

export default function ChatInterface() {
  const { messages, addMessage, loading, setLoading, conversationId, setConversationId } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSendMessage = async (content: string) => {
    addMessage({
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    })

    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()

      if (data.conversationId) {
        setConversationId(data.conversationId)
      }

      addMessage({
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: 'assistant',
        timestamp: new Date(),
        pendingAction: data.pendingAction ?? undefined,
        intent: data.pendingAction ? pendingActionToIntent(data.pendingAction) : undefined,
      })
    } catch (error) {
      console.error('Chat error:', error)
      addMessage({
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="flex-1 flex flex-col p-0 overflow-hidden relative border border-white/5 h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md z-10 flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center shadow-lg shadow-ember/20 border border-white/5 overflow-hidden">
            <img src="/lumoFi-logo.png" alt="Lumo AI" className="w-8 h-8 object-contain" />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-brown animate-pulse-ring"></div>
        </div>
        <div>
          <h2 className="font-heading font-semibold text-cream">Lumo Assistant</h2>
          <p className="text-xs text-cream/70">Powered by Nomba</p>
        </div>
      </div>

      {/* Messages */}
      <ChatMessages messages={messages} loading={loading} />
      <div ref={messagesEndRef} />

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
    </Card>
  )
}
