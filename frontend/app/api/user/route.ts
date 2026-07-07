import { NextRequest, NextResponse } from 'next/server'
import { backendAuthedFetch, backendErrorMessage } from '@/lib/server/backend'

export async function GET() {
  try {
    const response = await backendAuthedFetch('/users/me')
    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Failed to fetch profile')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }
    const profile = await response.json()
    return NextResponse.json(profile)
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { name, phone } = await request.json()
    const response = await backendAuthedFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify({ name, phone }),
    })
    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Failed to update profile')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }
    const profile = await response.json()
    return NextResponse.json(profile)
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
