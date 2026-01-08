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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                console.log('[ROOT LAYOUT] 🔥 Inline script executed IMMEDIATELY');
                console.log('[ROOT LAYOUT] Window location:', window.location.href);
                console.log('[ROOT LAYOUT] Document ready state:', document.readyState);
                console.log('[ROOT LAYOUT] Timestamp:', new Date().toISOString());
                
                // Check if React is loaded
                if (typeof window !== 'undefined') {
                  console.log('[ROOT LAYOUT] Window object exists');
                }
                
                // Log when DOM is ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    console.log('[ROOT LAYOUT] ✅ DOMContentLoaded fired');
                  });
                } else {
                  console.log('[ROOT LAYOUT] ✅ DOM already loaded');
                }
                
                // Log when page is fully loaded
                window.addEventListener('load', function() {
                  console.log('[ROOT LAYOUT] ✅ Window load event fired');
                });
                
                // Catch errors before React
                window.addEventListener('error', function(event) {
                  console.error('[ROOT LAYOUT] ❌ Error before React:', event.error || event.message);
                });
              })();
            `,
          }}
        />
      </head>
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
