'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'

const PERSISTENCE_KEY = 'GAMAM_QUERY_CACHE'
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours

// Helper to restore cache from localStorage
function restoreCache(): Record<string, any> | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const stored = localStorage.getItem(PERSISTENCE_KEY)
    if (!stored) return undefined

    const parsed = JSON.parse(stored)

    // Check if cache is too old
    const age = Date.now() - parsed.timestamp
    if (age > MAX_CACHE_AGE) {
      localStorage.removeItem(PERSISTENCE_KEY)
      return undefined
    }

    return parsed.cache
  } catch (error) {
    console.error('Error restoring query cache:', error)
    localStorage.removeItem(PERSISTENCE_KEY)
    return undefined
  }
}

// Helper to save cache to localStorage
function saveCache(cache: Record<string, any>) {
  if (typeof window === 'undefined') return

  try {
    const stored = {
      timestamp: Date.now(),
      cache,
    }
    localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Error persisting query cache:', error)
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Cache restoration from localStorage must NOT happen synchronously during
  // the initial render — the server has no localStorage, so doing it here
  // makes the client's first render diverge from the server-rendered HTML
  // (a hydration mismatch). It's restored in an effect after mount instead,
  // once hydration has already reconciled against the server output.
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          // Cache data for 10 minutes
          staleTime: 10 * 60 * 1000,
          // Keep data in cache for 30 minutes
          gcTime: 30 * 60 * 1000,
          // Retry failed requests once
          retry: 1,
          // Refetch on window focus (but use cached data if fresh)
          refetchOnWindowFocus: false,
          // Don't refetch on mount if data is fresh
          refetchOnMount: false,
          // Don't refetch on reconnect if data is fresh
          refetchOnReconnect: false,
        },
      },
    })
  )

  // Restore cache from localStorage once, after mount
  useEffect(() => {
    const restoredCache = restoreCache()
    if (!restoredCache) return

    try {
      let restoredCount = 0

      Object.entries(restoredCache).forEach(([key, value]: [string, any]) => {
        if (value && value.data !== undefined) {
          try {
            const queryKey = JSON.parse(key)
            queryClient.setQueryData(queryKey, value.data)
            restoredCount++
          } catch (e) {
            // Skip invalid cache entries
            console.warn('Skipping invalid cache entry:', key, e)
          }
        }
      })

      if (restoredCount > 0) {
        console.log(`✅ Restored ${restoredCount} queries from localStorage cache`)
      }
    } catch (error) {
      console.error('Error hydrating cache:', error)
    }
    // Runs once on mount only — the query client instance is stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save cache to localStorage whenever it changes (debounced)
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe(() => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Debounce saves to avoid too frequent writes
      saveTimeoutRef.current = setTimeout(() => {
        const cache = queryClient.getQueryCache()
        const cacheData: Record<string, any> = {}

        cache.getAll().forEach((query) => {
          if (query.state.data !== undefined && query.state.status === 'success') {
            cacheData[JSON.stringify(query.queryKey)] = {
              data: query.state.data,
              dataUpdatedAt: query.state.dataUpdatedAt,
            }
          }
        })

        saveCache(cacheData)
      }, 500) // Wait 500ms after last change
    })

    return () => {
      unsubscribe()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [queryClient])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

