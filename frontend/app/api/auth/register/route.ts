import { NextRequest, NextResponse } from 'next/server'
import { backendErrorMessage, backendPublicFetch } from '@/lib/server/backend'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, email, phone and password are required' },
        { status: 400 }
      )
    }

    const response = await backendPublicFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password }),
    })

    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Registration failed')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ userId: data.user_id, message: data.message }, { status: 201 })
  } catch (error) {
    console.error('Register API error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
