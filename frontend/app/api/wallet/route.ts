import { NextResponse } from 'next/server'
import { backendAuthedFetch, backendErrorMessage } from '@/lib/server/backend'

interface BackendWalletBalance {
  balance_kobo: number
  ledger_balance_kobo: number
  currency: string
}

interface BackendLinkedAccount {
  id: string
  account_number: string
  account_name: string
  bank_name: string
  bank_code: string
  is_default: boolean
}

export async function GET() {
  try {
    const [balanceResponse, accountsResponse, profileResponse] = await Promise.all([
      backendAuthedFetch('/wallet/balance'),
      backendAuthedFetch('/wallet/accounts'),
      backendAuthedFetch('/users/me'),
    ])

    if (!balanceResponse.ok) {
      const errorMessage = await backendErrorMessage(balanceResponse, 'Failed to fetch wallet')
      return NextResponse.json({ error: errorMessage }, { status: balanceResponse.status })
    }

    const balance = (await balanceResponse.json()) as BackendWalletBalance

    // The account/profile lookups only enrich the card; the balance is the
    // essential part, so their failures fall back to empty fields.
    let defaultAccount: BackendLinkedAccount | undefined
    if (accountsResponse.ok) {
      const accountsBody = await accountsResponse.json()
      const linkedAccounts = (accountsBody.accounts ?? []) as BackendLinkedAccount[]
      defaultAccount = linkedAccounts.find((account) => account.is_default) ?? linkedAccounts[0]
    }

    let profileName = ''
    if (profileResponse.ok) {
      const profile = await profileResponse.json()
      profileName = profile.name ?? ''
    }

    return NextResponse.json({
      // The backend stores amounts in kobo; the UI displays naira.
      balance: balance.balance_kobo / 100,
      ledgerBalance: balance.ledger_balance_kobo / 100,
      currency: balance.currency,
      accountName: defaultAccount?.account_name || profileName,
      accountNumber: defaultAccount?.account_number ?? '',
      bankName: defaultAccount?.bank_name ?? 'Lumo Wallet',
    })
  } catch (error) {
    console.error('Wallet API error:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}
