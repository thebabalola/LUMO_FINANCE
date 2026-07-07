import { NextRequest, NextResponse } from 'next/server'
import { backendAuthedFetch, backendErrorMessage } from '@/lib/server/backend'

export async function POST(request: NextRequest) {
  try {
    const { actionId } = await request.json()

    if (!actionId) {
      return NextResponse.json({ error: 'Action ID is required' }, { status: 400 })
    }

    const response = await backendAuthedFetch('/chat/cancel', {
      method: 'POST',
      body: JSON.stringify({ action_id: actionId }),
    })

    // A 410 means the action already expired — treat that as cancelled.
    if (!response.ok && response.status !== 410) {
      const errorMessage = await backendErrorMessage(response, 'Failed to cancel transaction')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    return NextResponse.json({ cancelled: true })
  } catch (error) {
    console.error('Chat cancel API error:', error)
    return NextResponse.json({ error: 'Failed to cancel transaction' }, { status: 500 })
  }
}
