'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { materialSets } from '@/lib/material-sets'

console.log('[HOME PAGE] Script loaded - Starting initialization')

export default function Home() {
  console.log('[HOME PAGE] Component function called - Rendering started')
  
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  console.log('[HOME PAGE] State initialized - isMounted:', isMounted)
  console.log('[HOME PAGE] Router initialized:', !!router)
  console.log('[HOME PAGE] Material sets loaded:', materialSets.length, 'sets')

  // Ensure component is mounted on client to prevent hydration mismatch
  useEffect(() => {
    console.log('[HOME PAGE] useEffect - Mount check running')
    console.log('[HOME PAGE] Current isMounted state:', isMounted)
    setIsMounted(true)
    console.log('[HOME PAGE] isMounted set to true')
  }, [])

  // Log when component is fully mounted
  useEffect(() => {
    if (isMounted) {
      console.log('[HOME PAGE] ✅ Component fully mounted on client')
      console.log('[HOME PAGE] Material sets to render:', materialSets)
      console.log('[HOME PAGE] Total modules:', materialSets.reduce((acc, set) => acc + set.modules.length, 0))
    }
  }, [isMounted])

  /**
   * Handles clicking on a module card - navigates to the module page
   */
  const handleCardClick = (module: typeof materialSets[0]['modules'][0]) => {
    console.log('[HOME PAGE] Card clicked:', {
      moduleId: module.id,
      moduleTitle: module.title,
      route: module.route,
      type: module.type
    })
    
    if (module.route !== '#') {
      console.log('[HOME PAGE] Navigating to route:', module.route)
      try {
        router.push(module.route)
        console.log('[HOME PAGE] ✅ Navigation initiated successfully')
      } catch (error) {
        console.error('[HOME PAGE] ❌ Navigation error:', error)
      }
    } else {
      console.log('[HOME PAGE] ⚠️ Route is "#" - no navigation')
    }
  }

  // Show loading state during initial mount
  if (!isMounted) {
    console.log('[HOME PAGE] Rendering loading state (not mounted yet)')
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  console.log('[HOME PAGE] Rendering main content with', materialSets.length, 'material sets')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {materialSets.map((materialSet) => {
          console.log('[HOME PAGE] Rendering material set:', materialSet.id, 'with', materialSet.modules.length, 'modules')
          return (
            <div key={materialSet.id} className="space-y-6">
              {/* Material Set Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-left text-gray-900 dark:text-white">
                {materialSet.title}
              </h2>

              {/* Module Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {materialSet.modules.map((module) => {
                  const isDummy = module.type === 'dummy'
                  console.log('[HOME PAGE] Rendering module card:', {
                    id: module.id,
                    title: module.title,
                    route: module.route,
                    isDummy
                  })

                  return (
                    <div
                      key={module.id}
                      className={`relative group overflow-hidden rounded-2xl shadow-lg transition-all duration-500 ${
                        isDummy
                          ? 'cursor-default opacity-60'
                          : 'cursor-pointer hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl'
                      }`}
                      onClick={() => {
                        console.log('[HOME PAGE] Module card clicked:', module.id)
                        handleCardClick(module)
                      }}
                    >
                      {/* Background */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${module.colorScheme.bg} ${module.colorScheme.bgDark}`}
                      />

                      {/* Content */}
                      <div className="relative p-6 sm:p-7 h-full flex flex-col min-h-[200px]">
                        {/* Title */}
                        <div className="mb-4 flex-grow">
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 line-clamp-2 leading-tight">
                            {module.title}
                          </h3>
                          {isDummy && (
                            <p className="text-sm text-white/70">Coming Soon</p>
                          )}
                        </div>

                        {/* Action Button */}
                        {!isDummy && (
                          <div className="mt-auto pt-4">
                            <div className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 text-center">
                              <span className="text-sm font-semibold text-white">
                                View Module
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
