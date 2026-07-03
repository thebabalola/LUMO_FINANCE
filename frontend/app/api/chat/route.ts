import { NextRequest, NextResponse } from 'next/server'

// Points at the Go backend's /api/v1 (conversation memory lives server-side
// there, so no history is forwarded from the client anymore).
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_WORKER_BASE_URL

// TODO(frontend-auth workstream): replace this dev-only server env token
// with the logged-in user's access token once frontend auth lands.
const DEV_BEARER_TOKEN = process.env.LUMO_DEV_BEARER_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(DEV_BEARER_TOKEN ? { Authorization: `Bearer ${DEV_BEARER_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId ?? undefined,
      }),
    })

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
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
