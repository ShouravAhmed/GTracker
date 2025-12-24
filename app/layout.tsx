import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

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
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  )
}

