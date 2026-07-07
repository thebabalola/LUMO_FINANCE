import { cookies } from 'next/headers'

// Points at the Go backend's /api/v1. Name kept for compatibility — this now
// points at the Go backend, not the Cloudflare Worker.
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_WORKER_BASE_URL

// Cookie names. `auth-token` is also what frontend/middleware.ts checks to
// guard the app routes, so the two must stay in sync.
export const ACCESS_TOKEN_COOKIE = 'auth-token'
export const REFRESH_TOKEN_COOKIE = 'refresh-token'

// Matches the backend's refresh-token TTL (7 days).
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export interface TokenPair {
  access_token: string
  refresh_token: string
  expires_in: number
}

const isProduction = process.env.NODE_ENV === 'production'

export async function setAuthCookies(tokenPair: TokenPair): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ACCESS_TOKEN_COOKIE, tokenPair.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: tokenPair.expires_in,
  })
  cookieStore.set(REFRESH_TOKEN_COOKIE, tokenPair.refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  })
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null
}

async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  if (cookieToken) {
    return cookieToken
  }
  // Dev fallback so the app still works before logging in when a developer
  // has set a token in the environment (see frontend/.env.example).
  return process.env.LUMO_DEV_BEARER_TOKEN ?? null
}

export function backendUrl(path: string): string {
  return `${BACKEND_BASE_URL}${path}`
}

// Calls a public (unauthenticated) backend endpoint.
export async function backendPublicFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(backendUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

// Calls a protected backend endpoint with the caller's access token. If the
// access token has expired (401) and a refresh token is available, refreshes
// once, updates the auth cookies, and retries the original request.
export async function backendAuthedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = await getAccessToken()

  const doFetch = (token: string | null) =>
    fetch(backendUrl(path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })

  const response = await doFetch(accessToken)
  if (response.status !== 401) {
    return response
  }

  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    return response
  }

  const refreshResponse = await backendPublicFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!refreshResponse.ok) {
    await clearAuthCookies()
    return response
  }

  const newTokenPair = (await refreshResponse.json()) as TokenPair
  await setAuthCookies(newTokenPair)
  return doFetch(newTokenPair.access_token)
}

// Extracts the backend's error message (Fiber returns {"error": "..."}),
// falling back to a generic message.
export async function backendErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body?.error === 'string' && body.error.length > 0) {
      return body.error
    }
  } catch {
    // Non-JSON error body — use the fallback.
  }
  return fallback
}
