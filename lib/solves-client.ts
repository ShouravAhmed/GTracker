'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect } from 'react'
import { useToast } from '@/components/Toast'
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
  updateProblemRating as updateProblemRatingServer,
  toggleProblemFollowup as toggleProblemFollowupServer,
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
  const { showToast } = useToast()

  // Check authentication
  const { data: isAuthenticated = false } = useQuery({
    queryKey: QUERY_KEYS.auth,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return !!user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Fetch problems (cached for 30 minutes - problems rarely change)
  const {
    data: problems = [],
    isLoading: problemsLoading,
    error: problemsError,
  } = useQuery({
    queryKey: QUERY_KEYS.problems,
    queryFn: async () => {
      try {
        const allProblems = await getAllProblems()
        if (allProblems.length === 0) {
          console.warn('⚠️ No problems found in database. Please run: npm run upload-150day-problems')
        } else {
          console.log(`✅ Loaded ${allProblems.length} problems from database`)
        }
        return allProblems
      } catch (error) {
        console.error('Error fetching problems:', error)
        // Return empty array instead of throwing to prevent app crash
        return []
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - problems rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Retry once on failure
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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  // Fetch module progress for GAMAM 150 (cached for 5 minutes)
  // Only refetches when invalidated by mutations (e.g., when problem status changes)
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
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // No refetchInterval - only refetch when invalidated by mutations
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

  const loading = problemsLoading || countsLoading || solvesLoading || moduleStartsLoading || progressLoading

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
      if (context?.previousSolves) {
        queryClient.setQueryData(QUERY_KEYS.userSolves, context.previousSolves)
      }
      showToast('Failed to save changes. Please try again.')
    },
    onSettled: () => {
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
      showToast('Failed to save changes. Please try again.')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSolves })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleProgress })
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
      if (!isAuthenticated) {
        console.warn('[startProblem] Not authenticated, skipping')
        return false
      }
      console.log('[startProblem] Calling server for problemId:', problemId)
      const result = await startProblemServer(problemId)
      console.log('[startProblem] Server returned:', result)
      if (!result.ok) {
        const msg = result.reason ?? 'Unknown error'
        console.error('[startProblem] Server failure reason:', msg)
        throw new Error(msg)
      }
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
    onError: (err, problemId, context) => {
      const reason = err instanceof Error ? err.message : String(err)
      console.error('[startProblem] Mutation error:', reason, 'problemId:', problemId)
      if (context?.previousSolves) {
        queryClient.setQueryData(QUERY_KEYS.userSolves, context.previousSolves)
      }
      showToast(`Failed to start problem. ${reason}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSolves })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleProgress })
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
      const ok = await updateFocusTimeServer(problemId, additionalSeconds)
      if (!ok) throw new Error('Failed to save focus time')
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
      showToast('Failed to save focus time. Please try again.')
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
      const ok = await updateProblemNoteServer(problemId, note)
      if (!ok) throw new Error('Failed to save note')
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
      showToast('Failed to save note. Please try again.')
    },
  })

  // Update note
  const updateNote = useCallback(async (problemId: string, note: string): Promise<boolean> => {
    if (!isAuthenticated) return false
    updateNoteMutation.mutate({ problemId, note })
    return true
  }, [isAuthenticated, updateNoteMutation])

  // Update rating mutation
  const updateRatingMutation = useMutation({
    mutationFn: async ({ problemId, rating }: { problemId: string; rating: number | null }) => {
      if (!isAuthenticated) return false
      const ok = await updateProblemRatingServer(problemId, rating)
      if (!ok) throw new Error('Failed to save rating')
      return true
    },
    onMutate: async ({ problemId, rating }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userSolves })
      const previousSolves = queryClient.getQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves)

      queryClient.setQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves, (old = {}) => {
        const updated = { ...old }
        const now = new Date().toISOString()
        if (updated[problemId]) {
          updated[problemId] = {
            ...updated[problemId],
            rating,
            rated_at: rating === null ? null : now,
          }
        } else {
          updated[problemId] = {
            id: '',
            user_id: '',
            problem_id: problemId,
            solved: false,
            focus_time: 0,
            rating,
            rated_at: rating === null ? null : now,
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
      showToast('Failed to save rating. Please try again.')
    },
  })

  // Update rating
  const updateRating = useCallback(async (problemId: string, rating: number | null): Promise<boolean> => {
    if (!isAuthenticated) return false
    updateRatingMutation.mutate({ problemId, rating })
    return true
  }, [isAuthenticated, updateRatingMutation])

  // Toggle follow-up mutation
  const toggleFollowupMutation = useMutation({
    mutationFn: async (problemId: string) => {
      if (!isAuthenticated) return false
      return await toggleProblemFollowupServer(problemId)
    },
    onMutate: async (problemId: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.userSolves })
      const previousSolves = queryClient.getQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves)

      queryClient.setQueryData<Record<string, UserSolve>>(QUERY_KEYS.userSolves, (old = {}) => {
        const updated = { ...old }
        const now = new Date().toISOString()
        const nextFollowup = !(old[problemId]?.followup ?? false)

        if (updated[problemId]) {
          updated[problemId] = {
            ...updated[problemId],
            followup: nextFollowup,
            followup_at: nextFollowup ? now : null,
          }
        } else {
          updated[problemId] = {
            id: '',
            user_id: '',
            problem_id: problemId,
            solved: false,
            focus_time: 0,
            followup: nextFollowup,
            followup_at: nextFollowup ? now : null,
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
      showToast('Failed to update follow-up. Please try again.')
    },
  })

  // Toggle follow-up
  const toggleFollowup = useCallback(async (problemId: string): Promise<boolean> => {
    if (!isAuthenticated) return false
    toggleFollowupMutation.mutate(problemId)
    return true
  }, [isAuthenticated, toggleFollowupMutation])

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
        if (moduleType === 'all') {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleProgress })
        }
      } else {
        showToast('Failed to start module. Please try again.')
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
    } else {
      showToast('Failed to update day. Please try again.')
    }
    return success
  }, [isAuthenticated, queryClient, showToast])

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
    updateRating,
    toggleFollowup,
    triggerLogin,
    startModule,
    checkModuleStarted,
    getDayProgressData,
    updateCurrentDayData,
    refreshData,
  }
}
