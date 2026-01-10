import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/lib/query-client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import StickyBottomAd from '@/components/StickyBottomAd'

export const metadata: Metadata = {
  title: 'GAMAM Technical Interview Tracker',
  description: 'Track your progress through GAMAM technical interview problems',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2976832659170857"
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              <Navbar />
              <main className="pt-16">{children}</main>
              <StickyBottomAd />
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}

// Rebuild fix: forcing a change to clear potential cache issues
