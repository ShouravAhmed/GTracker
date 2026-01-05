import { useEffect, useState } from 'react'

interface EnvironmentCheckResult {
  configError: string | null
  runtimeError: Error | null
  setRuntimeError: (error: Error | null) => void
}

/**
 * Custom hook to check for required environment variables
 * and handle runtime errors
 */
export function useEnvironmentCheck(): EnvironmentCheckResult {
  const [configError, setConfigError] = useState<string | null>(null)
  const [runtimeError, setRuntimeError] = useState<Error | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        setConfigError(
          'Missing Supabase configuration. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.'
        )
      }
    }
  }, [])

  return {
    configError,
    runtimeError,
    setRuntimeError,
  }
}

