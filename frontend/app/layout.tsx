import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumo Finance - AI Financial Assistant',
  description: 'Manage your finances through natural conversation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dark-900 text-dark-50">
        {children}
      </body>
    </html>
  )
}
