'use client'

import { useEffect, useState, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

const DELAY_MS = 7000 // 7 seconds
const AD_CHECK_DELAY = 3000 // Check if ad loaded after 3 seconds

export default function StickyBottomAd() {
  const [isVisible, setIsVisible] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const adRef = useRef<HTMLModElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const adCheckRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set timeout to show ad after delay on every page load
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, DELAY_MS)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (adCheckRef.current) {
        clearTimeout(adCheckRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Initialize AdSense after component mounts and ad becomes visible
    if (isVisible && typeof window !== 'undefined') {
      try {
        // Ensure adsbygoogle array exists
        window.adsbygoogle = window.adsbygoogle || []
        
        // Push ad configuration
        window.adsbygoogle.push({})

        // Check if ad loaded after a delay
        adCheckRef.current = setTimeout(() => {
          if (adRef.current) {
            const adElement = adRef.current
            // Check if ad has content (AdSense adds iframes or content)
            const hasContent = 
              adElement.querySelector('iframe') !== null ||
              adElement.querySelector('ins > *') !== null ||
              adElement.offsetHeight > 50 // AdSense ads typically have height
            
            if (!hasContent) {
              setShowFallback(true)
            }
          }
        }, AD_CHECK_DELAY)
      } catch (error) {
        console.error('Error initializing AdSense:', error)
        setShowFallback(true)
      }
    }
  }, [isVisible])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center px-2 sm:px-4 pb-1 sm:pb-2 transition-transform duration-500 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-label="Advertisement"
    >
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-xl overflow-hidden">
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-white/70 via-white/60 to-white/50 dark:from-gray-900/70 dark:via-gray-900/60 dark:to-gray-900/50 border border-white/30 dark:border-gray-700/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]" />
        
        {/* Inner Glow Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 dark:to-transparent rounded-xl pointer-events-none" />
        
        {/* AdSense Container - Responsive */}
        <div className="relative p-0.5 sm:p-1 md:p-1.5 w-full z-10 min-h-[50px] flex items-center justify-center">
          {showFallback ? (
            <div className="w-full flex items-center justify-between px-2 sm:px-3 py-1 gap-2 sm:gap-3">
              {/* Left side - Main message */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-shrink-0 text-base sm:text-lg">🎯</div>
                <div className="flex flex-col min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                    Support GAMAM Tracker
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">
                    Free & Open Source
                  </div>
                </div>
              </div>
              
              {/* Right side - Features */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
                  <span>🚀</span>
                  <span className="hidden sm:inline">Resources</span>
                </div>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
                  <span>📚</span>
                  <span className="hidden sm:inline">Tools</span>
                </div>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
                  <span>💡</span>
                  <span className="hidden sm:inline">Prep</span>
                </div>
              </div>
            </div>
          ) : (
            <ins
              ref={adRef}
              className="adsbygoogle block text-center w-full"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-2976832659170857"
              data-ad-slot="7126474029"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          )}
        </div>
      </div>
    </div>
  )
}

