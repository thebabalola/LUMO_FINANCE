'use client'

import { Message } from '@/types/chat'
import { formatTime } from '@/lib/utils'

interface ChatMessagesProps {
  messages: Message[]
  loading: boolean
}

export default function ChatMessages({ messages, loading }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <p className="text-dark-400 text-sm">
              Hello! I'm Lumo, your AI financial assistant.
            </p>
            <p className="text-dark-500 text-xs mt-2">
              Try: "Send ₦10,000 to David" or "Check my balance"
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-50'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))
      )}

      {loading && (
        <div className="flex justify-start">
          <div className="bg-dark-700 text-dark-50 px-4 py-2 rounded-lg">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-dark-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
