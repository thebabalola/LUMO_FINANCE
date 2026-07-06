import { NextRequest, NextResponse } from 'next/server'
import { backendAuthedFetch, backendErrorMessage } from '@/lib/server/backend'

export async function POST(request: NextRequest) {
  try {
    const { actionId, pin } = await request.json()

    if (!actionId || !pin) {
      return NextResponse.json({ error: 'Action ID and PIN are required' }, { status: 400 })
    }

    const response = await backendAuthedFetch('/chat/confirm', {
      method: 'POST',
      body: JSON.stringify({ action_id: actionId, pin }),
    })

    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Failed to confirm transaction')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({
      message: data.message,
      transaction: data.transaction,
    })
  } catch (error) {
    console.error('Chat confirm API error:', error)
    return NextResponse.json({ error: 'Failed to confirm transaction' }, { status: 500 })
  }
}
