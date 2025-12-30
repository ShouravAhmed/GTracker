'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { createClient } from './supabase/client'
import {
  getAllProblems,
  getUserSolves,
  getProblemSolveCounts,
  setProblemStatus as setProblemStatusServer,
  toggleProblemStatus as toggleProblemStatusServer,
  startProblem as startProblemServer,
  updateFocusTime as updateFocusTimeServer,
  updateProblemNote as updateProblemNoteServer,
  startModule as startModuleServer,
  isModuleStarted as isModuleStartedServer,
  getUserModuleStarts,
  getModuleProgress,
  getDayProgress,
  updateCurrentDay,
  type Problem,
  type UserSolve,
  type ModuleProgress,
} from './supabase/solves'

// Query keys
const QUERY_KEYS = {
  problems: ['problems'] as const,
  solveCounts: ['solveCounts'] as const,
  userSolves: ['userSolves'] as const,
  moduleStarts: ['moduleStarts'] as const,
  auth: ['auth'] as const,
  moduleProgress: ['moduleProgress'] as const,
  dayProgress: (day: number) => ['dayProgress', day] as const,
}

/**
 * Client-side hook for managing solves with TanStack Query for caching
 */
export function useSolves() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  // Check authentication
  const { data: isAuthenticated = false } = useQuery({
    queryKey: QUERY_KEYS.auth,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })

  // Fetch problems (cached for 30 minutes - problems rarely change)
  const {
    data: problems = [],
    isLoading: problemsLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.problems,
    queryFn: async () => {
      const allProblems = await getAllProblems()
      if (allProblems.length === 0) {
        console.warn('⚠️ No problems found in database. Please run: npm run upload-150day-problems')
      } else {
        console.log(`✅ Loaded ${allProblems.length} problems from database`)
      }
      return allProblems
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - problems rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
  })

  // Fetch solve counts (cached for 10 minutes)
  const {
    data: solveCounts = {},
    isLoading: countsLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.solveCounts,
    queryFn: async () => {
      return await getProblemSolveCounts()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: true, // Always fetch (public data)
  })

  // Fetch user solves (cached for 5 minutes, but can be optimistically updated)
  const {
    data: solves = {},
    isLoading: solvesLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.userSolves,
    queryFn: async () => {
      if (!isAuthenticated) {
        return {}
      }
      return await getUserSolves()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: isAuthenticated !== undefined, // Wait for auth check
  })

  // Fetch module starts (cached for 10 minutes)
  const {
    data: moduleStarts = {},
    isLoading: moduleStartsLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.moduleStarts,
    queryFn: async () => {
      if (!isAuthenticated) {
        return {}
      }
      try {
        return await getUserModuleStarts()
      } catch (error) {
        console.error('Error loading module starts:', error)
        return {}
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: isAuthenticated !== undefined && isAuthenticated,
  })

  // Fetch module progress for GAMAM 150 (cached for 5 minutes)
  const {
    data: moduleProgress = null,
    isLoading: progressLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.moduleProgress,
    queryFn: async () => {
      if (!isAuthenticated) {
        return null
      }
      return await getModuleProgress()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: isAuthenticated !== undefined && isAuthenticated,
    refetchInterval: 60 * 1000, // Refetch every minute to update overdue calculations
  })

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Invalidate queries when auth state changes
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSolves })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleStarts })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleProgress })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth, queryClient])

  const loading = problemsLoading || countsLoading || solvesLoading || moduleStartsLoading || progressLoading || progressLoading

  // Get problem status
  const getProblemStatus = useCallback((problemId: string): boolean => {
    return solves[problemId]?.solved ?? false
  }, [solves])

  // Get user solve data
  const getUserSolve = useCallback((problemId: string): UserSolve | undefined => {
    return solves[problemId]
  }, [solves])

  // Mutation for setting problem status
  const setProblemStatusMutation = useMutation({
    mutationFn: async ({ problemId, status }: { problemId: string; status: boolean }) => {
      if (!isAuthenticated) return
      await setProblemStatusServer(problemId, status)
    },
    onMutate: async ({ problemId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userSolves })

      // Snapshot previous value
      const previousSolves = queryClient.getQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves)

      // Optimistically update
      queryClient.setQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves, (old = {}) => {
        const updated = { ...old }
        if (updated[problemId]) {
          updated[problemId] = { ...updated[problemId], solved: status }
        } else {
          updated[problemId] = {
            id: '',
            user_id: '',
            problem_id: problemId,
            solved: status,
            focus_time: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        return updated
      })

      return { previousSolves }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousSolves) {
        queryClient.setQueryData(QUERY_KEYS.userSolves, context.previousSolves)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSolves })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleProgress })
    },
  })

  // Set problem status
  const setProblemStatus = useCallback(async (problemId: string, status: boolean): Promise<void> => {
    if (!isAuthenticated) return
    setProblemStatusMutation.mutate({ problemId, status })
  }, [isAuthenticated, setProblemStatusMutation])

  // Toggle problem status mutation
  const toggleProblemStatusMutation = useMutation({
    mutationFn: async (problemId: string) => {
      if (!isAuthenticated) return false
      return await toggleProblemStatusServer(problemId)
    },
    onMutate: async (problemId: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userSolves })
      const previousSolves = queryClient.getQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves)

      queryClient.setQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves, (old = {}) => {
        const updated = { ...old }
        const now = new Date().toISOString()
        const currentSolve = old[problemId]
        const isCurrentlySolved = currentSolve?.solved ?? false

        if (updated[problemId]) {
          if (isCurrentlySolved) {
            updated[problemId] = {
              ...updated[problemId],
              solved: false,
              solved_at: undefined,
              started_at: now,
            }
          } else {
            updated[problemId] = {
              ...updated[problemId],
              solved: true,
              solved_at: now,
            }
          }
        } else {
          updated[problemId] = {
            id: '',
            user_id: '',
            problem_id: problemId,
            solved: true,
            started_at: now,
            solved_at: now,
            focus_time: 0,
            created_at: now,
            updated_at: now,
          }
        }
        return updated
      })

      return { previousSolves }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSolves) {
        queryClient.setQueryData(QUERY_KEYS.userSolves, context.previousSolves)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSolves })
    },
  })

  // Toggle problem status
  const toggleProblemStatus = useCallback(async (problemId: string): Promise<boolean | null> => {
    if (!isAuthenticated) return null

    const currentSolve = solves[problemId]
    const isCurrentlySolved = currentSolve?.solved ?? false

    toggleProblemStatusMutation.mutate(problemId)
    return !isCurrentlySolved
  }, [isAuthenticated, solves, toggleProblemStatusMutation])

  // Start problem mutation
  const startProblemMutation = useMutation({
    mutationFn: async (problemId: string) => {
      if (!isAuthenticated) return false
      await startProblemServer(problemId)
      return true
    },
    onMutate: async (problemId: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userSolves })
      const previousSolves = queryClient.getQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves)

      queryClient.setQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves, (old = {}) => {
        const updated = { ...old }
        const startTime = new Date().toISOString()

        if (updated[problemId]) {
          updated[problemId] = {
            ...updated[problemId],
            solved: false,
            started_at: startTime,
            solved_at: undefined,
          }
        } else {
          updated[problemId] = {
            id: '',
            user_id: '',
            problem_id: problemId,
            solved: false,
            started_at: startTime,
            focus_time: 0,
            created_at: startTime,
            updated_at: startTime,
          }
        }
        return updated
      })

      return { previousSolves }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSolves) {
        queryClient.setQueryData(QUERY_KEYS.userSolves, context.previousSolves)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSolves })
    },
  })

  // Start problem
  const startProblem = useCallback(async (problemId: string): Promise<boolean> => {
    if (!isAuthenticated) return false
    startProblemMutation.mutate(problemId)
    return true
  }, [isAuthenticated, startProblemMutation])

  // Update focus time mutation
  const updateFocusTimeMutation = useMutation({
    mutationFn: async ({ problemId, additionalSeconds }: { problemId: string; additionalSeconds: number }) => {
      if (!isAuthenticated) return false
      await updateFocusTimeServer(problemId, additionalSeconds)
      return true
    },
    onMutate: async ({ problemId, additionalSeconds }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userSolves })
      const previousSolves = queryClient.getQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves)

      queryClient.setQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves, (old = {}) => {
        const updated = { ...old }
        if (updated[problemId]) {
          updated[problemId] = {
            ...updated[problemId],
            focus_time: (updated[problemId].focus_time || 0) + additionalSeconds,
          }
        }
        return updated
      })

      return { previousSolves }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSolves) {
        queryClient.setQueryData(QUERY_KEYS.userSolves, context.previousSolves)
      }
    },
  })

  // Update focus time
  const updateFocusTime = useCallback(async (problemId: string, additionalSeconds: number): Promise<boolean> => {
    if (!isAuthenticated) return false
    updateFocusTimeMutation.mutate({ problemId, additionalSeconds })
    return true
  }, [isAuthenticated, updateFocusTimeMutation])

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ problemId, note }: { problemId: string; note: string }) => {
      if (!isAuthenticated) return false
      await updateProblemNoteServer(problemId, note)
      return true
    },
    onMutate: async ({ problemId, note }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userSolves })
      const previousSolves = queryClient.getQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves)

      queryClient.setQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves, (old = {}) => {
        const updated = { ...old }
        if (updated[problemId]) {
          updated[problemId] = { ...updated[problemId], note }
        } else {
          updated[problemId] = {
            id: '',
            user_id: '',
            problem_id: problemId,
            solved: false,
            note,
            focus_time: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        return updated
      })

      return { previousSolves }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousSolves) {
        queryClient.setQueryData(QUERY_KEYS.userSolves, context.previousSolves)
      }
    },
  })

  // Update note
  const updateNote = useCallback(async (problemId: string, note: string): Promise<boolean> => {
    if (!isAuthenticated) return false
    updateNoteMutation.mutate({ problemId, note })
    return true
  }, [isAuthenticated, updateNoteMutation])

  // Login function
  const triggerLogin = useCallback(async (): Promise<void> => {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }, [supabase.auth])

  // Start module mutation
  const startModuleMutation = useMutation({
    mutationFn: async (moduleType: string) => {
      if (!isAuthenticated) return false
      return await startModuleServer(moduleType)
    },
    onSuccess: (success, moduleType) => {
      if (success) {
        queryClient.setQueryData<Record<string, boolean>>(QUERY_KEYS.moduleStarts, (old = {}) => ({
          ...old,
          [moduleType]: true,
        }))
      }
    },
  })

  // Start module
  const startModule = useCallback(async (moduleType: string): Promise<boolean> => {
    if (!isAuthenticated) return false
    startModuleMutation.mutate(moduleType)
    return true
  }, [isAuthenticated, startModuleMutation])

  // Check if module is started
  const checkModuleStarted = useCallback((moduleType: string): boolean => {
    return moduleStarts[moduleType] ?? false
  }, [moduleStarts])

  // Get day progress
  const getDayProgressData = useCallback(async (day: number) => {
    if (!isAuthenticated) return null
    return await getDayProgress(day)
  }, [isAuthenticated])

  // Update current day
  const updateCurrentDayData = useCallback(async (newDay: number) => {
    if (!isAuthenticated) return false
    const success = await updateCurrentDay(newDay)
    if (success) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleProgress })
    }
    return success
  }, [isAuthenticated, queryClient])

  // Refresh data function
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.problems })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.solveCounts })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSolves })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleStarts })
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleProgress })
  }, [queryClient])

  return {
    problems,
    solves,
    solveCounts,
    moduleStarts,
    moduleProgress,
    loading,
    isAuthenticated,
    getProblemStatus,
    getUserSolve,
    setProblemStatus,
    toggleProblemStatus,
    startProblem,
    updateFocusTime,
    updateNote,
    triggerLogin,
    startModule,
    checkModuleStarted,
    getDayProgressData,
    updateCurrentDayData,
    refreshData,
  }
}
