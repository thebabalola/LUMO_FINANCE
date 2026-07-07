import { NextResponse } from 'next/server'

// Disable all middleware restrictions during UI development
export function middleware() {
  return NextResponse.next()
}
