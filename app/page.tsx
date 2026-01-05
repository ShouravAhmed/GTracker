'use client'

import { useMemo, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSolves } from '@/lib/solves-client'
import { Play, Calendar, FileText, CheckCircle2, TrendingUp, ArrowRight, Lock } from 'lucide-react'

interface ModuleCard {
  id: string
  title: string
  subtitle?: string
  route: string
  type: string
  colorScheme: {
    bg: string
    bgDark: string
    accent: string
  }
}

interface MaterialSet {
  id: string
  title: string
  modules: ModuleCard[]
}

const materialSets: MaterialSet[] = [
  {
    id: 'gamam-150',
    title: '150 Days GAMAM preparation',
    modules: [
      {
        id: 'gamam-150',
        title: 'GAMAM 150 Days Tracker',
        route: '/gamam-150',
        type: 'all',
        colorScheme: {
          bg: 'from-rose-500 via-rose-600 to-rose-700',
          bgDark: 'dark:from-rose-600 dark:via-rose-700 dark:to-rose-800',
          accent: 'rose',
        },
      },
      {
        id: 'coding',
        title: 'Coding Problems',
        route: '/coding',
        type: 'Coding',
        colorScheme: {
          bg: 'from-blue-500 via-blue-600 to-blue-700',
          bgDark: 'dark:from-blue-600 dark:via-blue-700 dark:to-blue-800',
          accent: 'blue',
        },
      },
      {
        id: 'system-design',
        title: 'System Design Problems',
        route: '/system-design',
        type: 'System Design',
        colorScheme: {
          bg: 'from-green-500 via-green-600 to-green-700',
          bgDark: 'dark:from-green-600 dark:via-green-700 dark:to-green-800',
          accent: 'green',
        },
      },
      {
        id: 'object-oriented-design',
        title: 'Object Oriented Design Problems',
        route: '/object-oriented-design',
        type: 'Object Oriented Design',
        colorScheme: {
          bg: 'from-orange-500 via-orange-600 to-orange-700',
          bgDark: 'dark:from-orange-600 dark:via-orange-700 dark:to-orange-800',
          accent: 'orange',
        },
      },
      {
        id: 'schema-design',
        title: 'Schema Design Problems',
        route: '/schema-design',
        type: 'Schema Design',
        colorScheme: {
          bg: 'from-sky-500 via-sky-600 to-sky-700',
          bgDark: 'dark:from-sky-600 dark:via-sky-700 dark:to-sky-800',
          accent: 'sky',
        },
      },
      {
        id: 'api-design',
        title: 'API Design Problems',
        route: '/api-design',
        type: 'API Design',
        colorScheme: {
          bg: 'from-indigo-500 via-indigo-600 to-indigo-700',
          bgDark: 'dark:from-indigo-600 dark:via-indigo-700 dark:to-indigo-800',
          accent: 'indigo',
        },
      },
      {
        id: 'behavioral',
        title: 'Behavioral Problems',
        route: '/behavioral',
        type: 'Behavioral',
        colorScheme: {
          bg: 'from-teal-500 via-teal-600 to-teal-700',
          bgDark: 'dark:from-teal-600 dark:via-teal-700 dark:to-teal-800',
          accent: 'teal',
        },
      },
    ],
  },
  {
    id: 'advanced-algorithms',
    title: 'Advanced Algorithms Mastery',
    modules: [
      {
        id: 'advanced-algo-1',
        title: 'Dynamic Programming',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-cyan-500 via-cyan-600 to-cyan-700',
          bgDark: 'dark:from-cyan-600 dark:via-cyan-700 dark:to-cyan-800',
          accent: 'cyan',
        },
      },
      {
        id: 'advanced-algo-2',
        title: 'Graph Algorithms',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-emerald-500 via-emerald-600 to-emerald-700',
          bgDark: 'dark:from-emerald-600 dark:via-emerald-700 dark:to-emerald-800',
          accent: 'emerald',
        },
      },
      {
        id: 'advanced-algo-3',
        title: 'Greedy Algorithms',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-rose-500 via-rose-600 to-rose-700',
          bgDark: 'dark:from-rose-600 dark:via-rose-700 dark:to-rose-800',
          accent: 'rose',
        },
      },
      {
        id: 'advanced-algo-4',
        title: 'Backtracking',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-violet-500 via-violet-600 to-violet-700',
          bgDark: 'dark:from-violet-600 dark:via-violet-700 dark:to-violet-800',
          accent: 'violet',
        },
      },
      {
        id: 'advanced-algo-5',
        title: 'String Algorithms',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-amber-500 via-amber-600 to-amber-700',
          bgDark: 'dark:from-amber-600 dark:via-amber-700 dark:to-amber-800',
          accent: 'amber',
        },
      },
      {
        id: 'advanced-algo-6',
        title: 'Bit Manipulation',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-sky-500 via-sky-600 to-sky-700',
          bgDark: 'dark:from-sky-600 dark:via-sky-700 dark:to-sky-800',
          accent: 'sky',
        },
      },
      {
        id: 'advanced-algo-7',
        title: 'Advanced Data Structures',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-fuchsia-500 via-fuchsia-600 to-fuchsia-700',
          bgDark: 'dark:from-fuchsia-600 dark:via-fuchsia-700 dark:to-fuchsia-800',
          accent: 'fuchsia',
        },
      },
    ],
  },
  {
    id: 'system-design-advanced',
    title: 'System Design Advanced Patterns',
    modules: [
      {
        id: 'system-advanced-1',
        title: 'Microservices Architecture',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-lime-500 via-lime-600 to-lime-700',
          bgDark: 'dark:from-lime-600 dark:via-lime-700 dark:to-lime-800',
          accent: 'lime',
        },
      },
      {
        id: 'system-advanced-2',
        title: 'Distributed Systems',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-red-500 via-red-600 to-red-700',
          bgDark: 'dark:from-red-600 dark:via-red-700 dark:to-red-800',
          accent: 'red',
        },
      },
      {
        id: 'system-advanced-3',
        title: 'Scalability Patterns',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-yellow-500 via-yellow-600 to-yellow-700',
          bgDark: 'dark:from-yellow-600 dark:via-yellow-700 dark:to-yellow-800',
          accent: 'yellow',
        },
      },
      {
        id: 'system-advanced-4',
        title: 'Caching Strategies',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-stone-500 via-stone-600 to-stone-700',
          bgDark: 'dark:from-stone-600 dark:via-stone-700 dark:to-stone-800',
          accent: 'stone',
        },
      },
      {
        id: 'system-advanced-5',
        title: 'Database Design',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-zinc-500 via-zinc-600 to-zinc-700',
          bgDark: 'dark:from-zinc-600 dark:via-zinc-700 dark:to-zinc-800',
          accent: 'zinc',
        },
      },
      {
        id: 'system-advanced-6',
        title: 'Message Queues',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-slate-500 via-slate-600 to-slate-700',
          bgDark: 'dark:from-slate-600 dark:via-slate-700 dark:to-slate-800',
          accent: 'slate',
        },
      },
      {
        id: 'system-advanced-7',
        title: 'Load Balancing',
        route: '#',
        type: 'dummy',
        colorScheme: {
          bg: 'from-neutral-500 via-neutral-600 to-neutral-700',
          bgDark: 'dark:from-neutral-600 dark:via-neutral-700 dark:to-neutral-800',
          accent: 'neutral',
        },
      },
    ],
  },
]

