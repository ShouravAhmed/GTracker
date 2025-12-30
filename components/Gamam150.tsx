'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSolves } from '@/lib/solves-client'
import { Play, Timer, NotepadText, Users, Clock, CheckCircle } from 'lucide-react'
import { SkeletonLoader } from './Gamam150/SkeletonLoader'
import { InlinePomodoroTimer } from './Gamam150/InlinePomodoroTimer'
import { InlineNoteEditor } from './Gamam150/InlineNoteEditor'
import { getTimeComponents, getGlassMorphismStyles } from './Gamam150/utils'
import type { ProblemData, ExpandedProblem } from './Gamam150/types'

export default function Gamam150() {
  const {
    problems,
    solves,
    solveCounts,
    moduleStarts,
    moduleProgress,
    loading: solvesLoading,
    isAuthenticated,
    getProblemStatus,
    getUserSolve,
    toggleProblemStatus,
    startProblem,
    updateFocusTime,
    updateNote,
    triggerLogin,
    startModule,
    checkModuleStarted,
    updateCurrentDayData,
  } = useSolves()

  const [codingProblems, setCodingProblems] = useState<ProblemData>({})
  const [expandedProblem, setExpandedProblem] = useState<ExpandedProblem | null>(null)
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
    if (!problems || problems.length === 0) {
      setCodingProblems({})
      console.warn('⚠️ No problems available. Please run: npm run upload-150day-problems')
      return
    }

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

  // Calculate day progress
  const getDayProgress = (day: string): { completed: number; total: number; percentage: number } => {
    const problems = codingProblems[day]
    if (!problems || problems.length === 0) {
      return { completed: 0, total: 0, percentage: 0 }
    }
    const completed = problems.filter(p => getProblemStatus(p.id)).length
    const percentage = Math.round((completed / problems.length) * 100)
    return { completed, total: problems.length, percentage }
  }

  // Check if day is overdue
  const isDayOverdue = (day: string): boolean => {
    if (!moduleProgress || !moduleProgress.startedAt) return false
    const dayNum = day === 'other' ? -1 : parseInt(day)
    if (dayNum < 0) return false
    
    const startedAt = new Date(moduleProgress.startedAt)
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24))
    
    // Day is overdue if it's before the expected day and not completed
    return dayNum < daysSinceStart && !isDayCompleted(day)
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


  const totalSolved = useMemo(() => {
    return Object.values(codingProblems).reduce((total, problems) => {
      return total + problems.filter(problem => getProblemStatus(problem.id)).length
    }, 0)
  }, [codingProblems, solves])

  const daysCompleted = useMemo(() => {
    return Object.keys(codingProblems).filter(day => isDayCompleted(day)).length
  }, [codingProblems, solves])

  // Check if GAMAM 150 module has been started (module type 'all')
  const moduleHasStarted = useMemo(() => {
    return checkModuleStarted('all')
  }, [checkModuleStarted, moduleStarts])

  // Get first problem ID for starting the module
  const firstProblemId = useMemo(() => {
    const allProblems = Object.values(codingProblems).flat()
    return allProblems.length > 0 ? allProblems[0].id : undefined
  }, [codingProblems])

  const handleStartModule = async () => {
    if (!isAuthenticated) {
      await triggerLogin()
      return
    }

    // Start the module in the database
    await startModule('all')
    
    // Also start the first problem
    if (firstProblemId) {
      await startProblem(firstProblemId)
    }
  }

  // Show skeleton loader when data is loading or no problems available
  if (solvesLoading || problems.length === 0) {
    return <SkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 dark:text-white mb-6 sm:mb-10">
          GAMAM 150 Day Tracker
        </h1>

        {/* Start Module Banner - shown when module hasn't been started */}
        {!moduleHasStarted && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Start the module to begin practicing
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Click the button below to start this module. Once started, all features will be enabled.
                </p>
              </div>
              <button
                onClick={handleStartModule}
                className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors whitespace-nowrap"
              >
                <Play size={18} />
                Start Module
              </button>
            </div>
          </div>
        )}

        {/* Progress Summary */}
        {moduleHasStarted && moduleProgress && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 sm:p-6 mb-6 border border-blue-200 dark:border-blue-800">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Progress</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Ongoing Day</span>
                  <strong className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {moduleProgress.currentDay + 1}
                  </strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Completed Days</span>
                  <strong className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {moduleProgress.completedDays}
                  </strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Overdue Days</span>
                  <strong className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                    {moduleProgress.overdueDays}
                  </strong>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Days</span>
                  <strong className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    {moduleProgress.totalDays}
                  </strong>
                </div>
              </div>
              
              {/* Overall Progress Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Overall Progress</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {moduleProgress.completedPercentage}%
                  </span>
                </div>
                <div className="h-4 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                  {/* Completed progress (green) */}
                  <div 
                    className="h-full bg-green-500 dark:bg-green-600 transition-all duration-500"
                    style={{ width: `${moduleProgress.completedPercentage}%` }}
                  />
                  {/* Overdue progress (red) - shown on top of completed */}
                  {moduleProgress.overduePercentage > 0 && (
                    <div 
                      className="h-full bg-red-500 dark:bg-red-600 absolute top-0 transition-all duration-500"
                      style={{ 
                        left: `${moduleProgress.completedPercentage}%`,
                        width: `${moduleProgress.overduePercentage}%` 
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>Completed: {moduleProgress.completedPercentage}%</span>
                  {moduleProgress.overduePercentage > 0 && (
                    <span className="text-red-600 dark:text-red-400">Overdue: {moduleProgress.overduePercentage}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
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
          {Object.keys(codingProblems).length === 0 ? (
            <SkeletonLoader />
          ) : (
            Object.entries(codingProblems).map(([day, problems]) => (
            <div key={day} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      Day {day === 'other' ? '?' : parseInt(day) + 1}
                    </span>
                    <span
                      className={`px-3 sm:px-6 py-1.5 text-xs sm:text-sm font-bold rounded-full ${
                        isDayCompleted(day)
                          ? 'bg-green-600 dark:bg-green-500 text-white'
                          : isDayOverdue(day)
                          ? 'bg-red-600 dark:bg-red-500 text-white'
                          : 'bg-yellow-500 dark:bg-yellow-600 text-white'
                      }`}
                    >
                      {isDayCompleted(day) ? 'Completed' : isDayOverdue(day) ? 'Overdue' : 'Pending'}
                    </span>
                  </div>
                  {/* Day Progress Bar */}
                  {(() => {
                    const progress = getDayProgress(day)
                    const isOverdue = isDayOverdue(day)
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {progress.completed} / {progress.total} problems
                          </span>
                          <span className={`text-xs font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              isDayCompleted(day)
                                ? 'bg-green-500 dark:bg-green-600'
                                : isOverdue
                                ? 'bg-red-500 dark:bg-red-600'
                                : 'bg-blue-500 dark:bg-blue-600'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })()}
                </div>
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
                      <span className={`text-center font-bold text-gray-700 dark:text-gray-300 text-sm sm:text-base ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                        {problems.indexOf(problem) + 1}
                      </span>
                      <div className={`flex items-center gap-2 sm:gap-3 ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                        {moduleHasStarted ? (
                          <a
                            href={problem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm sm:text-base truncate"
                          >
                            {problem.name}
                          </a>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 text-sm sm:text-base truncate cursor-not-allowed">
                            {problem.name}
                          </span>
                        )}
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <Users size={14} />
                          <span>{solveCount}</span>
                        </div>
                      </div>
                      {/* Solving time column */}
                      <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
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
                      <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
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
                      <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
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
                      <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                        <button
                          onClick={async () => {
                            if (!moduleHasStarted) return
                            if (!isAuthenticated) {
                              await triggerLogin()
                              return
                            }
                                toggleFocus(problem.id)
                          }}
                          disabled={!moduleHasStarted}
                          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 transition-opacity ${
                            moduleHasStarted 
                              ? 'hover:opacity-70 cursor-pointer' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
                          title="Focus timer"
                        >
                          <Timer size={24} className="text-gray-700 dark:text-gray-300" />
                          <span className="text-[9px] leading-tight text-gray-600 dark:text-gray-400">focus</span>
                        </button>
                      </div>
                      {/* Note button column */}
                      <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                        <button
                          onClick={async () => {
                            if (!moduleHasStarted) return
                            if (!isAuthenticated) {
                              await triggerLogin()
                              return
                            }
                                toggleNote(problem.id)
                          }}
                          disabled={!moduleHasStarted}
                          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 transition-opacity ${
                            moduleHasStarted 
                              ? 'hover:opacity-70 cursor-pointer' 
                              : 'opacity-50 cursor-not-allowed'
                          }`}
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
                      <div className={`relative ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                        {solvesLoading && isAuthenticated ? (
                          <button
                            disabled
                            className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-colors bg-gray-500 dark:bg-gray-500 cursor-not-allowed"
                          >
                            Loading...
                          </button>
                        ) : !moduleHasStarted ? (
                          <button
                            disabled
                            className="w-full min-h-[32px] sm:min-h-[36px] flex items-center justify-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-full text-xs sm:text-sm font-bold cursor-not-allowed opacity-60"
                          >
                            <Play size={14} />
                            Start
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
                              <div className={`flex flex-col gap-2 items-center ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                                <div className="flex flex-col gap-2 items-center">
                                  {moduleHasStarted ? (
                                    <a
                                      href={problem.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline text-xl sm:text-2xl font-semibold text-center font-mono tracking-wide"
                                      style={{ fontFamily: '"Roboto Mono", "Courier New", monospace' }}
                                    >
                                      {problem.name}
                                    </a>
                                  ) : (
                                    <span
                                      className="text-blue-600 dark:text-blue-400 text-xl sm:text-2xl font-semibold text-center font-mono tracking-wide cursor-not-allowed"
                                      style={{ fontFamily: '"Roboto Mono", "Courier New", monospace' }}
                                    >
                                      {problem.name}
                                    </span>
                                  )}
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
          ))
          )}
        </div>
      </div>
    </div>
  )
}
