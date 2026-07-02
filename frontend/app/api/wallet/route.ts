import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // In a real app, fetch from Nomba API via Worker
    // For now, return mock data
    const walletData = {
      balance: 250000,
      accountName: 'Nonso Okafor',
      accountNumber: '0123456789',
      currency: 'NGN',
      bankName: 'Nomba Bank',
    }

    return NextResponse.json(walletData)
  } catch (error) {
    console.error('Wallet API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    )
  }
}
