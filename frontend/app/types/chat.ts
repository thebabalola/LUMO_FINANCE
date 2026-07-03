import { TransactionIntent } from '@/components/transactions/transaction-confirmation'

export interface TransactionReceipt {
  reference: string
}

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  intent?: TransactionIntent
  receipt?: TransactionReceipt
}

export interface ChatRequest {
  message: string
  history: Message[]
}

export interface ChatResponse {
  response: string
  action?: {
    type: 'transfer' | 'airtime' | 'bill' | 'balance' | 'analyze'
    confirmed?: boolean
  }
}
