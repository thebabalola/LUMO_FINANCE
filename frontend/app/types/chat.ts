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
  // Present when the assistant prepared a money-moving action that is
  // waiting for the user's PIN confirmation. Holds the action_id needed
  // by /api/chat/confirm and /api/chat/cancel.
  pendingAction?: PendingAction
}

export interface ChatRequest {
  message: string
  conversationId?: string | null
}

// A money-moving action the AI prepared; it executes only after the user
// confirms with their PIN via the backend's /chat/confirm endpoint.
export interface PendingAction {
  action_id: string
  type: 'transfer' | 'airtime' | 'data' | 'bill'
  amount_kobo: number
  recipient: string
  recipient_name?: string
  summary: string
  expires_at: string
}

export interface ChatResponse {
  response: string
  conversationId: string
  pendingAction?: PendingAction | null
}
