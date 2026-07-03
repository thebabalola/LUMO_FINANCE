'use client'

import { useRef, useEffect } from 'react'
import ChatMessages from './chat-messages'
import ChatInput from './chat-input'
import { useChatStore } from '@/store/chat-store'

export default function ChatInterface() {
  const { messages, addMessage, loading, setLoading, conversationId, setConversationId } = useChatStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      })
    } catch (error) {
      console.error('Chat error:', error)
      addMessage({
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-dark-800 rounded-lg border border-dark-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-dark-700">
        <h2 className="text-lg font-semibold text-dark-50">Lumo Assistant</h2>
        <p className="text-xs text-dark-400">Financial commands via chat</p>
      </div>

      {/* Messages */}
      <ChatMessages messages={messages} loading={loading} />
      <div ref={messagesEndRef} />

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
    </div>
  )
}
