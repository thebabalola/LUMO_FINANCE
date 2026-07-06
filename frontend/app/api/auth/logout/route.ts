import { NextResponse } from 'next/server'
import { backendPublicFetch, clearAuthCookies, getRefreshToken } from '@/lib/server/backend'

export async function POST() {
  try {
    const refreshToken = await getRefreshToken()
    if (refreshToken) {
      // Best-effort revocation; the cookies are cleared regardless.
      await backendPublicFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => undefined)
    }
    await clearAuthCookies()
    return NextResponse.json({ loggedOut: true })
  } catch (error) {
    console.error('Logout API error:', error)
    await clearAuthCookies()
    return NextResponse.json({ loggedOut: true })
  }
}
