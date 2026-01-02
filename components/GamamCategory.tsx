'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSolves } from '@/lib/solves-client'
import { Play, Timer, NotepadText, Users, Clock, CheckCircle } from 'lucide-react'
import { SkeletonLoader } from './Gamam150/SkeletonLoader'
import { InlinePomodoroTimer } from './Gamam150/InlinePomodoroTimer'
import { InlineNoteEditor } from './Gamam150/InlineNoteEditor'
import { getTimeComponents, getGlassMorphismStyles } from './Gamam150/utils'
import type { ExpandedProblem } from './Gamam150/types'
import type { CategoryName } from '@/types/gamam'
import type { Problem as DBProblem } from '@/lib/supabase/solves'

interface GamamCategoryProps {
  categoryName: CategoryName
}

// Map category names from JSON to database type names
const categoryToTypeMap: Record<CategoryName, string> = {
  'Coding': 'Coding',
  'SystemDesign': 'System Design',
  'ObjectOrientedDesign': 'Object Oriented Design',
  'SchemaDesign': 'Schema Design',
  'APIDesign': 'API Design',
  'Behavioral': 'Behavioral',
}

export default function GamamCategory({ categoryName }: GamamCategoryProps) {
  const {
    problems,
    solves,
    solveCounts,
    moduleStarts,
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
  } = useSolves()

  const [categoryProblems, setCategoryProblems] = useState<DBProblem[]>([])
  const [expandedProblem, setExpandedProblem] = useState<ExpandedProblem | null>(null)
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({})
  const [lastSavedTimes, setLastSavedTimes] = useState<Record<string, number>>({})
  const [focusTimeElapsed, setFocusTimeElapsed] = useState<Record<string, number>>({})

  // Filter problems by category type
  useEffect(() => {
    if (!problems || problems.length === 0) return

    const typeName = categoryToTypeMap[categoryName]
    const filtered = problems
      .filter(problem => problem.type === typeName)
      .sort((a, b) => a.name.localeCompare(b.name))

    setCategoryProblems(filtered)
  }, [problems, categoryName])

  // Calculate elapsed times for problems that are in progress
  useEffect(() => {
    const recalculateTimes = () => {
      const now = Date.now()
      const newElapsedTimes: Record<string, number> = {}

      for (const [problemId, userSolve] of Object.entries(solves)) {
        if (userSolve.started_at) {
          if (!userSolve.solved && userSolve.started_at) {
            const startTime = new Date(userSolve.started_at).getTime()
            const elapsed = Math.floor((now - startTime) / 1000)
            newElapsedTimes[problemId] = elapsed
          } else if (userSolve.solved && userSolve.solved_at && userSolve.started_at) {
            const startTime = new Date(userSolve.started_at).getTime()
            const solvedTime = new Date(userSolve.solved_at).getTime()
            const elapsed = Math.floor((solvedTime - startTime) / 1000)
            newElapsedTimes[problemId] = elapsed
          }
        }
      }

      setElapsedTimes(newElapsedTimes)
    }

    recalculateTimes()

    const interval = setInterval(recalculateTimes, 1000)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        recalculateTimes()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [solves])

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
    const lastSaved = lastSavedTimes[problemId] || 0
    if (seconds > lastSaved) {
      const remainingSeconds = seconds - lastSaved
      await updateFocusTime(problemId, remainingSeconds)
      setLastSavedTimes(prev => ({ ...prev, [problemId]: seconds }))
    }
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
  }

  const handleFocusTimeUpdate = async (problemId: string, seconds: number) => {
    await updateFocusTime(problemId, seconds)
    setLastSavedTimes(prev => ({ ...prev, [problemId]: (prev[problemId] || 0) + seconds }))
  }

  const handleNoteSave = async (problemId: string, content: string) => {
    await updateNote(problemId, content)
  }

  const handleCloseFocusView = async (problemId: string) => {
    const currentElapsed = focusTimeElapsed[problemId] || 0
    const lastSaved = lastSavedTimes[problemId] || 0
    if (currentElapsed > lastSaved) {
      const remainingSeconds = currentElapsed - lastSaved
      if (remainingSeconds > 0) {
        await handleFocusTimeUpdate(problemId, remainingSeconds)
      }
    }
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
        return null
      }
      return { id: problemId, showNote: true, showFocus: true }
    })
  }

  const toggleFocus = (problemId: string) => {
    setExpandedProblem(prev => {
      if (prev && prev.id === problemId) {
        return null
      }
      return { id: problemId, showNote: true, showFocus: true }
    })
  }

  const totalSolved = useMemo(() => {
    return categoryProblems.filter(problem => getProblemStatus(problem.id)).length
  }, [categoryProblems, solves])

  // Check if module has been started using module start tracking
  const moduleType = categoryToTypeMap[categoryName]
  const moduleHasStarted = useMemo(() => {
    return checkModuleStarted(moduleType)
  }, [moduleType, checkModuleStarted, moduleStarts])

  // Get first problem ID for starting the module
  const firstProblemId = useMemo(() => {
    return categoryProblems.length > 0 ? categoryProblems[0].id : undefined
  }, [categoryProblems])

  const handleStartModule = async () => {
    if (!isAuthenticated) {
      await triggerLogin()
      return
    }

    // Start the module in the database
    await startModule(moduleType)

    // Also start the first problem
    if (firstProblemId) {
      await startProblem(firstProblemId)
    }
  }

  // Show skeleton loader when data is loading or problems haven't loaded yet
  if (solvesLoading || categoryProblems.length === 0) {
    return <SkeletonLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-12 sm:pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent mb-2">
            {categoryToTypeMap[categoryName]}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
            Master {categoryToTypeMap[categoryName]} problems
          </p>
        </div>

        {/* Start Module Banner - shown when module hasn't been started */}
        {!moduleHasStarted && (
          <div className="relative overflow-hidden bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6 sm:p-8 mb-6 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent"></div>
            <div className="relative flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                  Start the module to begin practicing
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Click the button below to start this module. Once started, all features will be enabled.
                </p>
              </div>
              <button
                onClick={handleStartModule}
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 dark:from-yellow-500 dark:to-amber-500 dark:hover:from-yellow-600 dark:hover:to-amber-600 text-white rounded-xl font-semibold transition-all duration-300 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                <Play size={18} className="group-hover:translate-x-0.5 transition-transform" />
                Start Module
              </button>
            </div>
          </div>
        )}

        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200/50 dark:border-green-800/50 shadow-lg mb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-400/10 rounded-full blur-2xl"></div>
          <div className="relative flex justify-center sm:justify-end">
            <div className="flex flex-col items-center sm:items-end">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 dark:bg-green-400/20 rounded-lg">
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total Solved</span>
              </div>
              <strong className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">{totalSolved}</strong>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 sm:p-7 border border-gray-200/50 dark:border-gray-700/50 mb-8 sm:mb-12">
          <div className="space-y-3">
            {categoryProblems.map((problem) => {
              const isSolved = getProblemStatus(problem.id)
              const userSolve = getUserSolve(problem.id)
              const solveCount = solveCounts[problem.id] || 0
              const hasNote = userSolve?.note && userSolve.note.trim().length > 0
              const hasStarted = !!userSolve?.started_at
              const isInProgress = hasStarted && !isSolved

              // Calculate solving time
              let solvingTime: number = 0
              if (isInProgress && userSolve?.started_at) {
                if (elapsedTimes[problem.id] !== undefined) {
                  solvingTime = elapsedTimes[problem.id]
                } else {
                  const startTime = new Date(userSolve.started_at).getTime()
                  solvingTime = Math.floor((Date.now() - startTime) / 1000)
                }
              } else if (isSolved && userSolve?.solved_at && userSolve?.started_at) {
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
                  className={`transition-all duration-300 ease-in-out rounded-xl border ${isSolved
                    ? 'bg-gradient-to-br from-green-50/50 to-emerald-50/30 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200/50 dark:border-green-800/30'
                    : isInProgress
                      ? 'bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/10 border-blue-200/50 dark:border-blue-800/30'
                      : 'bg-white/80 dark:bg-gray-800/80 border-gray-200/50 dark:border-gray-700/50'
                    } shadow-sm hover:shadow-md mb-3 overflow-hidden`}
                >
                  {!isExpanded ? (
                    // Modern mobile-first collapsed view
                    <div className="p-3 sm:p-4">
                      {/* Mobile: Card Layout, Desktop: Grid Layout */}
                      <div className="flex flex-col items-center sm:grid sm:grid-cols-[50px_1fr_auto] gap-3 sm:gap-4">
                        {/* Problem Number - Mobile: Top, Desktop: Left */}
                        <div className={`flex items-center justify-center sm:justify-start ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                          <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border border-gray-300/50 dark:border-gray-600/50 shadow-sm">
                            <span className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-300">
                              {categoryProblems.indexOf(problem) + 1}
                            </span>
                          </div>
                        </div>

                        {/* Problem Info Section */}
                        <div className={`flex-1 min-w-0 ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                          <div className="flex flex-col gap-2">
                            {/* Problem Name */}
                            <div className="flex items-center justify-center gap-2 min-w-0">
                              {moduleHasStarted ? (
                                <a
                                  href={problem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate leading-tight"
                                  title={problem.name}
                                >
                                  {problem.name}
                                </a>
                              ) : (
                                <span className="text-base sm:text-lg font-semibold text-gray-500 dark:text-gray-400 truncate leading-tight">
                                  {problem.name}
                                </span>
                              )}
                              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100/80 dark:bg-gray-700/80 text-xs text-gray-600 dark:text-gray-400 shrink-0 whitespace-nowrap">
                                <Users size={14} />
                                <span className="font-medium">{solveCount}</span>
                              </div>
                            </div>

                            {/* Mobile: Stats Row */}
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:hidden">
                              {/* Type/Difficulty Badge */}
                              {(problem.type || problem.difficulty) && (
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getGlassMorphismStyles(problem.difficulty)}`}>
                                  {problem.type && <span>{problem.type}</span>}
                                  {problem.type && problem.difficulty && <span className="mx-1">•</span>}
                                  {problem.difficulty && <span>{problem.difficulty}</span>}
                                </span>
                              )}

                              {/* Time Stats - Compact Mobile View */}
                              <div className="flex items-center gap-3 ml-auto">
                                <div className="flex items-center gap-1.5">
                                  <Clock size={14} className="text-amber-600 dark:text-amber-400" />
                                  <div className="flex items-baseline gap-0.5">
                                    {(() => {
                                      const { hours, minutes, seconds: secs } = getTimeComponents(solvingTime)
                                      return (
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                          {hours > 0 ? `${hours}:` : ''}{String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                                        </span>
                                      )
                                    })()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Timer size={14} className="text-blue-600 dark:text-blue-400" />
                                  <div className="flex items-baseline gap-0.5">
                                    {(() => {
                                      const { hours, minutes, seconds: secs } = getTimeComponents(userSolve?.focus_time || 0)
                                      return (
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                          {hours > 0 ? `${hours}:` : ''}{String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                                        </span>
                                      )
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Desktop: Stats Row */}
                            <div className="hidden sm:flex items-center gap-4">
                              {/* Type/Difficulty */}
                              {(problem.type || problem.difficulty) && (
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getGlassMorphismStyles(problem.difficulty)}`}>
                                  {problem.type && <span>{problem.type}</span>}
                                  {problem.type && problem.difficulty && <span className="mx-1.5">•</span>}
                                  {problem.difficulty && <span>{problem.difficulty}</span>}
                                </span>
                              )}

                              {/* Solving Time */}
                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-amber-600 dark:text-amber-400" />
                                <div className="flex items-center gap-1">
                                  {(() => {
                                    const { hours, minutes, seconds: secs } = getTimeComponents(solvingTime)
                                    return (
                                      <>
                                        <div className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                                          <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                                            {String(hours).padStart(2, '0')}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500">:</span>
                                        <div className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                                          <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                                            {String(minutes).padStart(2, '0')}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500">:</span>
                                        <div className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                                          <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                                            {String(secs).padStart(2, '0')}
                                          </span>
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">solving</span>
                              </div>

                              {/* Focus Time */}
                              <div className="flex items-center gap-2">
                                <Timer size={16} className="text-blue-600 dark:text-blue-400" />
                                <div className="flex items-center gap-1">
                                  {(() => {
                                    const { hours, minutes, seconds: secs } = getTimeComponents(userSolve?.focus_time || 0)
                                    return (
                                      <>
                                        <div className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                                          <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
                                            {String(hours).padStart(2, '0')}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500">:</span>
                                        <div className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                                          <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
                                            {String(minutes).padStart(2, '0')}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-500">:</span>
                                        <div className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
                                          <span className="text-xs font-bold text-blue-800 dark:text-blue-400">
                                            {String(secs).padStart(2, '0')}
                                          </span>
                                        </div>
                                      </>
                                    )
                                  })()}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">focus</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Section */}
                        <div className={`flex justify-center sm:flex-col items-center sm:items-end gap-2 sm:gap-2 ${!moduleHasStarted ? 'opacity-60' : ''}`}>
                          {/* Mobile: Horizontal Action Buttons */}
                          <div className="flex items-center gap-2 sm:hidden">
                            {/* Focus Button */}
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
                              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${moduleHasStarted
                                ? 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 active:scale-95'
                                : 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                                }`}
                              title="Focus timer"
                            >
                              <Timer size={20} className="text-blue-600 dark:text-blue-400" />
                            </button>

                            {/* Note Button */}
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
                              className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${hasNote
                                ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 active:scale-95'
                                : moduleHasStarted
                                  ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-95'
                                  : 'bg-gray-100 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                                }`}
                              title="Edit note"
                            >
                              <NotepadText
                                size={20}
                                className={hasNote ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}
                              />
                            </button>
                          </div>

                          {/* Desktop: Vertical Action Buttons */}
                          <div className="hidden sm:flex flex-col gap-2">
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
                              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${moduleHasStarted
                                ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer hover:scale-105'
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                              title="Focus timer"
                            >
                              <div className={`p-1.5 rounded-lg transition-colors ${moduleHasStarted
                                ? 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50'
                                : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                <Timer size={20} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="text-[9px] leading-tight text-gray-600 dark:text-gray-400 font-medium">focus</span>
                            </button>
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
                              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all ${moduleHasStarted
                                ? 'hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer hover:scale-105'
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                              title="Edit note"
                            >
                              <div className={`p-1.5 rounded-lg transition-colors ${hasNote
                                ? 'bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50'
                                : moduleHasStarted
                                  ? 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'
                                  : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                <NotepadText
                                  size={20}
                                  className={hasNote ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}
                                />
                              </div>
                              <span className="text-[9px] leading-tight text-gray-600 dark:text-gray-400 font-medium">note</span>
                            </button>
                          </div>

                          {/* State Button - Full Width on Mobile */}
                          <div className="w-full sm:w-auto">
                            {solvesLoading && isAuthenticated ? (
                              <button
                                disabled
                                className="w-full min-h-[44px] sm:min-h-[40px] flex items-center justify-center px-4 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-bold text-white transition-colors bg-gray-500 dark:bg-gray-500 cursor-not-allowed"
                              >
                                Loading...
                              </button>
                            ) : !moduleHasStarted ? (
                              <button
                                disabled
                                className="w-full min-h-[44px] sm:min-h-[40px] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-gray-400 dark:bg-gray-600 text-white rounded-xl text-sm sm:text-xs font-bold cursor-not-allowed opacity-60"
                              >
                                <Play size={16} className="sm:w-3.5 sm:h-3.5" />
                                <span>Start</span>
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
                                className="group w-full min-h-[44px] sm:min-h-[40px] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 dark:from-red-500 dark:to-rose-500 dark:hover:from-red-600 dark:hover:to-rose-600 text-white rounded-xl text-sm sm:text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                              >
                                <Play size={16} className="sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                                <span>Start</span>
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
                                className="group w-full min-h-[44px] sm:min-h-[40px] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white rounded-xl text-sm sm:text-xs font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                              >
                                <Clock size={16} className="sm:w-3.5 sm:h-3.5 animate-pulse" />
                                <span className="group-hover:hidden">In Progress</span>
                                <span className="hidden group-hover:inline">Mark Solved</span>
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
                                className="w-full min-h-[44px] sm:min-h-[40px] flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-sm sm:text-xs font-bold text-white transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-500 dark:to-emerald-500 dark:hover:from-green-600 dark:hover:to-emerald-600 shadow-md hover:shadow-lg active:scale-95"
                              >
                                <CheckCircle size={16} className="sm:w-3.5 sm:h-3.5" />
                                <span>Solved</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Modern mobile-first expanded view
                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4 mt-4">
                      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 transition-all duration-300 ease-in-out">
                        {/* Left Column: Problem Info - Mobile: Full Width, Desktop: Column */}
                        <div className="flex items-center h-full">
                          <div className="flex flex-col gap-4 items-center justify-center w-full p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
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
                                ) : !moduleHasStarted ? (
                                  <button
                                    disabled
                                    className="w-full min-h-[32px] flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-400 dark:bg-gray-600 text-white rounded-full text-xs font-bold cursor-not-allowed opacity-50"
                                  >
                                    <Play size={12} />
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

                        {/* Middle Column: Focus Timer - Mobile: Full Width, Desktop: Column */}
                        <div className="flex flex-col">
                          <div className="h-full min-h-[300px] sm:min-h-[400px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 sm:p-6 border border-blue-200/50 dark:border-blue-800/50 shadow-sm">
                            {moduleHasStarted ? (
                              <InlinePomodoroTimer
                                problemId={problem.id}
                                problemName={problem.name}
                                onComplete={(seconds) => handleFocusTimeComplete(problem.id, seconds)}
                                onUpdate={(seconds) => handleFocusTimeUpdate(problem.id, seconds)}
                                onElapsedChange={(seconds) => {
                                  setFocusTimeElapsed(prev => ({ ...prev, [problem.id]: seconds }))
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
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
                                Start the module to use focus timer
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Note Editor - Mobile: Full Width, Desktop: Column */}
                        <div className="flex flex-col">
                          <div className="h-full min-h-[300px] sm:min-h-[400px] bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 sm:p-6 border border-green-200/50 dark:border-green-800/50 shadow-sm">
                            {moduleHasStarted ? (
                              <InlineNoteEditor
                                problemId={problem.id}
                                initialContent={getUserSolve(problem.id)?.note || ''}
                                onSave={(content) => handleNoteSave(problem.id, content)}
                                onClose={() => setExpandedProblem(null)}
                                problemName={problem.name}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
                                Start the module to add notes
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

