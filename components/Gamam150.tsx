'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSolves } from '@/lib/solves-client'
import { Play, Clock, Target, FileText, Users } from 'lucide-react'
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

  if (solvesLoading && problems.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading problems...</div>
      </div>
    )
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
                      className="grid grid-cols-1 sm:grid-cols-[40px_1fr_auto_auto_auto_auto_auto_auto] gap-2 sm:gap-4 items-center py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
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
                          className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs sm:text-sm"
                          title="Focus timer"
                        >
                          <Target size={14} />
                          Focus
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
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs sm:text-sm ${
                            hasNote
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                          title="Edit note"
                        >
                          <FileText size={14} />
                          Note
                        </button>
                      </div>
                      {/* State button column */}
                      <div className="relative">
                        {solvesLoading && isAuthenticated ? (
                          <button
                            disabled
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-colors bg-gray-500 dark:bg-gray-500 cursor-not-allowed"
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
                            className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-full text-xs sm:text-sm font-bold transition-colors"
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
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-full text-xs sm:text-sm font-bold transition-colors group animate-breathe"
                          >
                            <span className="group-hover:hidden">In progress</span>
                            <span className="hidden group-hover:inline">mark solved</span>
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
                            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white transition-colors bg-green-500 hover:bg-green-600 dark:bg-green-500 dark:hover:bg-green-600"
                          >
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
