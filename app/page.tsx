'use client'

import { useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSolves } from '@/lib/solves-client'
import { Play } from 'lucide-react'

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
          bg: 'from-purple-500 via-purple-600 to-purple-700',
          bgDark: 'dark:from-purple-600 dark:via-purple-700 dark:to-purple-800',
          accent: 'purple',
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
          bg: 'from-pink-500 via-pink-600 to-pink-700',
          bgDark: 'dark:from-pink-600 dark:via-pink-700 dark:to-pink-800',
          accent: 'pink',
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
  const { problems, solves, loading, isAuthenticated, getProblemStatus, startProblem, triggerLogin } = useSolves()

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
            days: Math.floor(Math.random() * 20) + 5,
            items: Math.floor(Math.random() * 100) + 10,
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

        for (const problem of moduleProblems) {
          if (problem.day !== null && problem.day !== undefined) {
            uniqueDays.add(problem.day)
          }
          if (!firstProblemId) {
            firstProblemId = problem.id
          }
        }

        // For GAMAM 150, show unique days; for others, show item count as "days"
        const days = module.type === 'all' ? uniqueDays.size : moduleProblems.length
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
                  className="relative overflow-hidden rounded-xl shadow-lg animate-pulse"
                >
                  {/* Gradient Background Skeleton */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 dark:from-gray-700 dark:via-gray-600 dark:to-gray-800 opacity-90">
                    {/* Abstract shapes skeleton */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
                  </div>

                  {/* Card Content Skeleton */}
                  <div className="relative p-6 h-full flex flex-col">
                    {/* Title Skeleton */}
                    <div className="h-6 sm:h-7 w-3/4 bg-white/30 dark:bg-white/10 rounded mb-4"></div>
                    
                    {/* Stats Skeleton */}
                    <div className="flex flex-col gap-2 mb-4 flex-grow">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-8 bg-white/30 dark:bg-white/10 rounded"></div>
                        <div className="h-3 w-12 bg-white/20 dark:bg-white/5 rounded"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-8 bg-white/30 dark:bg-white/10 rounded"></div>
                        <div className="h-3 w-12 bg-white/20 dark:bg-white/5 rounded"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-8 bg-white/30 dark:bg-white/10 rounded"></div>
                      </div>
                    </div>

                    {/* Play Button Skeleton */}
                    <div className="w-12 h-12 rounded-full bg-white/20 dark:bg-white/10 border border-white/20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Debug logging
  useEffect(() => {
    console.log('Home page - Problems:', problems.length, 'Loading:', loading, 'Solves:', Object.keys(solves).length)
  }, [problems, loading, solves])

  if (loading) {
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

                return (
                  <div
                    key={module.id}
                    className={`relative group overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                      module.type === 'dummy' ? 'cursor-default' : 'cursor-pointer'
                    }`}
                    onClick={() => handleCardClick(module)}
                  >
                    {/* Abstract Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.colorScheme.bg} ${module.colorScheme.bgDark} opacity-90`}>
                      {/* Abstract geometric shapes - matching image style */}
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>
                      <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-white/5 rounded-lg blur-xl -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
                      <div className="absolute top-1/4 right-1/4 w-20 h-20 bg-white/10 rounded-full blur-lg"></div>
                      <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-white/5 rounded-full blur-md"></div>
                      {/* Additional geometric shapes */}
                      <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-white/10 rounded-sm blur-md rotate-12"></div>
                      <div className="absolute bottom-1/3 left-1/4 w-10 h-10 bg-white/5 rounded-full blur-sm"></div>
                    </div>

                    {/* Content */}
                    <div className="relative p-6 h-full flex flex-col">
                      {/* Title */}
                      {module.subtitle && (
                        <p className="text-xs sm:text-sm text-white/80 mb-1 font-medium">
                          {module.subtitle}
                        </p>
                      )}
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-4 line-clamp-2">
                        {module.title}
                      </h3>

                      {/* Stats */}
                      <div className="flex flex-col gap-2 mb-4 flex-grow">
                        <div className="flex items-center gap-2 text-white/90">
                          <span className="text-sm font-medium">{days}</span>
                          <span className="text-xs text-white/70">
                            {module.type === 'all' ? 'Days' : 'Items'}
            </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/90">
                          <span className="text-sm font-medium">{items}</span>
                          <span className="text-xs text-white/70">Items</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/90">
                          <span className="text-sm font-medium">{progress}%</span>
                        </div>
                      </div>

                      {/* Play Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartModule(module.id, module)
                        }}
                        className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group/btn"
                      >
                        <Play size={20} className="text-white ml-0.5" fill="white" />
                      </button>
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
