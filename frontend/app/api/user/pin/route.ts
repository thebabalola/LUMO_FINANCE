import { NextRequest, NextResponse } from 'next/server'
import { backendAuthedFetch, backendErrorMessage } from '@/lib/server/backend'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN is required' }, { status: 400 })
    }

    const response = await backendAuthedFetch('/users/me/pin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    })
    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Failed to set transaction PIN')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }
    return NextResponse.json({ message: 'Transaction PIN set' })
  } catch (error) {
    console.error('PIN API error:', error)
    return NextResponse.json({ error: 'Failed to set transaction PIN' }, { status: 500 })
  }
}
