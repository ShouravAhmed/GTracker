import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/lib/query-client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import StickyBottomAd from '@/components/StickyBottomAd'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gamam-tracker.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GAMAM Technical Interview Tracker',
    template: '%s | GAMAM Tracker',
  },
  description: 'Track your progress through GAMAM technical interview problems. Practice coding, system design, schema design, OOD, API design, and behavioral questions.',
  keywords: ['GAMAM', 'technical interview', 'coding interview', 'system design', 'interview prep', 'leetcode', 'tracker'],
  authors: [{ name: 'GAMAM Tracker' }],
  creator: 'GAMAM Tracker',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'GAMAM Tracker',
    title: 'GAMAM Technical Interview Tracker',
    description: 'Track your progress through GAMAM technical interview problems.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GAMAM Technical Interview Tracker',
    description: 'Track your progress through GAMAM technical interview problems.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
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
