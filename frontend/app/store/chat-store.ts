import { create } from 'zustand'
import { Message } from '@/types/chat'

interface ChatStore {
  messages: Message[]
  loading: boolean
  inputValue: string
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  setLoading: (loading: boolean) => void
  setInputValue: (value: string) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  loading: false,
  inputValue: '',
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),
  setLoading: (loading) => set({ loading }),
  setInputValue: (value) => set({ inputValue: value }),
  clearMessages: () => set({ messages: [] }),
}))
