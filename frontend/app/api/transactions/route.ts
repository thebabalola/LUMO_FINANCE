import { NextRequest, NextResponse } from 'next/server'
import { backendAuthedFetch, backendErrorMessage } from '@/lib/server/backend'

interface BackendTransaction {
  id: string
  type: string
  amount: number
  recipient: string
  status: string
  created_at: string
  reference: string
}

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit') || '20'

    const response = await backendAuthedFetch(`/transactions?limit=${encodeURIComponent(limit)}`)
    if (!response.ok) {
      const errorMessage = await backendErrorMessage(response, 'Failed to fetch transactions')
      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const body = await response.json()
    const backendTransactions = (body.transactions ?? []) as BackendTransaction[]

    const transactions = backendTransactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      // The backend stores amounts in kobo; the UI displays naira.
      amount: transaction.amount / 100,
      recipient: transaction.recipient,
      status: transaction.status,
      timestamp: transaction.created_at,
      reference: transaction.reference,
    }))

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
