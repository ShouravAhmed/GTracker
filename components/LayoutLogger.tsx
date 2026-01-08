'use client'

import { useEffect } from 'react'

export function LayoutLogger() {
  useEffect(() => {
    console.log('[ROOT LAYOUT] ✅ Client-side layout logger mounted')
    console.log('[ROOT LAYOUT] Window location:', window.location.href)
    console.log('[ROOT LAYOUT] Document ready state:', document.readyState)
    console.log('[ROOT LAYOUT] User agent:', navigator.userAgent)
    console.log('[ROOT LAYOUT] Timestamp:', new Date().toISOString())

    // Log when page is fully loaded
    if (document.readyState === 'complete') {
      console.log('[ROOT LAYOUT] ✅ Document already complete')
    } else {
      window.addEventListener('load', () => {
        console.log('[ROOT LAYOUT] ✅ Window load event fired')
      })
    }

    // Log navigation events
    const handlePopState = () => {
      console.log('[ROOT LAYOUT] 🔄 PopState event - Navigation occurred')
      console.log('[ROOT LAYOUT] New location:', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  return null
}

