export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
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
