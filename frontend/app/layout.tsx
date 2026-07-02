import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lumo Finance - AI Financial Assistant',
  description: 'Manage your finances through natural conversation with Lumo Finance. Send money, pay bills, and track expenses via chat.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23EB6028"/><text x="50" y="70" font-family="sans-serif" font-size="60" font-weight="bold" fill="%23FCECDC" text-anchor="middle">L</text></svg>'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-brown text-cream antialiased selection:bg-ember/30 selection:text-cream">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
