'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSolves } from '@/lib/solves-client'
import { Play, Timer, NotepadText, Users, Clock, CheckCircle, X, Pause, RotateCcw, Bold, Italic, Underline, Link, List } from 'lucide-react'
import type { Problem as DBProblem } from '@/lib/supabase/solves'

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
    await updateFocusTime(problemId, seconds)
    // Keep expanded - don't close on completion
  }

  const handleNoteSave = async (problemId: string, content: string) => {
    await updateNote(problemId, content)
    // Note editor stays open, just save
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
                                <div className="flex items-center gap-2 justify-center">
                                  <a
                                    href={problem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base font-medium"
                                  >
                                    {problem.name}
                                  </a>
                                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                    <Users size={12} />
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
                                      const { hours, minutes, seconds: secs } = getTimeComponents(userSolve?.focus_time || 0)
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
                                    onClick={() => setExpandedProblem(null)}
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
                                onClose={() => setExpandedProblem(null)}
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
  onClose 
}: { 
  problemId: string
  problemName: string
  onComplete: (seconds: number) => void
  onClose: () => void
}) {
  const [initialMinutes, setInitialMinutes] = useState(25)
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = Math.floor((now - startTimeRef.current!) / 1000)
        setElapsedSeconds(elapsed)
        
        const totalSeconds = initialMinutes * 60
        const remaining = Math.max(0, totalSeconds - elapsed)
        const newMinutes = Math.floor(remaining / 60)
        const newSecs = remaining % 60

        setMinutes(newMinutes)
        setSeconds(newSecs)

        if (remaining <= 0) {
          setIsRunning(false)
          onComplete(elapsed)
        }
      }, 1000)
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
  }, [isRunning, initialMinutes, onComplete])

  const handleStart = () => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - elapsedSeconds * 1000
      setIsRunning(true)
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setElapsedSeconds(0)
    setMinutes(initialMinutes)
    setSeconds(0)
    startTimeRef.current = null
  }

  const handleStop = () => {
    if (elapsedSeconds > 0) {
      onComplete(elapsedSeconds)
    }
    onClose()
  }

  const formatTime = (mins: number, secs: number) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const totalSeconds = initialMinutes * 60
  const progress = totalSeconds > 0 ? ((totalSeconds - elapsedSeconds) / totalSeconds) * 100 : 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Focus Timer</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col items-center mb-3">
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={initialMinutes}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 25
              setInitialMinutes(val)
              if (!isRunning) {
                setMinutes(val)
                setSeconds(0)
              }
            }}
            disabled={isRunning}
            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
        <div className="relative w-32 h-32 mb-2">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - progress / 100)}`}
              className="text-blue-600 dark:text-blue-500 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatTime(minutes, seconds)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {isRunning ? 'Focusing...' : 'Paused'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded font-medium"
            >
              <Play size={14} />
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium"
            >
              <Pause size={14} />
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded font-medium"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
        <button
          onClick={handleStop}
          className="w-full px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          Save & Close
        </button>
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
