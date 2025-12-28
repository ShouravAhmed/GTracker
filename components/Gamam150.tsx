'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSolves } from '@/lib/solves-client'
import { Play, Timer, NotepadText, Users, Clock, CheckCircle, X, Pause, RotateCcw, Bold, Italic, Underline, Link, List } from 'lucide-react'
import type { Problem as DBProblem } from '@/lib/supabase/solves'
import { useTheme } from './ThemeProvider'

type ProblemData = Record<string, DBProblem[]>

export default function Gamam150() {
  const {
    problems,
    solves,
    solveCounts,
    loading: solvesLoading,
    isAuthenticated,
    getProblemStatus,
    getUserSolve,
    toggleProblemStatus,
    startProblem,
    updateFocusTime,
    updateNote,
    triggerLogin,
  } = useSolves()

  const [codingProblems, setCodingProblems] = useState<ProblemData>({})
  const [expandedProblem, setExpandedProblem] = useState<{
    id: string
    showNote: boolean
    showFocus: boolean
  } | null>(null)
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({})
  const [lastSavedTimes, setLastSavedTimes] = useState<Record<string, number>>({})
  const [focusTimeElapsed, setFocusTimeElapsed] = useState<Record<string, number>>({}) // Track focus time elapsed for each problem

  const [isCodingChecked, setIsCodingChecked] = useState(true)
  const [isSystemDesignChecked, setIsSystemDesignChecked] = useState(true)
  const [isObjectOrientedDesignChecked, setIsObjectOrientedDesignChecked] = useState(true)
  const [isSchemaDesignChecked, setIsSchemaDesignChecked] = useState(true)
  const [isApiDesignChecked, setIsApiDesignChecked] = useState(true)
  const [isBehavioralChecked, setIsBehavioralChecked] = useState(true)

  // Organize problems by day and filter by category
  useEffect(() => {
    if (!problems || problems.length === 0) return

    const data: ProblemData = {}

    for (const problem of problems) {
      const type = problem.type
      const shouldInclude =
        (type === 'Coding' && isCodingChecked) ||
        (type === 'System Design' && isSystemDesignChecked) ||
        (type === 'Object Oriented Design' && isObjectOrientedDesignChecked) ||
        (type === 'Schema Design' && isSchemaDesignChecked) ||
        (type === 'API Design' && isApiDesignChecked) ||
        (type === 'Behavioral' && isBehavioralChecked)

      if (!shouldInclude) continue

      const day = problem.day !== null && problem.day !== undefined ? problem.day.toString() : 'other'
      if (!(day in data)) {
        data[day] = []
      }
      data[day].push(problem)
    }

    // Sort days
    const sortedData: ProblemData = {}
    const sortedDays = Object.keys(data).sort((a, b) => {
      if (a === 'other') return 1
      if (b === 'other') return -1
      return parseInt(a) - parseInt(b)
    })

    for (const day of sortedDays) {
      sortedData[day] = data[day].sort((a, b) => a.name.localeCompare(b.name))
    }

    setCodingProblems(sortedData)
  }, [problems, isCodingChecked, isSystemDesignChecked, isObjectOrientedDesignChecked, isSchemaDesignChecked, isApiDesignChecked, isBehavioralChecked])

  // Calculate elapsed times for problems that are in progress
  // Time calculation:
  // - When in progress: now - started_at
  // - When solved: solved_at - started_at
  useEffect(() => {
    // Recalculate elapsed times immediately when solves change or tab becomes visible
    const recalculateTimes = () => {
      const now = Date.now()
      const newElapsedTimes: Record<string, number> = {}
      
      for (const [problemId, userSolve] of Object.entries(solves)) {
        if (userSolve.started_at) {
          if (!userSolve.solved && userSolve.started_at) {
            // In progress: calculate elapsed time from started_at to now
            const startTime = new Date(userSolve.started_at).getTime()
            const elapsed = Math.floor((now - startTime) / 1000)
            newElapsedTimes[problemId] = elapsed
          } else if (userSolve.solved && userSolve.solved_at && userSolve.started_at) {
            // Solved: calculate time from started_at to solved_at
            const startTime = new Date(userSolve.started_at).getTime()
            const solvedTime = new Date(userSolve.solved_at).getTime()
            const elapsed = Math.floor((solvedTime - startTime) / 1000)
            newElapsedTimes[problemId] = elapsed
          }
        }
      }
      
      setElapsedTimes(newElapsedTimes)
    }

    // Recalculate immediately
    recalculateTimes()

    // Set up interval for continuous updates
    const interval = setInterval(recalculateTimes, 1000) // Update every second for real-time display

    // Handle visibility change to recalculate when tab becomes visible again
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, recalculate times immediately
        recalculateTimes()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [solves])

  const isDayCompleted = (day: string): boolean => {
    const problems = codingProblems[day]
    if (!problems) return false
    let cnt = 0
    for (const problem of problems) {
      if (getProblemStatus(problem.id)) {
        cnt += 1
      }
    }
    return cnt === problems.length
  }

  const updateProblemStatus = async (problemId: string) => {
    if (!isAuthenticated) {
      try {
        await triggerLogin()
      } catch (error) {
        console.error('Failed to trigger login:', error)
      }
      return
    }

    await toggleProblemStatus(problemId)
  }

  const handleStartProblem = async (problemId: string) => {
    if (!isAuthenticated) {
      try {
        await triggerLogin()
      } catch (error) {
        console.error('Failed to trigger login:', error)
      }
      return
    }

    await startProblem(problemId)
  }

  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) return `${mins}m ${secs}s`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const handleFocusTimeComplete = async (problemId: string, seconds: number) => {
    // Save any remaining focus time that hasn't been saved
    const lastSaved = lastSavedTimes[problemId] || 0
    if (seconds > lastSaved) {
      const remainingSeconds = seconds - lastSaved
      await updateFocusTime(problemId, remainingSeconds)
      setLastSavedTimes(prev => ({ ...prev, [problemId]: seconds }))
    }
    // Clear focus time elapsed after saving
    setFocusTimeElapsed(prev => {
      const newTimes = { ...prev }
      delete newTimes[problemId]
      return newTimes
    })
    setLastSavedTimes(prev => {
      const newTimes = { ...prev }
      delete newTimes[problemId]
      return newTimes
    })
    // Keep expanded - don't close on completion
  }

  const handleFocusTimeUpdate = async (problemId: string, seconds: number) => {
    // Save the additional elapsed time
    await updateFocusTime(problemId, seconds)
    // Update last saved time
    setLastSavedTimes(prev => ({ ...prev, [problemId]: (prev[problemId] || 0) + seconds }))
  }

  const handleNoteSave = async (problemId: string, content: string) => {
    await updateNote(problemId, content)
    // Note editor stays open, just save
  }

  const handleCloseFocusView = async (problemId: string) => {
    // Save any remaining focus time elapsed before closing
    const currentElapsed = focusTimeElapsed[problemId] || 0
    const lastSaved = lastSavedTimes[problemId] || 0
    if (currentElapsed > lastSaved) {
      // Save the remaining time that hasn't been auto-saved
      const remainingSeconds = currentElapsed - lastSaved
      if (remainingSeconds > 0) {
        await handleFocusTimeUpdate(problemId, remainingSeconds)
      }
    }
    // Clear focus time elapsed for this problem
    setFocusTimeElapsed(prev => {
      const newTimes = { ...prev }
      delete newTimes[problemId]
      return newTimes
    })
    setLastSavedTimes(prev => {
      const newTimes = { ...prev }
      delete newTimes[problemId]
      return newTimes
    })
    setExpandedProblem(null)
  }

  const toggleNote = (problemId: string) => {
    setExpandedProblem(prev => {
      if (prev && prev.id === problemId) {
        // If already expanded, collapse
        return null
      }
      // Expand with both note and focus enabled
      return { id: problemId, showNote: true, showFocus: true }
    })
  }

  const toggleFocus = (problemId: string) => {
    setExpandedProblem(prev => {
      if (prev && prev.id === problemId) {
        // If already expanded, collapse
        return null
      }
      // Expand with both note and focus enabled
      return { id: problemId, showNote: true, showFocus: true }
    })
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) return `${mins}m ${secs}s`
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h ${remainingMins}m`
  }

  const getTimeComponents = (seconds: number): { hours: number; minutes: number; seconds: number } => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return { hours, minutes, seconds: secs }
  }

  const totalSolved = useMemo(() => {
    return Object.values(codingProblems).reduce((total, problems) => {
      return total + problems.filter(problem => getProblemStatus(problem.id)).length
    }, 0)
  }, [codingProblems, solves])

  const daysCompleted = useMemo(() => {
    return Object.keys(codingProblems).filter(day => isDayCompleted(day)).length
  }, [codingProblems, solves])

  const getDifficultyColor = (difficulty?: string): string => {
    if (!difficulty) return ''
    if (difficulty === '(Easy)') return 'text-green-600 dark:text-green-400'
    if (difficulty === '(Medium)') return 'text-orange-600 dark:text-orange-400'
    if (difficulty === '(Hard)') return 'text-red-600 dark:text-red-400'
    return ''
  }

  const getGlassMorphismStyles = (difficulty?: string): string => {
    if (!difficulty) {
      return 'bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 text-gray-900 dark:text-white'
    }
    if (difficulty === '(Easy)') {
      return 'bg-green-500/20 dark:bg-green-400/20 border-green-500/30 dark:border-green-400/30 text-green-700 dark:text-green-300'
    }
    if (difficulty === '(Medium)') {
      return 'bg-yellow-500/20 dark:bg-yellow-400/20 border-yellow-500/30 dark:border-yellow-400/30 text-yellow-700 dark:text-yellow-300'
    }
    if (difficulty === '(Hard)') {
      return 'bg-red-500/20 dark:bg-red-400/20 border-red-500/30 dark:border-red-400/30 text-red-700 dark:text-red-300'
    }
    return 'bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 text-gray-900 dark:text-white'
  }

  // Skeleton loading component
  const SkeletonLoader = () => (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Title skeleton */}
        <div className="mb-6 sm:mb-10">
          <div className="h-8 sm:h-10 lg:h-12 w-64 sm:w-80 mx-auto bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats section skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 sm:h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-2">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 sm:h-10 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Filter checkboxes skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Day cards skeleton */}
        <div className="space-y-4 sm:space-y-6">
          {[...Array(3)].map((_, dayIndex) => (
            <div key={dayIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
              {/* Day header skeleton */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="h-6 sm:h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              </div>

              {/* Problem rows skeleton */}
              <div className="space-y-3">
                {[...Array(4)].map((_, problemIndex) => (
                  <div
                    key={problemIndex}
                    className="grid grid-cols-1 sm:grid-cols-[40px_1fr_auto_auto_auto_auto_auto_auto] gap-2 sm:gap-4 items-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    {/* Number */}
                    <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto sm:mx-0"></div>
                    
                    {/* Problem name and solve count */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-5 w-48 sm:w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>

                    {/* Solving time skeleton */}
                    <div className="flex flex-col gap-0.5">
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                      <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
                    </div>

                    {/* Focus time skeleton */}
                    <div className="flex flex-col gap-0.5">
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                        ))}
                      </div>
                      <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto"></div>
                    </div>

                    {/* Type/Difficulty skeleton */}
                    <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

                    {/* Focus button skeleton */}
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

                    {/* Note button skeleton */}
                    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>

                    {/* State button skeleton */}
                    <div className="h-8 w-20 sm:w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Show skeleton loader when data is loading or problems haven't loaded yet
  if (solvesLoading || problems.length === 0) {
    return <SkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-10">
          GAMAM 150 Day Tracker
        </h1>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Day Completed</span>
            <strong className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{daysCompleted}</strong>
          </div>
          <div className="flex flex-col items-center sm:items-end">
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Total Solved</span>
            <strong className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{totalSolved}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="coding"
              checked={isCodingChecked}
              onChange={() => setIsCodingChecked(!isCodingChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="coding" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              Coding
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="system-design"
              checked={isSystemDesignChecked}
              onChange={() => setIsSystemDesignChecked(!isSystemDesignChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="system-design" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              System Design
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="object-oriented-design"
              checked={isObjectOrientedDesignChecked}
              onChange={() => setIsObjectOrientedDesignChecked(!isObjectOrientedDesignChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="object-oriented-design" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              OOD
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="schema-design"
              checked={isSchemaDesignChecked}
              onChange={() => setIsSchemaDesignChecked(!isSchemaDesignChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="schema-design" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              Schema Design
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="api-design"
              checked={isApiDesignChecked}
              onChange={() => setIsApiDesignChecked(!isApiDesignChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="api-design" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              API Design
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="behavioral"
              checked={isBehavioralChecked}
              onChange={() => setIsBehavioralChecked(!isBehavioralChecked)}
              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="behavioral" className="text-sm sm:text-base text-gray-700 dark:text-gray-300 cursor-pointer">
              Behavioral
            </label>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {Object.entries(codingProblems).map(([day, problems]) => (
            <div key={day} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Day {day === 'other' ? '?' : parseInt(day) + 1}
                </span>
                <span
                  className={`px-4 sm:px-8 py-2 text-sm sm:text-base font-bold rounded-full ${
                    isDayCompleted(day)
                      ? 'bg-green-600 dark:bg-green-500 text-white'
                      : 'bg-red-600 dark:bg-red-500 text-white'
                  }`}
                >
                  {isDayCompleted(day) ? 'Completed' : 'Pending'}
                </span>
              </div>
              <div className="space-y-3">
                {problems.map((problem) => {
                  const isSolved = getProblemStatus(problem.id)
                  const userSolve = getUserSolve(problem.id)
                  const solveCount = solveCounts[problem.id] || 0
                  const hasNote = userSolve?.note && userSolve.note.trim().length > 0
                  const hasStarted = !!userSolve?.started_at
                  const isInProgress = hasStarted && !isSolved
                  
                  // Calculate solving time
                  // When in progress: now - started_at
                  // When solved: solved_at - started_at
                  let solvingTime: number = 0
                  if (isInProgress && userSolve?.started_at) {
                    // If in progress, show live elapsed time
                    if (elapsedTimes[problem.id] !== undefined) {
                      solvingTime = elapsedTimes[problem.id]
                    } else {
                      const startTime = new Date(userSolve.started_at).getTime()
                      solvingTime = Math.floor((Date.now() - startTime) / 1000)
                    }
                  } else if (isSolved && userSolve?.solved_at && userSolve?.started_at) {
                    // If solved, show time from started_at to solved_at
                    if (elapsedTimes[problem.id] !== undefined) {
                      solvingTime = elapsedTimes[problem.id]
                    } else {
                      const startTime = new Date(userSolve.started_at).getTime()
                      const solvedTime = new Date(userSolve.solved_at).getTime()
                      solvingTime = Math.floor((solvedTime - startTime) / 1000)
                    }
                  }

                  const isExpanded = expandedProblem?.id === problem.id && (expandedProblem.showNote || expandedProblem.showFocus)

                  return (
                    <div
                      key={problem.id}
                      className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-all duration-300 ease-in-out"
                    >
                      {!isExpanded ? (
                        // Normal collapsed view
                        <div className="grid grid-cols-1 sm:grid-cols-[40px_1fr_auto_auto_auto_auto_auto_140px] gap-2 sm:gap-4 items-center py-2 sm:py-3">
                      <span className="text-center font-bold text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                        {problems.indexOf(problem) + 1}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <a
                          href={problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base truncate"
                        >
                          {problem.name}
                        </a>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <Users size={14} />
                          <span>{solveCount}</span>
                        </div>
                      </div>
                      {/* Solving time column */}
                      <div className="relative">
                        <div className="flex flex-col gap-0.5">
                          <div className="grid grid-cols-3 gap-0.5">
                            {(() => {
                              const { hours, minutes, seconds: secs } = getTimeComponents(solvingTime)
                              return (
                                <>
                                  <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                    <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                                      {String(hours).padStart(2, '0')}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                    <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                                      {String(minutes).padStart(2, '0')}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                    <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                                      {String(secs).padStart(2, '0')}
                                    </span>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                          <span className="text-[8px] text-gray-500 dark:text-gray-400 text-center">
                            solving time
                          </span>
                        </div>
                      </div>
                      {/* Focus time column */}
                      <div className="relative">
                        <div className="flex flex-col gap-0.5">
                          <div className="grid grid-cols-3 gap-0.5">
                            {(() => {
                              const { hours, minutes, seconds: secs } = getTimeComponents(userSolve?.focus_time || 0)
                              return (
                                <>
                                  <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                    <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                                      {String(hours).padStart(2, '0')}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                    <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                                      {String(minutes).padStart(2, '0')}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                    <span className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-600">
                                      {String(secs).padStart(2, '0')}
                                    </span>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                          <span className="text-[8px] text-gray-500 dark:text-gray-400 text-center">
                            focus time
                          </span>
                        </div>
                      </div>
                      {/* Type/Difficulty column */}
                      <div className="relative">
                        {(problem.type || problem.difficulty) && (
                          <button
                            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 backdrop-blur-md border shadow-sm ${getGlassMorphismStyles(problem.difficulty)}`}
                          >
                            {problem.type && <span>{problem.type}</span>}
                            {problem.type && problem.difficulty && <span className="mx-1.5">•</span>}
                            {problem.difficulty && <span>{problem.difficulty}</span>}
                          </button>
                        )}
                      </div>
                      {/* Focus button column */}
                      <div className="relative">
                        <button
                          onClick={async () => {
                            if (!isAuthenticated) {
                              await triggerLogin()
                              return
                            }
                                toggleFocus(problem.id)
                          }}
                          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 hover:opacity-70 transition-opacity"
                          title="Focus timer"
                        >
                          <Timer size={24} className="text-gray-700 dark:text-gray-300" />
                          <span className="text-[9px] leading-tight text-gray-600 dark:text-gray-400">focus</span>
                        </button>
                      </div>
                      {/* Note button column */}
                      <div className="relative">
                        <button
                          onClick={async () => {
                            if (!isAuthenticated) {
                              await triggerLogin()
                              return
                            }
                                toggleNote(problem.id)
                          }}
                          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 hover:opacity-70 transition-opacity"
                          title="Edit note"
                        >
                              <NotepadText 
                                size={24} 
                                className={hasNote ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'} 
                              />
                          <span className="text-[9px] leading-tight text-gray-600 dark:text-gray-400">note</span>
                        </button>
                      </div>
                      {/* State button column */}
                      <div className="relative">
                        {solvesLoading && isAuthenticated ? (
                          <button
                            disabled
                            className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-colors bg-gray-500 dark:bg-gray-500 cursor-not-allowed"
                          >
                            Loading...
                          </button>
                        ) : !hasStarted ? (
                          <button
                            onClick={async () => {
                              if (!isAuthenticated) {
                                await triggerLogin()
                                return
                              }
                              await handleStartProblem(problem.id)
                            }}
                            className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-full text-xs sm:text-sm font-bold transition-colors"
                          >
                            <Play size={14} />
                            Start
                          </button>
                        ) : isInProgress ? (
                          <button
                            onClick={async () => {
                              if (!isAuthenticated) {
                                await triggerLogin()
                                return
                              }
                              await updateProblemStatus(problem.id)
                            }}
                            className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full text-xs sm:text-sm font-bold transition-colors group animate-breathe"
                          >
                            <Clock size={14} />
                            <span className="group-hover:hidden whitespace-nowrap">In progress</span>
                            <span className="hidden group-hover:inline whitespace-nowrap">Mark solved</span>
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!isAuthenticated) {
                                await triggerLogin()
                                return
                              }
                              await updateProblemStatus(problem.id)
                            }}
                            className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-colors bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600"
                          >
                            <CheckCircle size={14} />
                            Solved
                          </button>
                        )}
                      </div>
                        </div>
                      ) : (
                        // Expanded view with 3 equal columns
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 py-4 transition-all duration-300 ease-in-out">
                          {/* Left Column: Problem Info */}
                          <div className="flex items-center h-full">
                            {/* Centered content */}
                            <div className="flex flex-col gap-3 items-center justify-center w-full">
                              {/* First row: Problem title and difficulty */}
                              <div className="flex flex-col gap-2 items-center">
                                <div className="flex flex-col gap-2 items-center">
                                  <a
                                    href={problem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-xl sm:text-2xl font-semibold text-center font-mono tracking-wide"
                                    style={{ fontFamily: '"Roboto Mono", "Courier New", monospace' }}
                                  >
                                    {problem.name}
                                  </a>
                                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    <Users size={14} />
                                    <span>{solveCount}</span>
                                  </div>
                                </div>
                                {(problem.type || problem.difficulty) && (
                                  <button
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 backdrop-blur-md border shadow-sm ${getGlassMorphismStyles(problem.difficulty)}`}
                                  >
                                    {problem.type && <span>{problem.type}</span>}
                                    {problem.type && problem.difficulty && <span className="mx-1.5">•</span>}
                                    {problem.difficulty && <span>{problem.difficulty}</span>}
                                  </button>
                                )}
                              </div>
                              
                              {/* Second row: Solving time and focus time */}
                              <div className="grid grid-cols-2 gap-3 w-full">
                                <div className="flex flex-col gap-1 items-center">
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Solving Time</span>
                                  <div className="grid grid-cols-3 gap-1">
                                    {(() => {
                                      const { hours, minutes, seconds: secs } = getTimeComponents(solvingTime)
                                      return (
                                        <>
                                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                                              {String(hours).padStart(2, '0')}
                                            </span>
                                          </div>
                                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                                              {String(minutes).padStart(2, '0')}
                                            </span>
                                          </div>
                                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                                              {String(secs).padStart(2, '0')}
                                            </span>
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 items-center">
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">Focus Time</span>
                                  <div className="grid grid-cols-3 gap-1">
                                    {(() => {
                                      // Show saved focus time + unsaved elapsed focus time in real-time
                                      const savedFocusTime = userSolve?.focus_time || 0
                                      const currentElapsedFocusTime = focusTimeElapsed[problem.id] || 0
                                      const lastSaved = lastSavedTimes[problem.id] || 0
                                      const unsavedElapsedTime = Math.max(0, currentElapsedFocusTime - lastSaved)
                                      const totalFocusTime = savedFocusTime + unsavedElapsedTime
                                      const { hours, minutes, seconds: secs } = getTimeComponents(totalFocusTime)
                                      return (
                                        <>
                                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                                              {String(hours).padStart(2, '0')}
                                            </span>
                                          </div>
                                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                                              {String(minutes).padStart(2, '0')}
                                            </span>
                                          </div>
                                          <div className="flex flex-col items-center justify-center px-1.5 py-1 rounded-lg bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                                            <span className="text-xs font-semibold text-amber-800 dark:text-amber-600">
                                              {String(secs).padStart(2, '0')}
                                            </span>
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Third row: Problem state and Close button */}
                              <div className="flex flex-col gap-1 items-center w-full">
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">Status</span>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                  {solvesLoading && isAuthenticated ? (
                                    <button
                                      disabled
                                      className="w-full min-h-[32px] flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors bg-gray-500 dark:bg-gray-500 cursor-not-allowed"
                                    >
                                      Loading...
                                    </button>
                                  ) : !hasStarted ? (
                                    <button
                                      onClick={async () => {
                                        if (!isAuthenticated) {
                                          await triggerLogin()
                                          return
                                        }
                                        await handleStartProblem(problem.id)
                                      }}
                                      className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-full text-xs font-bold transition-colors"
                                    >
                                      <Play size={12} />
                                      Start
                                    </button>
                                  ) : isInProgress ? (
                                    <button
                                      onClick={async () => {
                                        if (!isAuthenticated) {
                                          await triggerLogin()
                                          return
                                        }
                                        await updateProblemStatus(problem.id)
                                      }}
                                      className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full text-xs font-bold transition-colors group animate-breathe"
                                    >
                                      <Clock size={12} />
                                      <span className="group-hover:hidden whitespace-nowrap">In progress</span>
                                      <span className="hidden group-hover:inline whitespace-nowrap">Mark solved</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={async () => {
                                        if (!isAuthenticated) {
                                          await triggerLogin()
                                          return
                                        }
                                        await updateProblemStatus(problem.id)
                                      }}
                                      className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600"
                                    >
                                      <CheckCircle size={12} />
                                      Solved
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      await handleCloseFocusView(problem.id)
                                    }}
                                    className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors bg-gray-500 hover:bg-gray-600 dark:bg-gray-500 dark:hover:bg-gray-600"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Middle Column: Focus Timer */}
                          <div className="flex flex-col">
                            <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <InlinePomodoroTimer
                                problemId={problem.id}
                                problemName={problem.name}
                                onComplete={(seconds) => handleFocusTimeComplete(problem.id, seconds)}
                                onUpdate={(seconds) => handleFocusTimeUpdate(problem.id, seconds)}
                                onElapsedChange={(seconds) => {
                                  // Track focus time elapsed for this problem
                                  setFocusTimeElapsed(prev => ({ ...prev, [problem.id]: seconds }))
                                  // Initialize lastSavedTimes if not set
                                  setLastSavedTimes(prev => {
                                    if (!prev[problem.id]) {
                                      return { ...prev, [problem.id]: 0 }
                                    }
                                    return prev
                                  })
                                }}
                                onClose={async () => {
                                  await handleCloseFocusView(problem.id)
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Right Column: Note Editor */}
                          <div className="flex flex-col">
                            <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <InlineNoteEditor
                                problemId={problem.id}
                                initialContent={getUserSolve(problem.id)?.note || ''}
                                onSave={(content) => handleNoteSave(problem.id, content)}
                                onClose={() => setExpandedProblem(null)}
                                problemName={problem.name}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Inline Pomodoro Timer Component
function InlinePomodoroTimer({ 
  problemId, 
  problemName, 
  onComplete, 
  onUpdate,
  onElapsedChange,
  onClose 
}: { 
  problemId: string
  problemName: string
  onComplete: (seconds: number) => void
  onUpdate?: (seconds: number) => void
  onElapsedChange?: (seconds: number) => void
  onClose: () => void
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [initialMinutes, setInitialMinutes] = useState(20)
  const [minutes, setMinutes] = useState(20)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const lastSavedTimeRef = useRef<number>(0) // Track last saved time in seconds

  // Clock dimensions
  const CLOCK_SIZE = 300
  const CENTER = CLOCK_SIZE / 2
  const RADIUS = 110
  const HANDLE_RADIUS = 12
  const INNER_RADIUS = 90

  // Convert minutes to angle (0 minutes = -90 degrees, counter-clockwise)
  const minutesToAngle = (mins: number) => {
    // 0 minutes is at top (-90 degrees), counter-clockwise is negative
    return -90 - (mins / 60) * 360
  }

  // Convert angle to minutes (counter-clockwise from top)
  const angleToMinutes = (angle: number) => {
    // Normalize angle to 0-360 range
    let normalized = ((angle + 90) % 360 + 360) % 360
    // For counter-clockwise mapping:
    // normalized 0° (top) = 0 min
    // normalized 270° (left) = 15 min  
    // normalized 180° (bottom) = 30 min
    // normalized 90° (right) = 45 min
    // Formula: (360 - normalized) / 360 * 60
    let minutes = ((360 - normalized) % 360) / 360 * 60
    return Math.min(60, Math.max(0, Math.round(minutes)))
  }

  // Get handle position based on minutes - closer to outer border
  const getHandlePosition = (mins: number) => {
    const angle = (minutesToAngle(mins) * Math.PI) / 180
    // Position closer to outer border (60% from inner to outer)
    const handleRadius = INNER_RADIUS + (RADIUS - INNER_RADIUS) * 0.6
    const x = CENTER + handleRadius * Math.cos(angle)
    const y = CENTER + handleRadius * Math.sin(angle)
    return { x, y }
  }

  // Get point on circle from angle
  const getPointOnCircle = (angleDeg: number, radius: number) => {
    const angle = (angleDeg * Math.PI) / 180
    const x = CENTER + radius * Math.cos(angle)
    const y = CENTER + radius * Math.sin(angle)
    return { x, y }
  }

  // Create path for red fill (pie slice) - counter-clockwise
  const getRedFillPath = (mins: number) => {
    if (mins === 0) return ''
    const endAngle = minutesToAngle(mins)
    const startAngle = -90 // Start at top (0 minutes)
    
    const startPoint = getPointOnCircle(startAngle, INNER_RADIUS)
    const endPoint = getPointOnCircle(endAngle, INNER_RADIUS)
    
    const largeArcFlag = mins > 30 ? 1 : 0
    
    // Sweep-flag 0 for counter-clockwise direction
    return `M ${CENTER} ${CENTER} L ${startPoint.x} ${startPoint.y} A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${endPoint.x} ${endPoint.y} Z`
  }

  // Handle mouse/touch events for dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRunning) return
    setIsDragging(true)
    handlePointerMove(e)
  }

  const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || isRunning) return
    
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      const x = (e.clientX || (e as PointerEvent).clientX) - rect.left - CENTER
      const y = (e.clientY || (e as PointerEvent).clientY) - rect.top - CENTER
      
      // Calculate angle from center
      let angle = Math.atan2(y, x) * (180 / Math.PI)
      const newMinutes = angleToMinutes(angle)
      
      if (newMinutes >= 0 && newMinutes <= 60) {
        setInitialMinutes(newMinutes)
        setMinutes(newMinutes)
        setSeconds(0)
        setElapsedSeconds(0)
        startTimeRef.current = null
      }
    }
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      const handleMove = (e: PointerEvent) => handlePointerMove(e)
      const handleUp = () => handlePointerUp()
      
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
      
      return () => {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
    }
  }, [isDragging])

  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      // Immediate update function
      const updateTimer = () => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current!) / 1000)
        setElapsedSeconds(elapsed)
        
        // Update elapsed time in real-time for display
        if (onElapsedChange) {
          onElapsedChange(elapsed)
        }
        
        const totalSeconds = initialMinutes * 60
        const remaining = Math.max(0, totalSeconds - elapsed)
        const newMinutes = Math.floor(remaining / 60)
        const newSecs = remaining % 60

        setMinutes(newMinutes)
        setSeconds(newSecs)

        // Save every 5 minutes (300 seconds) - save only the additional time since last save
        if (onUpdate && elapsed > 0 && elapsed - lastSavedTimeRef.current >= 300) {
          const additionalSeconds = elapsed - lastSavedTimeRef.current
          lastSavedTimeRef.current = elapsed
          // Save the additional time (will be added to existing focus time on server)
          onUpdate(additionalSeconds)
        }

        if (remaining <= 0) {
          setIsRunning(false)
          // Call onComplete to save focus time to server
          onComplete(elapsed)
          // Reset timer to initialMinutes (20 minutes) after completion
          setElapsedSeconds(0)
          setMinutes(initialMinutes)
          setSeconds(0)
          startTimeRef.current = null
          lastSavedTimeRef.current = 0
          if (onElapsedChange) {
            onElapsedChange(0)
          }
        }
      }

      // Run immediately to update display right away
      updateTimer()
      
      // Then set up interval for subsequent updates
      intervalRef.current = setInterval(updateTimer, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, initialMinutes, onComplete, onUpdate, onElapsedChange])

  const handleStart = () => {
    if (!isRunning) {
      // If elapsed is 0, this is a new session - start fresh
      if (elapsedSeconds === 0) {
        startTimeRef.current = Date.now()
        lastSavedTimeRef.current = 0
        // Initialize minutes and seconds to initialMinutes and 0
        setMinutes(initialMinutes)
        setSeconds(0)
      } else {
        // Resume from where we paused
        startTimeRef.current = Date.now() - elapsedSeconds * 1000
        // Calculate current minutes and seconds from elapsed time
        const totalSeconds = initialMinutes * 60
        const remaining = Math.max(0, totalSeconds - elapsedSeconds)
        setMinutes(Math.floor(remaining / 60))
        setSeconds(remaining % 60)
      }
      setIsRunning(true)
    }
  }

  const handlePause = () => {
    setIsRunning(false)
    // Save any elapsed time that hasn't been saved yet when pausing
    if (onUpdate && elapsedSeconds > 0 && elapsedSeconds > lastSavedTimeRef.current) {
      const remainingSeconds = elapsedSeconds - lastSavedTimeRef.current
      if (remainingSeconds > 0) {
        onUpdate(remainingSeconds)
        lastSavedTimeRef.current = elapsedSeconds
      }
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
    setMinutes(initialMinutes)
    setSeconds(0)
    startTimeRef.current = null
    lastSavedTimeRef.current = 0
    if (onElapsedChange) {
      onElapsedChange(0)
    }
  }

  const handleStop = () => {
    // Save any remaining elapsed time that hasn't been saved yet
    if (elapsedSeconds > 0 && elapsedSeconds > lastSavedTimeRef.current) {
      const remainingSeconds = elapsedSeconds - lastSavedTimeRef.current
      if (onUpdate && remainingSeconds > 0) {
        onUpdate(remainingSeconds)
      }
    }
    if (elapsedSeconds > 0) {
      onComplete(elapsedSeconds)
    }
    onClose()
  }

  const formatTime = (mins: number, secs: number) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Calculate current display minutes (either from drag or from timer)
  const displayMinutes = isRunning ? initialMinutes : initialMinutes
  
  // Use the minutes and seconds state that updates every second for digital display
  // Show initialMinutes only if timer hasn't started yet (elapsedSeconds === 0 and not running)
  // Otherwise show current state (which preserves paused time)
  const currentMinutes = (!isRunning && elapsedSeconds === 0) ? initialMinutes : minutes
  const currentSeconds = (!isRunning && elapsedSeconds === 0) ? 0 : seconds

  // Calculate remaining time for red fill (including seconds for smooth animation)
  const totalSeconds = initialMinutes * 60
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds)
  // When running, use calculated remaining seconds. When paused, use current state to preserve visual.
  // When not started (elapsedSeconds === 0), show initialMinutes
  const redFillMinutes = isRunning 
    ? remainingSeconds / 60
    : (elapsedSeconds === 0 ? initialMinutes : minutes + seconds / 60)

  const handlePos = getHandlePosition(displayMinutes)

  // Generate number positions (0, 5, 10, 15, ..., 55)
  const numbers = Array.from({ length: 12 }, (_, i) => i * 5)
  const numberPositions = numbers.map(num => {
    const angle = minutesToAngle(num)
    const rad = (angle * Math.PI) / 180
    // Position numbers further out to prevent clipping, with extra space for edge numbers
    const numberRadius = RADIUS + 18
    const x = CENTER + numberRadius * Math.cos(rad)
    const y = CENTER + numberRadius * Math.sin(rad)
    return { num, x, y, angle }
  })

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: CLOCK_SIZE, height: CLOCK_SIZE }}>
          {/* Focus Timer text - positioned absolutely without extra space */}
          <div className="absolute -top-1 left-0 flex justify-start pointer-events-none">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Focus Timer</h3>
      </div>
          <svg
            ref={svgRef}
            width={CLOCK_SIZE}
            height={CLOCK_SIZE}
            className={isRunning ? 'cursor-default' : 'cursor-grab'}
            onPointerDown={handlePointerDown}
            style={{ touchAction: 'none' }}
          >
            {/* Outer circle with 3D effect */}
            <defs>
              <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="largeDropShadow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="12"/>
                <feOffset dx="0" dy="8" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope={isDark ? 0.4 : 0.25}/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={isDark ? "#1a1a2a" : "#f0f0f0"} stopOpacity="1" />
                <stop offset="100%" stopColor={isDark ? "#0f0f1a" : "#d0d0d0"} stopOpacity="1" />
              </linearGradient>
              <radialGradient id="ringGradient" cx="50%" cy="50%">
                <stop offset="0%" stopColor={isDark ? "#e5e7eb" : "#f8f8f8"} stopOpacity="1" />
                <stop offset="100%" stopColor={isDark ? "#d1d5db" : "#e8e8e8"} stopOpacity="1" />
              </radialGradient>
              <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="0" dy="1" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feComposite in="SourceGraphic" in2="offsetblur" operator="arithmetic" k2="-1" k3="1"/>
              </filter>
              <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
                <feOffset dx="0" dy="3" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.4"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="handleShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                <feOffset dx="1" dy="2" result="offsetblur"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <radialGradient id="handleGradient" cx="30%" cy="30%">
                <stop offset="0%" stopColor={isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.9)"} stopOpacity="1" />
                <stop offset="50%" stopColor={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)"} stopOpacity="1" />
                <stop offset="100%" stopColor={isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)"} stopOpacity="1" />
              </radialGradient>
              <radialGradient id="centerGlassGradient" cx="40%" cy="40%">
                <stop offset="0%" stopColor={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.4)"} stopOpacity="1" />
                <stop offset="50%" stopColor={isDark ? "rgba(200,200,200,0.05)" : "rgba(200,200,200,0.2)"} stopOpacity="1" />
                <stop offset="100%" stopColor={isDark ? "rgba(150,150,150,0.08)" : "rgba(150,150,150,0.3)"} stopOpacity="1" />
              </radialGradient>
              <radialGradient id="innerCircleShadow" cx="50%" cy="50%">
                <stop offset="70%" stopColor={isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.2)"} stopOpacity="1" />
                <stop offset="80%" stopColor={isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.15)"} stopOpacity="1" />
                <stop offset="90%" stopColor={isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.1)"} stopOpacity="1" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" stopOpacity="0" />
              </radialGradient>
              <mask id="shadowRingMask">
                <rect width="100%" height="100%" fill="white"/>
                <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="black"/>
              </mask>
            </defs>

            {/* Group all dial elements with large drop shadow */}
            <g filter="url(#largeDropShadow)">
            {/* Outer ring with 3D effect */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS + 5}
              fill="url(#circleGradient)"
              stroke={isDark ? "#1a1a2a" : "#b0b0b0"}
              strokeWidth="2"
              filter="url(#shadow)"
            />
            
            {/* Ring area between inner and outer circle with depth effect */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS + 5}
              fill="url(#ringGradient)"
              stroke="none"
            />
            {/* Shadow from inner circle onto ring area */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={INNER_RADIUS + 25}
              fill="url(#innerCircleShadow)"
              mask="url(#shadowRingMask)"
              style={{ pointerEvents: 'none' }}
            />
            <circle
              cx={CENTER}
              cy={CENTER}
              r={INNER_RADIUS}
              fill={isDark ? "#f3f4f6" : "white"}
              stroke="none"
            />
            
            {/* Inner shadow for depth effect on the ring */}
            <circle
              cx={CENTER}
              cy={CENTER + 1}
              r={INNER_RADIUS}
              fill="none"
              stroke={isDark ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.08)"}
              strokeWidth="2"
            />
            
            {/* White background circle border */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={INNER_RADIUS}
              fill="none"
              stroke={isDark ? "#d1d5db" : "#e0e0e0"}
              strokeWidth="1.5"
            />
            
            {/* Grey line at 0 position to indicate starting point */}
            <line
              x1={CENTER}
              y1={CENTER - RADIUS - 5}
              x2={CENTER}
              y2={CENTER - INNER_RADIUS}
              stroke={isDark ? "#6b7280" : "#808080"}
              strokeWidth="2"
            />
            
            {/* Grey line at 59 position */}
            {(() => {
              const angle59 = minutesToAngle(59)
              const rad59 = (angle59 * Math.PI) / 180
              const x59 = CENTER + (RADIUS + 5) * Math.cos(rad59)
              const y59 = CENTER + (RADIUS + 5) * Math.sin(rad59)
              const x59Inner = CENTER + INNER_RADIUS * Math.cos(rad59)
              const y59Inner = CENTER + INNER_RADIUS * Math.sin(rad59)
              return (
                <line
                  x1={x59}
                  y1={y59}
                  x2={x59Inner}
                  y2={y59Inner}
                  stroke={isDark ? "#6b7280" : "#808080"}
                  strokeWidth="2"
                />
              )
            })()}
            
            {/* Fill gap between 59 and 0 with background */}
            {(() => {
              const angle0 = minutesToAngle(0)
              const angle59 = minutesToAngle(59)
              const rad0 = (angle0 * Math.PI) / 180
              const rad59 = (angle59 * Math.PI) / 180
              const radius = RADIUS + 5
              
              const x0 = CENTER + radius * Math.cos(rad0)
              const y0 = CENTER + radius * Math.sin(rad0)
              const x59 = CENTER + radius * Math.cos(rad59)
              const y59 = CENTER + radius * Math.sin(rad59)
              
              // Create a shape that fills the gap from 59 to 0
              return (
                <path
                  d={`M ${x59} ${y59}
                      L ${CENTER} ${CENTER}
                      L ${x0} ${y0}
                      A ${radius} ${radius} 0 0 1 ${x59} ${y59} Z`}
                  fill={isDark ? "#f3f4f6" : "white"}
                />
              )
            })()}

            {/* Red fill (pie slice) */}
            {redFillMinutes > 0 && (
              <path
                d={getRedFillPath(redFillMinutes)}
                fill="#D30009"
              />
            )}

            {/* 5-minute markers (thick and large) - centered on inner circle */}
            {Array.from({ length: 12 }, (_, i) => {
              const minutes = i * 5
              const angle = minutesToAngle(minutes)
              const rad = (angle * Math.PI) / 180
              // Extend 5 pixels inward and 5 pixels outward from inner circle
              const x1 = CENTER + (INNER_RADIUS - 5) * Math.cos(rad)
              const y1 = CENTER + (INNER_RADIUS - 5) * Math.sin(rad)
              const x2 = CENTER + (INNER_RADIUS + 5) * Math.cos(rad)
              const y2 = CENTER + (INNER_RADIUS + 5) * Math.sin(rad)
              return (
                <line
                  key={`5min-${minutes}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isDark ? "#374151" : "#000"}
                  strokeWidth="2.5"
                />
              )
            })}

            {/* Minute markers (dots) - centered on inner circle */}
            {Array.from({ length: 60 }, (_, i) => {
              if (i % 5 === 0) return null // Skip 5-minute marks (already drawn above)
              const angle = minutesToAngle(i)
              const rad = (angle * Math.PI) / 180
              // Extend 2.5 pixels inward and 2.5 pixels outward from inner circle
              const x1 = CENTER + (INNER_RADIUS - 2.5) * Math.cos(rad)
              const y1 = CENTER + (INNER_RADIUS - 2.5) * Math.sin(rad)
              const x2 = CENTER + (INNER_RADIUS + 2.5) * Math.cos(rad)
              const y2 = CENTER + (INNER_RADIUS + 2.5) * Math.sin(rad)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isDark ? "#6b7280" : "#000"}
                  strokeWidth="1"
                />
              )
            })}

            {/* Number labels */}
            {numberPositions.map(({ num, x, y }) => (
              <text
                key={num}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="500"
                fill={isDark ? "#6b7280" : "#000"}
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                {num}
              </text>
            ))}

            {/* Center pivot point */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r="4"
              fill={isDark ? "#374151" : "#000"}
            />

            {/* Draggable handle with glass and shadow effect */}
            {!isRunning && (
              <g>
                {/* Shadow for depth */}
                <circle
                  cx={handlePos.x + 1}
                  cy={handlePos.y + 2}
                  r={HANDLE_RADIUS}
                  fill={isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.25)"}
                  style={{ filter: 'blur(4px)' }}
                />
                {/* Glass effect handle - main circle */}
                <circle
                  cx={handlePos.x}
                  cy={handlePos.y}
                  r={HANDLE_RADIUS}
                  fill="url(#handleGradient)"
                  stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
                  strokeWidth="1.5"
                  filter="url(#handleShadow)"
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                  className="hover:scale-110 transition-transform"
                />
                {/* Inner highlight for glass effect */}
                <circle
                  cx={handlePos.x - 3}
                  cy={handlePos.y - 3}
                  r={HANDLE_RADIUS - 5}
                  fill={isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)"}
                  style={{ pointerEvents: 'none' }}
                />
                {/* Glass center piece - always centered */}
                <circle
                  cx={handlePos.x}
                  cy={handlePos.y}
                  r={HANDLE_RADIUS - 6}
                  fill="url(#centerGlassGradient)"
                  stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.3)"}
                  strokeWidth="0.5"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Center highlight for glass effect */}
                <circle
                  cx={handlePos.x - 2}
                  cy={handlePos.y - 2}
                  r={HANDLE_RADIUS - 8}
                  fill={isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.5)"}
                  style={{ pointerEvents: 'none' }}
                />
                {/* Outer rim highlight */}
                <circle
                  cx={handlePos.x}
                  cy={handlePos.y}
                  r={HANDLE_RADIUS}
                  fill="none"
                  stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)"}
                  strokeWidth="1"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            )}
          </g>
          </svg>

          {/* Play/Pause button in center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={isRunning ? handlePause : handleStart}
              className="pointer-events-auto w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={initialMinutes === 0}
            >
              {isRunning ? (
                <Pause size={24} className="text-gray-700 dark:text-gray-300" fill="currentColor" />
              ) : (
                <Play size={24} className="text-gray-700 dark:text-gray-300 ml-1" fill="currentColor" />
              )}
          </button>
        </div>

          {/* Digital timer below play button */}
          <div className="absolute inset-0 flex items-center justify-center pt-28 pointer-events-none">
            <div 
              className="flex items-center gap-0 pointer-events-auto cursor-pointer"
              onClick={initialMinutes === 0 ? undefined : (isRunning ? handlePause : handleStart)}
            >
              <div className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-gray-100/50 dark:bg-white/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-300/50 shadow-sm hover:bg-gray-200/50 dark:hover:bg-white/80 transition-colors">
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-700">
                  {String(currentMinutes).padStart(2, '0')}
                </span>
      </div>
              <div className="flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-gray-100/50 dark:bg-white/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-300/50 shadow-sm hover:bg-gray-200/50 dark:hover:bg-white/80 transition-colors">
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-700">
                  {String(currentSeconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

// Inline Note Editor Component
function InlineNoteEditor({
  problemId,
  initialContent = '',
  onSave,
  onClose,
  problemName
}: {
  problemId: string
  initialContent?: string
  onSave: (content: string) => void
  onClose: () => void
  problemName: string
}) {
  const [content, setContent] = useState(initialContent)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && initialContent) {
      editorRef.current.innerHTML = initialContent
    }
  }, [initialContent])

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const handleSave = () => {
    const htmlContent = editorRef.current?.innerHTML || ''
    onSave(htmlContent)
  }

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Note</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1 p-1 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 mb-2">
        <button
          onClick={() => formatText('bold')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Bold"
        >
          <Bold size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Italic"
        >
          <Italic size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Underline"
        >
          <Underline size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600" />
        <button
          onClick={() => {
            const url = prompt('Enter URL:')
            if (url) formatText('createLink', url)
          }}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Insert Link"
        >
          <Link size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
        <button
          onClick={() => formatText('insertUnorderedList')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          title="Bullet List"
        >
          <List size={12} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-1 p-2 overflow-y-auto text-sm text-gray-900 dark:text-white focus:outline-none min-h-[150px] max-h-[200px] border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
      />

      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={handleSave}
          className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  )
}
