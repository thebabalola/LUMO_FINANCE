import { NextRequest, NextResponse } from 'next/server'
import { backendErrorMessage, backendPublicFetch, setAuthCookies } from '@/lib/server/backend'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const response = await backendPublicFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Login failed')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    await setAuthCookies({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    })
    return NextResponse.json({ user: data.user })
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
