import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/lib/query-client'

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
        <QueryProvider>
          <ThemeProvider>
            <Navbar />
            <main className="pt-16">{children}</main>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

