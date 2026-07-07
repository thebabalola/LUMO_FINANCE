'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Message } from '@/types/chat'
import { formatTime } from '@/lib/utils'
import { Copy, Bot, Send, Smartphone, ReceiptText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { TransactionConfirmationCard } from '../transactions/transaction-confirmation'
import { TransactionReceiptCard } from '../transactions/transaction-receipt'
import { useChatStore } from '@/store/chat-store'

interface ChatMessagesProps {
  messages: Message[]
  loading: boolean
}

const messageSpring = { type: 'spring', damping: 26, stiffness: 300 } as const

export default function ChatMessages({ messages, loading }: ChatMessagesProps) {
  const { updateMessage, addMessage } = useChatStore()

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Message copied to clipboard', {
      style: {
        background: '#3A0D12',
        color: '#FCECDC',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    })
  }

  const handleConfirm = async (message: Message, transactionPin: string) => {
    if (!message.pendingAction) return

    const response = await fetch('/api/chat/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionId: message.pendingAction.action_id,
        pin: transactionPin,
      }),
    })
    const data = await response.json()
    if (!response.ok) {
      // The confirmation card catches this and shows the message inline
      // (wrong PIN, lockout, expired action, insufficient balance, ...).
      throw new Error(data.error ?? 'Transaction failed. Please try again.')
    }

    updateMessage(message.id, {
      receipt: { reference: data.transaction?.reference ?? '' },
      pendingAction: undefined,
    })
    if (data.message) {
      addMessage({
        id: Date.now().toString(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
      })
    }
  }

  const handleCancel = async (message: Message) => {
    if (message.pendingAction) {
      // Best-effort: the pending action expires on its own after 5 minutes.
      fetch('/api/chat/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: message.pendingAction.action_id }),
      }).catch(() => undefined)
    }
    updateMessage(message.id, {
      intent: undefined,
      pendingAction: undefined,
      content: `${message.content}\n\nTransaction cancelled.`,
    })
  }

  const emptyStateSuggestions = [
    { icon: Send, label: 'Send ₦10k to a friend' },
    { icon: Smartphone, label: 'Buy ₦1,000 airtime' },
    { icon: ReceiptText, label: 'Pay my DSTV bill' },
  ]

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col justify-end space-y-4 relative">
      {messages.length === 0 ? (
        <div className="text-center mb-8 h-full flex flex-col justify-center items-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 16, stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-ember/20 text-ember mx-auto flex items-center justify-center mb-4 shadow-ember-glow"
          >
            <span className="font-heading text-2xl font-bold">L</span>
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="font-heading text-xl font-medium text-cream mb-2"
          >
            How can I help you today?
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="text-sm text-cream/70 max-w-md mx-auto mb-6"
          >
            Try asking me to send money, buy airtime, or check your transaction history.
          </motion.p>
          <div className="flex flex-wrap justify-center gap-2 max-w-sm">
            {emptyStateSuggestions.map((suggestion, index) => (
              <motion.span
                key={suggestion.label}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35 + index * 0.1, ...messageSpring }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-cream/60"
              >
                <suggestion.icon size={12} className="text-ember" />
                {suggestion.label}
              </motion.span>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={messageSpring}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`flex gap-3 max-w-full md:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-ember/20 text-ember flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={16} />
                    </div>
                  )}

                  <div className="group relative">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-ember text-white rounded-tr-sm shadow-lg shadow-ember/20'
                          : 'bg-white/5 border border-white/5 text-cream rounded-tl-sm backdrop-blur-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>

                      {/* Render Confirmation Card if intent exists and no receipt yet */}
                      {message.intent && !message.receipt && (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, ...messageSpring }}
                          className="mt-4 mb-1"
                        >
                          <TransactionConfirmationCard
                            intent={message.intent}
                            onConfirm={(transactionPin) => handleConfirm(message, transactionPin)}
                            onCancel={() => handleCancel(message)}
                          />
                        </motion.div>
                      )}

                      {/* Render Receipt Card if receipt exists */}
                      {message.receipt && message.intent && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.94 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={messageSpring}
                          className="mt-4 mb-1"
                        >
                          <TransactionReceiptCard
                            intent={message.intent}
                            reference={message.receipt.reference}
                            onDone={() => {
                              addMessage({
                                id: Date.now().toString(),
                                content: 'Is there anything else you need help with?',
                                role: 'assistant',
                                timestamp: new Date()
                              })
                            }}
                          />
                        </motion.div>
                      )}

                    </div>

                    <div className={`flex items-center mt-1 gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-cream/40 font-medium">
                        {formatTime(message.timestamp)}
                      </span>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(message.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-cream/40 hover:text-ember"
                          title="Copy message"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-ember/20 text-ember flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={16} />
              </div>
              <div className="bg-white/5 border border-white/5 text-cream px-4 py-3 rounded-2xl rounded-tl-sm backdrop-blur-sm flex items-center">
                <div className="flex space-x-1.5">
                  {[0, 1, 2].map((dotIndex) => (
                    <motion.span
                      key={dotIndex}
                      animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 0.9,
                        repeat: Infinity,
                        delay: dotIndex * 0.15,
                        ease: 'easeInOut',
                      }}
                      className="w-2 h-2 bg-ember rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
