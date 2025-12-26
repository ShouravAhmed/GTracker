'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSolves } from '@/lib/solves-client'
import { Play, Timer, NotepadText, Users, Clock, CheckCircle } from 'lucide-react'
import NoteEditor from './NoteEditor'
import PomodoroTimer from './PomodoroTimer'
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
  const [selectedNoteProblem, setSelectedNoteProblem] = useState<DBProblem | null>(null)
  const [selectedFocusProblem, setSelectedFocusProblem] = useState<DBProblem | null>(null)
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
    setSelectedFocusProblem(null)
  }

  const handleNoteSave = async (problemId: string, content: string) => {
    await updateNote(problemId, content)
    setSelectedNoteProblem(null)
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

                  return (
                    <div
                      key={problem.id}
                      className="grid grid-cols-1 sm:grid-cols-[40px_1fr_auto_auto_auto_auto_auto_140px] gap-2 sm:gap-4 items-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
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
                            setSelectedFocusProblem(problem)
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
                            setSelectedNoteProblem(problem)
                          }}
                          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 hover:opacity-70 transition-opacity"
                          title="Edit note"
                        >
                          <NotepadText size={24} className={hasNote ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'} />
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
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNoteProblem && (
        <NoteEditor
          initialContent={getUserSolve(selectedNoteProblem.id)?.note || ''}
          onSave={(content) => handleNoteSave(selectedNoteProblem.id, content)}
          onClose={() => setSelectedNoteProblem(null)}
          problemName={selectedNoteProblem.name}
        />
      )}

      {selectedFocusProblem && (
        <PomodoroTimer
          onComplete={(seconds) => handleFocusTimeComplete(selectedFocusProblem.id, seconds)}
          onClose={() => setSelectedFocusProblem(null)}
          problemName={selectedFocusProblem.name}
        />
      )}
    </div>
  )
}
