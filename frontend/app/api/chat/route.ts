import { NextRequest, NextResponse } from 'next/server'
import { backendAuthedFetch, backendErrorMessage } from '@/lib/server/backend'

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const response = await backendAuthedFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId ?? undefined,
      }),
    })

    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Failed to process message')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      response: data.message,
      conversationId: data.conversation_id,
      pendingAction: data.pending_action ?? null,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
