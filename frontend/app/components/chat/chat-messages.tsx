'use client'

import { Message } from '@/types/chat'
import { formatTime } from '@/lib/utils'
import { Copy, Bot } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { TransactionConfirmationCard, TransactionIntent } from '../transactions/transaction-confirmation'
import { TransactionReceiptCard } from '../transactions/transaction-receipt'
import { useChatStore } from '@/store/chat-store'

interface ChatMessagesProps {
  messages: Message[]
  loading: boolean
}

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

  const handleConfirm = async (messageId: string, intent: TransactionIntent) => {
    // In a real app, we would make a POST to /api/transactions/execute here
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // On success, replace intent with receipt
    updateMessage(messageId, {
      intent: undefined, // remove intent to swap to receipt card
      receipt: { reference: `NMB-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000)}` },
      // preserve the intent data in a separate field if needed, but we can also just keep it
      // actually, TransactionReceiptCard needs the intent data. Let's keep intent on the message but add receipt!
      intent: intent
    })
  }

  const handleCancel = (messageId: string) => {
    updateMessage(messageId, {
      intent: undefined,
      content: 'Transaction cancelled.'
    })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-end space-y-4">
      {messages.length === 0 ? (
        <div className="text-center mb-8 h-full flex flex-col justify-center items-center">
          <div className="w-16 h-16 rounded-2xl bg-ember/20 text-ember mx-auto flex items-center justify-center mb-4">
            <span className="font-heading text-2xl font-bold">L</span>
          </div>
          <h3 className="font-heading text-xl font-medium text-cream mb-2">How can I help you today?</h3>
          <p className="text-sm text-cream/70 max-w-md mx-auto">
            Try asking me to send money, buy airtime, or check your transaction history.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
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
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* Render Confirmation Card if intent exists and no receipt yet */}
                    {message.intent && !message.receipt && (
                      <div className="mt-4 mb-1">
                        <TransactionConfirmationCard 
                          intent={message.intent}
                          onConfirm={() => handleConfirm(message.id, message.intent!)}
                          onCancel={() => handleCancel(message.id)}
                        />
                      </div>
                    )}
                    
                    {/* Render Receipt Card if receipt exists */}
                    {message.receipt && message.intent && (
                      <div className="mt-4 mb-1">
                        <TransactionReceiptCard 
                          intent={message.intent}
                          reference={message.receipt.reference}
                          onDone={() => {
                            // Can just scroll or acknowledge
                            addMessage({
                              id: Date.now().toString(),
                              content: 'Is there anything else you need help with?',
                              role: 'assistant',
                              timestamp: new Date()
                            })
                          }}
                        />
                      </div>
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
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-start">
           <div className="flex gap-3 max-w-[85%]">
             <div className="w-8 h-8 rounded-full bg-ember/20 text-ember flex items-center justify-center flex-shrink-0 mt-1">
               <Bot size={16} />
             </div>
             <div className="bg-white/5 border border-white/5 text-cream px-4 py-3 rounded-2xl rounded-tl-sm backdrop-blur-sm flex items-center">
               <div className="flex space-x-1.5">
                 <div className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                 <div className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                 <div className="w-2 h-2 bg-ember rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  )
}


