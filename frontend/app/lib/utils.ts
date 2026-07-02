export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  })
  return formatter.format(amount)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return d.toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('0')) {
    return `+234${digits.slice(1)}`
  }
  return phone
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
