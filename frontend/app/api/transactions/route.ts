import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') || '10'

    // In a real app, fetch from Nomba API via Worker
    // For now, return mock data
    const transactions = [
      {
        id: '1',
        type: 'transfer',
        amount: 50000,
        recipient: 'David Okafor',
        status: 'completed',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '2',
        type: 'airtime',
        amount: 1000,
        recipient: 'MTN Airtime',
        status: 'completed',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '3',
        type: 'bill',
        amount: 5000,
        recipient: 'EKEDC',
        status: 'completed',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '4',
        type: 'data',
        amount: 500,
        recipient: 'Glo Data',
        status: 'pending',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: '5',
        type: 'transfer',
        amount: 25000,
        recipient: 'Jane Doe',
        status: 'completed',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
      },
    ]

    return NextResponse.json(transactions.slice(0, parseInt(limit)))
  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
