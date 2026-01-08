import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/lib/query-client'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LayoutLogger } from '@/components/LayoutLogger'

console.log('[ROOT LAYOUT] Layout script loaded - Server Component')

export const metadata: Metadata = {
  title: 'GAMAM Technical Interview Tracker',
  description: 'Track your progress through GAMAM technical interview problems',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('[ROOT LAYOUT] RootLayout function called - Rendering layout')
  console.log('[ROOT LAYOUT] Children type:', typeof children)

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <LayoutLogger />
        <ErrorBoundary>
          <QueryProvider>
            <ThemeProvider>
              <Navbar />
              <main className="pt-16">
                {(() => {
                  console.log('[ROOT LAYOUT] Rendering children in main tag')
                  return children
                })()}
              </main>
            </ThemeProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
