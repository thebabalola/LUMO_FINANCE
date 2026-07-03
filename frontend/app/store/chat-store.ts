import { create } from 'zustand'
import { Message } from '@/types/chat'

interface ChatStore {
  messages: Message[]
  loading: boolean
  conversationId: string | null
  addMessage: (message: Message) => void
  setLoading: (loading: boolean) => void
  setConversationId: (conversationId: string | null) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  loading: false,
  conversationId: null,
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setLoading: (loading) => set({ loading }),
  setConversationId: (conversationId) => set({ conversationId }),
  clearMessages: () => set({ messages: [], conversationId: null }),
}))
