import { NextRequest, NextResponse } from 'next/server'

const WORKER_BASE_URL = process.env.NEXT_PUBLIC_WORKER_BASE_URL

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Convert message history to Claude format
    const messages = history.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    messages.push({
      role: 'user',
      content: message,
    })

    // --- MOCK DEMO INTERCEPTS ---
    const lowerMessage = message.toLowerCase()
    if (lowerMessage.includes('send') && lowerMessage.includes('john')) {
      return NextResponse.json({
        response: 'I can help you send ₦10,000 to John Doe. Please confirm the transaction details below:',
        intent: {
          type: 'transfer',
          recipientName: 'John Doe',
          bankOrProvider: 'GTBank',
          accountOrPhone: '0123456789',
          amount: 10000,
          fee: 52.50,
          total: 10052.50
        }
      })
    }
    
    if (lowerMessage.includes('airtime') && lowerMessage.includes('1,000')) {
      return NextResponse.json({
        response: 'I can help you buy ₦1,000 airtime. Please confirm the details below:',
        intent: {
          type: 'airtime',
          recipientName: 'Self',
          bankOrProvider: 'MTN',
          accountOrPhone: '08012345678',
          amount: 1000,
          fee: 0,
          total: 1000
        }
      })
    }
    
    // Fallback if WORKER_BASE_URL is not set for demo
    if (!WORKER_BASE_URL) {
      return NextResponse.json({
        response: "I'm Lumo in demo mode! I've received your message. Try saying 'Send ₦10k to John' to see a transaction confirmation."
      })
    }
    // --- END MOCK ---

    // Call Claude via Cloudflare Worker
    const response = await fetch(`${WORKER_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        system: `You are Lumo, an AI financial assistant for managing finances in Nigeria.

You can help users with:
- Sending money to bank accounts
- Checking account balance
- Buying airtime and data
- Paying bills
- Analyzing spending
- Getting transaction history

Always be clear about transaction details before execution. Every financial action requires explicit user confirmation.
Respond conversationally and use Nigerian Naira (₦) for currency.`,
      }),
    })

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      response: data.content || data.message,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
