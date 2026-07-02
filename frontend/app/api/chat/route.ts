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
