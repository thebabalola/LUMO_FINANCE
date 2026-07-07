import { NextRequest, NextResponse } from 'next/server'
import {
  TokenPair,
  backendErrorMessage,
  backendPublicFetch,
  setAuthCookies,
} from '@/lib/server/backend'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const response = await backendPublicFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })

    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Verification failed')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    // A successful verification returns a token pair, logging the user in.
    const tokenPair = (await response.json()) as TokenPair
    await setAuthCookies(tokenPair)
    return NextResponse.json({ verified: true })
  } catch (error) {
    console.error('Verify OTP API error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
