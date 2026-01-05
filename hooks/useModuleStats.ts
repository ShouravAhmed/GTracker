import { useMemo } from 'react'
import type { Problem } from '@/lib/supabase/solves'
import type { UserSolve, ModuleProgress } from '@/lib/supabase/solves'
import type { ModuleStatsMap } from '@/types/home'
import { materialSets } from '@/lib/material-sets'

interface UseModuleStatsParams {
  problems: Problem[]
  solves: Record<string, UserSolve>
  getProblemStatus: (problemId: string) => boolean
  moduleProgress?: ModuleProgress | null
}

/**
 * Custom hook to calculate statistics for each module
 * Handles error cases and provides safe defaults
 */
export function useModuleStats({
  problems,
  solves,
  getProblemStatus,
  moduleProgress,
}: UseModuleStatsParams): ModuleStatsMap {
  return useMemo(() => {
    try {
      const stats: ModuleStatsMap = {}

      // Ensure problems is an array to prevent errors
      const safeProblems = Array.isArray(problems) ? problems : []
      const safeSolves = solves && typeof solves === 'object' ? solves : {}

      for (const materialSet of materialSets) {
        for (const module of materialSet.modules) {
          // Skip dummy modules
          if (module.type === 'dummy') {
            stats[module.id] = {
              days: 15,
              items: 50,
              progress: 0,
              hasStarted: false,
            }
            continue
          }

          let moduleProblems = safeProblems

          // Filter by type if not 'all'
          if (module.type !== 'all') {
            moduleProblems = safeProblems.filter((p) => p && p.type === module.type)
          }

          // Calculate unique days (for GAMAM 150) or just count problems
          const uniqueDays = new Set<number>()
          let firstProblemId: string | undefined
          let hasOtherProblems = false

          for (const problem of moduleProblems) {
            if (problem && problem.day !== null && problem.day !== undefined) {
              uniqueDays.add(problem.day)
            } else if (problem) {
              // Problems without day assignment belong to "Day 127-150"
              hasOtherProblems = true
            }
            if (problem && !firstProblemId) {
              firstProblemId = problem.id
            }
          }

          // For GAMAM 150, always show 150 days total
          // For others, show item count as "days"
          const days = module.type === 'all' ? 150 : moduleProblems.length
          const items = moduleProblems.length

          // Calculate progress
          let solvedCount = 0
          let hasStarted = false

          for (const problem of moduleProblems) {
            if (problem && getProblemStatus(problem.id)) {
              solvedCount++
            }
            if (problem) {
              const userSolve = safeSolves[problem.id]
              if (userSolve?.started_at) {
                hasStarted = true
              }
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
    } catch (error) {
      console.error('Error calculating module stats:', error)
      return {}
    }
  }, [problems, solves, getProblemStatus, moduleProgress])
}

