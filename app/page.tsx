'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSolves } from '@/lib/solves-client'
import { materialSets } from '@/lib/material-sets'
import { useModuleStats } from '@/hooks/useModuleStats'
import { useEnvironmentCheck } from '@/hooks/useEnvironmentCheck'
import { HomePageSkeleton } from '@/components/home/HomePageSkeleton'
import { ErrorDisplay } from '@/components/home/ErrorDisplay'
import { MaterialSetSection } from '@/components/home/MaterialSetSection'
import type { ModuleCard } from '@/types/home'

export default function Home() {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // Environment and error checking
  const { configError, runtimeError, setRuntimeError } = useEnvironmentCheck()

  // Ensure component is mounted on client to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Call hook unconditionally (React rules)
  // Errors will be caught by ErrorBoundary or handled in the hook itself
  const {
    problems,
    solves,
    loading,
    isAuthenticated,
    getProblemStatus,
    startProblem,
    triggerLogin,
    moduleProgress,
    checkModuleStarted,
  } = useSolves()

  // Catch any runtime errors from data processing
  useEffect(() => {
    if (!loading && problems && !Array.isArray(problems)) {
      setRuntimeError(new Error('Invalid data format received'))
    }
  }, [problems, loading, setRuntimeError])

  // Debug logging
  useEffect(() => {
    console.log(
      'Home page - Problems:',
      problems.length,
      'Loading:',
      loading,
      'Solves:',
      Object.keys(solves).length
    )
    if (problems.length === 0 && !loading) {
      console.warn('⚠️ No problems found in database. Please run: npm run upload-150day-problems')
    }
  }, [problems, loading, solves])

  // Calculate stats for each module using custom hook
  const moduleStats = useModuleStats({
    problems,
    solves,
    getProblemStatus,
    moduleProgress,
  })

  /**
   * Handles starting a module - triggers login if needed, then starts the first problem
   */
  const handleStartModule = async (moduleId: string, module: ModuleCard) => {
    if (module.type === 'dummy') {
      // Dummy modules don't have functionality yet
      return
    }

    if (!isAuthenticated) {
      await triggerLogin()
      return
    }

    const stats = moduleStats[moduleId]
    if (stats?.firstProblemId) {
      await startProblem(stats.firstProblemId)
      // Navigate to the module page
      if (module.route !== '#') {
        router.push(module.route)
      }
    }
  }

  /**
   * Handles clicking on a module card - navigates to the module page
   */
  const handleCardClick = (module: ModuleCard) => {
    if (module.route !== '#') {
      router.push(module.route)
    }
  }

  // Show error message if configuration is missing or runtime error occurred
  if (configError || runtimeError) {
    return (
      <ErrorDisplay
        title={configError ? 'Configuration Error' : 'Runtime Error'}
        message={configError || runtimeError?.message || 'An unexpected error occurred'}
        developerMessage={
          configError
                ? 'Make sure your environment variables are set in your deployment platform (Netlify, Vercel, etc.).'
            : 'Check the browser console for more details. This error may be related to data fetching or Supabase configuration.'
        }
      />
    )
  }

  // Show skeleton during initial load or before client-side mount
  if (!isMounted || loading) {
    return <HomePageSkeleton />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {materialSets.map((materialSet) => (
          <MaterialSetSection
            key={materialSet.id}
            materialSet={materialSet}
            moduleStats={moduleStats}
            moduleProgress={moduleProgress}
            checkModuleStarted={checkModuleStarted}
            onCardClick={handleCardClick}
            onStartModule={handleStartModule}
          />
        ))}
      </div>
    </div>
  )
}
