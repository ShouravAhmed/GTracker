'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSolves } from '@/lib/solves-client'
import { Play, CheckCircle } from 'lucide-react'
import { SkeletonLoader } from './Gamam150/SkeletonLoader'
import { ProblemRow } from './Gamam150/ProblemRow'
import { ProblemFilterSortBar, type SortField, type SortDir } from './Gamam150/ProblemFilterSortBar'
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
    updateRating,
    toggleFollowup,
  } = useSolves()

  const [categoryProblems, setCategoryProblems] = useState<DBProblem[]>([])
  const [expandedProblem, setExpandedProblem] = useState<ExpandedProblem | null>(null)
  const [elapsedTimes, setElapsedTimes] = useState<Record<string, number>>({})
  const [lastSavedTimes, setLastSavedTimes] = useState<Record<string, number>>({})
  const [focusTimeElapsed, setFocusTimeElapsed] = useState<Record<string, number>>({})

  const [filterFollowup, setFilterFollowup] = useState(false)
  const [filterStarred, setFilterStarred] = useState(false)
  const [sortField, setSortField] = useState<SortField>('followup_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const hasAutoScrolled = useRef(false)

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

  const handleRate = async (problemId: string, rating: number | null) => {
    if (!isAuthenticated) {
      await triggerLogin()
      return
    }
    await updateRating(problemId, rating)
  }

  const handleToggleFollowup = async (problemId: string) => {
    if (!isAuthenticated) {
      await triggerLogin()
      return
    }
    await toggleFollowup(problemId)
  }

  // Problems shown when the Follow-up/Starred filters are active: flattened
  // (grouping doesn't apply to a plain category list) and sorted
  const filteredSortedProblems = useMemo(() => {
    if (!filterFollowup && !filterStarred) return null

    const matching = categoryProblems.filter(problem => {
      const solve = getUserSolve(problem.id)
      if (filterFollowup && !solve?.followup) return false
      if (filterStarred && (solve?.rating === undefined || solve?.rating === null)) return false
      return true
    })

    const dir = sortDir === 'asc' ? 1 : -1
    return [...matching].sort((a, b) => {
      const solveA = getUserSolve(a.id)
      const solveB = getUserSolve(b.id)
      if (sortField === 'rating') {
        return ((solveA?.rating ?? 0) - (solveB?.rating ?? 0)) * dir
      }
      const fieldName = sortField === 'followup_at' ? 'followup_at' : 'rated_at'
      const timeA = solveA?.[fieldName] ? new Date(solveA[fieldName] as string).getTime() : 0
      const timeB = solveB?.[fieldName] ? new Date(solveB[fieldName] as string).getTime() : 0
      return (timeA - timeB) * dir
    })
  }, [categoryProblems, filterFollowup, filterStarred, sortField, sortDir, getUserSolve])

  const visibleProblems = filteredSortedProblems ?? categoryProblems

  // Auto-scroll to the first unsolved problem once, on entering the page
  const firstUnsolvedProblemId = useMemo(() => {
    return categoryProblems.find(problem => !getProblemStatus(problem.id))?.id
  }, [categoryProblems, getProblemStatus])

  useEffect(() => {
    if (hasAutoScrolled.current) return
    if (!moduleHasStarted || filteredSortedProblems) return
    if (!firstUnsolvedProblemId) return

    hasAutoScrolled.current = true
    const timeout = setTimeout(() => {
      document.getElementById(`problem-${firstUnsolvedProblemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    return () => clearTimeout(timeout)
  }, [firstUnsolvedProblemId, moduleHasStarted, filteredSortedProblems])

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

        <ProblemFilterSortBar
          filterFollowup={filterFollowup}
          filterStarred={filterStarred}
          onToggleFollowup={() => setFilterFollowup(prev => !prev)}
          onToggleStarred={() => setFilterStarred(prev => !prev)}
          sortField={sortField}
          onSortFieldChange={setSortField}
          sortDir={sortDir}
          onToggleSortDir={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
        />

        <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
          {visibleProblems.map((problem) => {
              const isSolved = getProblemStatus(problem.id)
              const userSolve = getUserSolve(problem.id)
              const solveCount = solveCounts[problem.id] || 0

              // Calculate solving time. Live "now" is deliberately not computed
              // here (render must stay pure) — elapsedTimes is ticked every
              // second by the effect above and covers this; until that first
              // tick lands for a just-started problem, it briefly reads 0.
              let solvingTime: number = 0
              const hasStarted = !!userSolve?.started_at
              const isInProgress = hasStarted && !isSolved
              if (isInProgress && userSolve?.started_at) {
                solvingTime = elapsedTimes[problem.id] ?? 0
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
                <ProblemRow
                  key={problem.id}
                  problem={problem}
                  index={categoryProblems.indexOf(problem) + 1}
                  moduleHasStarted={moduleHasStarted}
                  isAuthenticated={isAuthenticated}
                  solvesLoading={solvesLoading}
                  isSolved={isSolved}
                  userSolve={userSolve}
                  solveCount={solveCount}
                  isExpanded={isExpanded}
                  solvingTime={solvingTime}
                  focusTimeElapsedForProblem={focusTimeElapsed[problem.id] || 0}
                  lastSavedTimeForProblem={lastSavedTimes[problem.id] || 0}
                  onToggleStatus={async () => {
                    if (!isAuthenticated) {
                      await triggerLogin()
                      return
                    }
                    await updateProblemStatus(problem.id)
                  }}
                  onStart={async () => {
                    if (!isAuthenticated) {
                      await triggerLogin()
                      return
                    }
                    await handleStartProblem(problem.id)
                  }}
                  onToggleFocus={async () => {
                    if (!moduleHasStarted) return
                    if (!isAuthenticated) {
                      await triggerLogin()
                      return
                    }
                    toggleFocus(problem.id)
                  }}
                  onToggleNote={async () => {
                    if (!moduleHasStarted) return
                    if (!isAuthenticated) {
                      await triggerLogin()
                      return
                    }
                    toggleNote(problem.id)
                  }}
                  onFocusTimeComplete={(seconds) => handleFocusTimeComplete(problem.id, seconds)}
                  onFocusTimeUpdate={(seconds) => handleFocusTimeUpdate(problem.id, seconds)}
                  onFocusElapsedChange={(seconds) => {
                    setFocusTimeElapsed(prev => ({ ...prev, [problem.id]: seconds }))
                    setLastSavedTimes(prev => {
                      if (!prev[problem.id]) {
                        return { ...prev, [problem.id]: 0 }
                      }
                      return prev
                    })
                  }}
                  onNoteSave={(content) => handleNoteSave(problem.id, content)}
                  onCloseFocusView={() => handleCloseFocusView(problem.id)}
                  onCloseNoteView={() => setExpandedProblem(null)}
                  onRate={(rating) => handleRate(problem.id, rating)}
                  onToggleFollowup={() => handleToggleFollowup(problem.id)}
                />
              )
            })}
        </div>
      </div>
    </div>
  )
}

