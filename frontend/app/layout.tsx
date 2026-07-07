import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/providers/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL("https://lumofinance.vercel.app"),
  title: {
    template: "%s | Lumo Finance",
    default: "Lumo Finance — AI-Powered Financial Assistant",
  },
  description:
    "Manage your finances through natural conversation with Lumo Finance. Send money, pay bills, and track expenses effortlessly via an intelligent chat interface powered by Nomba.",
  keywords: [
    "Lumo Finance",
    "AI banking",
    "Nomba",
    "fintech",
    "conversational finance",
    "payments",
    "money transfer",
    "financial assistant",
  ],
  authors: [{ name: "Lumo Finance Team" }],
  creator: "Lumo Finance",
  openGraph: {
    type: "website",
    title: "Lumo Finance — Conversational AI Banking",
    description:
      "Send money, buy airtime, and manage your wealth simply by chatting. Experience the future of finance.",
    siteName: "Lumo Finance",
    images: [
      { url: "/lumoFi-logo.png", width: 1200, height: 630, alt: "Lumo Finance Logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumo Finance — Conversational AI Banking",
    description:
      "Send money, buy airtime, and manage your wealth simply by chatting. Experience the future of finance.",
    images: ["/lumoFi-logo.png"],
  },
  icons: {
    icon: "/lumoFi-logo.svg",
    shortcut: "/lumoFi-logo.svg",
    apple: "/lumoFi-logo.svg",
  },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
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