export default function Home() {
  const router = useRouter()
  const { problems, solves, loading, isAuthenticated, getProblemStatus, startProblem, triggerLogin, moduleProgress, moduleStarts, checkModuleStarted } = useSolves()
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component is mounted on client to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('Home page - Problems:', problems.length, 'Loading:', loading, 'Solves:', Object.keys(solves).length)
    if (problems.length === 0 && !loading) {
      console.warn('⚠️ No problems found in database. Please run: npm run upload-150day-problems')
    }
  }, [problems, loading, solves])

  // Calculate stats for each module
  const moduleStats = useMemo(() => {
    const stats: Record<string, { days: number; items: number; progress: number; hasStarted: boolean; firstProblemId?: string }> = {}

    for (const materialSet of materialSets) {
      for (const module of materialSet.modules) {
        // Skip dummy modules
        if (module.type === 'dummy') {
          stats[module.id] = {
            days: 15, // Fixed value to prevent hydration mismatch
            items: 50, // Fixed value to prevent hydration mismatch
            progress: 0,
            hasStarted: false,
          }
          continue
        }

        let moduleProblems = problems

        // Filter by type if not 'all'
        if (module.type !== 'all') {
          moduleProblems = problems.filter(p => p.type === module.type)
        }

        // Calculate unique days (for GAMAM 150) or just count problems
        const uniqueDays = new Set<number>()
        let firstProblemId: string | undefined
        let hasOtherProblems = false

        for (const problem of moduleProblems) {
          if (problem.day !== null && problem.day !== undefined) {
            uniqueDays.add(problem.day)
          } else {
            // Problems without day assignment belong to "Day 127-150"
            hasOtherProblems = true
          }
          if (!firstProblemId) {
            firstProblemId = problem.id
          }
        }

        // For GAMAM 150, always show 150 days total (unique days with assignments + Day 127-150 section)
        // For others, show item count as "days"
        const days = module.type === 'all' 
          ? 150 // Always 150 days total for GAMAM 150 challenge
          : moduleProblems.length
        const items = moduleProblems.length

        // Calculate progress
        let solvedCount = 0
        let hasStarted = false

        for (const problem of moduleProblems) {
          if (getProblemStatus(problem.id)) {
            solvedCount++
          }
          const userSolve = solves[problem.id]
          if (userSolve?.started_at) {
            hasStarted = true
          }
        }

        const progress = items > 0 ? Math.round((solvedCount / items) * 100) : 0

        stats[module.id] = {
          days,
          items,
          progress,
          hasStarted,
          firstProblemId,
        }
      }
    }

    return stats
  }, [problems, solves, getProblemStatus])

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

  const handleCardClick = (module: ModuleCard) => {
    if (module.route !== '#') {
      router.push(module.route)
    }
  }

  // Home page skeleton loader
  const HomePageSkeleton = () => (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {[...Array(3)].map((_, setIndex) => (
          <div key={setIndex} className="space-y-6">
            {/* Material Set Title Skeleton */}
            <div className="h-7 sm:h-8 w-64 sm:w-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>

            {/* Module Cards Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(7)].map((_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="relative overflow-hidden rounded-2xl shadow-lg animate-pulse min-h-[240px]"
                >
                  {/* Gradient Background Skeleton */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 dark:from-gray-700 dark:via-gray-600 dark:to-gray-800 opacity-90">
                    {/* Abstract shapes skeleton */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
                  </div>

                  {/* Card Content Skeleton */}
                  <div className="relative p-6 sm:p-7 h-full flex flex-col">
                    {/* Status Badge Skeleton */}
                    <div className="h-6 w-24 bg-white/20 dark:bg-white/10 rounded-full mb-3"></div>
                    
                    {/* Title Skeleton */}
                    <div className="h-7 w-3/4 bg-white/30 dark:bg-white/10 rounded mb-5"></div>
                    <div className="h-6 w-1/2 bg-white/20 dark:bg-white/5 rounded mb-5"></div>
                    
                    {/* Stats Skeleton */}
                    <div className="flex items-center gap-4 sm:gap-6 mb-5 flex-grow">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-white/20 dark:bg-white/10"></div>
                        <div className="flex flex-col gap-1">
                          <div className="h-5 w-12 bg-white/30 dark:bg-white/10 rounded"></div>
                          <div className="h-3 w-16 bg-white/20 dark:bg-white/5 rounded"></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-white/20 dark:bg-white/10"></div>
                        <div className="flex flex-col gap-1">
                          <div className="h-5 w-12 bg-white/30 dark:bg-white/10 rounded"></div>
                          <div className="h-3 w-20 bg-white/20 dark:bg-white/5 rounded"></div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Skeleton */}
                    <div className="mb-5">
                      <div className="h-2.5 w-full rounded-full bg-white/20 dark:bg-white/10"></div>
                    </div>

                    {/* Button Skeleton */}
                    <div className="h-10 w-32 rounded-xl bg-white/20 dark:bg-white/10"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Show skeleton during initial load or before client-side mount
  if (!isMounted || loading) {
    return <HomePageSkeleton />
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {materialSets.map((materialSet) => (
          <div key={materialSet.id} className="space-y-6">
            {/* Material Set Title - smaller and left-aligned */}
            <h2 className="text-xl sm:text-2xl font-bold text-left text-gray-900 dark:text-white">
              {materialSet.title}
            </h2>

            {/* Module Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {materialSet.modules.map((module) => {
                const stats = moduleStats[module.id] || { days: 0, items: 0, progress: 0, hasStarted: false }
                const { days, items, progress } = stats

                const isDummy = module.type === 'dummy'
                const hasProgress = progress > 0
                const isCompleted = progress === 100
                const isGamam150 = module.id === 'gamam-150' && module.type === 'all'
                const moduleHasStarted = checkModuleStarted(module.type)

                return (
                  <div
                    key={module.id}
                    className={`relative group overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
                      isDummy 
                        ? 'cursor-default opacity-60' 
                        : 'cursor-pointer hover:-translate-y-2 hover:scale-[1.02]'
                    }`}
                    onClick={() => handleCardClick(module)}
                  >
                    {/* Abstract Background with enhanced depth */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.colorScheme.bg} ${module.colorScheme.bgDark} transition-opacity duration-500 group-hover:opacity-95`}>
                      {/* Enhanced abstract geometric shapes */}
                      <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
                      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
                      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-white/5 rounded-lg blur-xl -translate-x-1/2 -translate-y-1/2 rotate-45 transition-transform duration-1000 group-hover:rotate-90"></div>
                      <div className="absolute top-1/4 right-1/4 w-24 h-24 bg-white/10 rounded-full blur-lg transition-transform duration-500 group-hover:scale-125"></div>
                      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-white/5 rounded-full blur-md transition-transform duration-500 group-hover:scale-125"></div>
                      <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-white/10 rounded-sm blur-md rotate-12 transition-transform duration-700 group-hover:rotate-45"></div>
                      <div className="absolute bottom-1/3 left-1/4 w-14 h-14 bg-white/5 rounded-full blur-sm transition-transform duration-700 group-hover:scale-150"></div>
                    </div>

                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/10 to-transparent pointer-events-none`}></div>

                    {/* Content */}
                    <div className="relative p-6 sm:p-7 h-full flex flex-col min-h-[240px]">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between mb-3">
                        {isDummy ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                            <Lock size={14} className="text-white/70" />
                            <span className="text-xs font-medium text-white/70">Coming Soon</span>
                          </div>
                        ) : (
                          <>
                            {isCompleted ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                                <CheckCircle2 size={14} className="text-white" />
                                <span className="text-xs font-medium text-white">Completed</span>
                              </div>
                            ) : hasProgress ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
                                <TrendingUp size={14} className="text-white" />
                                <span className="text-xs font-medium text-white">In Progress</span>
                              </div>
                            ) : (
                              <div className="h-6"></div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Title Section */}
                      <div className="mb-5 flex-grow">
                        {module.subtitle && (
                          <p className="text-xs sm:text-sm text-white/70 mb-2 font-medium uppercase tracking-wider">
                            {module.subtitle}
                          </p>
                        )}
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-5 line-clamp-2 leading-tight">
                          {module.title}
                        </h3>

                        {/* Stats with Icons */}
                        {isGamam150 && moduleProgress ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-4 sm:gap-6">
                              <div className="flex items-center gap-2.5 text-white/90">
                                <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                  <Calendar size={16} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-lg font-bold text-white">Day {moduleProgress.currentDay + 1}</span>
                                  <span className="text-xs text-white/70 font-medium">Ongoing</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2.5 text-white/90">
                                <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                  <CheckCircle2 size={16} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-lg font-bold text-white">{moduleProgress.completedDays}</span>
                                  <span className="text-xs text-white/70 font-medium">Completed</span>
                                </div>
                              </div>
                            </div>
                            
                            {moduleProgress.overdueDays > 0 && (
                              <div className="flex items-center gap-2.5 text-red-200">
                                <div className="p-1.5 rounded-lg bg-red-500/20 backdrop-blur-sm">
                                  <TrendingUp size={16} className="text-red-200" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-lg font-bold text-red-200">{moduleProgress.overdueDays}</span>
                                  <span className="text-xs text-red-200/70 font-medium">Overdue Days</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 sm:gap-6">
                            {module.type === 'all' ? (
                              // For GAMAM 150, show both Days and Items
                              <>
                                <div className="flex items-center gap-2.5 text-white/90">
                                  <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                    <Calendar size={16} className="text-white" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-lg font-bold text-white">{days}</span>
                                    <span className="text-xs text-white/70 font-medium">Days</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2.5 text-white/90">
                                  <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                    <FileText size={16} className="text-white" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-lg font-bold text-white">{items}</span>
                                    <span className="text-xs text-white/70 font-medium">Total Items</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              // For category cards, only show Total Items (days and items are the same)
                              <div className="flex items-center gap-2.5 text-white/90">
                                <div className="p-1.5 rounded-lg bg-white/10 backdrop-blur-sm">
                                  <FileText size={16} className="text-white" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-lg font-bold text-white">{items}</span>
                                  <span className="text-xs text-white/70 font-medium">Total Items</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      {!isDummy && (
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-white/90">Progress</span>
                            <span className="text-sm font-bold text-white">
                              {isGamam150 && moduleProgress 
                                ? `${moduleProgress.completedPercentage}%${moduleProgress.overduePercentage > 0 ? ` (+${moduleProgress.overduePercentage}% overdue)` : ''}`
                                : `${progress}%`}
                            </span>
                          </div>
                          <div className="h-2.5 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden relative">
                            {isGamam150 && moduleProgress ? (
                              <>
                                {/* Completed progress (green) */}
                                <div 
                                  className="h-full bg-green-500/80 dark:bg-green-600/80 transition-all duration-700 ease-out absolute left-0"
                                  style={{ width: `${moduleProgress.completedPercentage}%` }}
                                />
                                {/* Overdue progress (red) */}
                                {moduleProgress.overduePercentage > 0 && (
                                  <div 
                                    className="h-full bg-red-500/80 dark:bg-red-600/80 transition-all duration-700 ease-out absolute"
                                    style={{ 
                                      left: `${moduleProgress.completedPercentage}%`,
                                      width: `${moduleProgress.overduePercentage}%` 
                                    }}
                                  />
                                )}
                                {/* Shimmer effect on completed */}
                                {moduleProgress.completedPercentage > 0 && (
                                  <div 
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                                    style={{ width: `${moduleProgress.completedPercentage}%` }}
                                  />
                                )}
                              </>
                            ) : (
                              <div 
                                className="h-full rounded-full bg-white/40 backdrop-blur-sm transition-all duration-700 ease-out relative overflow-hidden"
                                style={{ width: `${progress}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      {!isDummy && (
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartModule(module.id, module)
                            }}
                            className="group/btn flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 transition-all duration-300 hover:scale-105 active:scale-95 w-full"
                            aria-label={`Start ${module.title}`}
                          >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover/btn:bg-white/30 transition-colors">
                              <Play size={14} className="text-white ml-0.5" fill="white" />
                            </div>
                            <span className="text-sm font-semibold text-white flex-grow text-left">
                              {moduleHasStarted ? (hasProgress ? 'Continue' : 'View') : 'Start'}
                            </span>
                            <ArrowRight size={16} className="text-white/80 group-hover/btn:translate-x-1 transition-transform" />
                          </button>
                        </div>
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
  )
}
