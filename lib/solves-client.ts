'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from './supabase/client'
import {
  getAllProblems,
  getUserSolves,
  getProblemSolveCounts,
  setProblemStatus as setProblemStatusServer,
  toggleProblemStatus as toggleProblemStatusServer,
  startProblem as startProblemServer,
  updateTimeWorked as updateTimeWorkedServer,
  updateFocusTime as updateFocusTimeServer,
  updateProblemNote as updateProblemNoteServer,
  type Problem,
  type UserSolve,
} from './supabase/solves'

// Cache for problems and solves
let problemsCache: Problem[] | null = null
let solvesCache: Record<string, UserSolve> | null = null
let solveCountsCache: Record<string, number> | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Client-side hook for managing solves with Supabase
 * Includes frontend caching to avoid loading states
 */
export function useSolves() {
  const [solves, setSolves] = useState<Record<string, UserSolve>>({})
  const [problems, setProblems] = useState<Problem[]>([])
  const [solveCounts, setSolveCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const supabase = createClient()

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
      if (session?.user) {
        loadData()
      } else {
        setSolves({})
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  // Load all data (problems, solves, counts) with caching
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Check cache first
      const now = Date.now()
      if (problemsCache && solvesCache && solveCountsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        setProblems(problemsCache)
        setSolves(solvesCache)
        setSolveCounts(solveCountsCache)
        setLoading(false)
        return
      }

      // Load problems (always load, but cache)
      const allProblems = await getAllProblems()
      problemsCache = allProblems
      setProblems(allProblems)

      // Load solve counts (always load, but cache)
      const counts = await getProblemSolveCounts()
      solveCountsCache = counts
      setSolveCounts(counts)

      // Load solves if authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userSolves = await getUserSolves()
        solvesCache = userSolves
        setSolves(userSolves)
      } else {
        solvesCache = {}
        setSolves({})
      }

      cacheTimestamp = now
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  // Load data on mount and when auth changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Get problem status
  const getProblemStatus = useCallback((problemId: string): boolean => {
    return solves[problemId]?.solved ?? false
  }, [solves])

  // Get user solve data
  const getUserSolve = useCallback((problemId: string): UserSolve | undefined => {
    return solves[problemId]
  }, [solves])

  // Set problem status
  const setProblemStatus = useCallback(async (problemId: string, status: boolean): Promise<void> => {
    try {
      if (isAuthenticated) {
        // Optimistically update UI immediately
        let optimisticSolves: Record<string, UserSolve> = {}
        setSolves(prev => {
          const updated = { ...prev }
          if (updated[problemId]) {
            updated[problemId] = { ...updated[problemId], solved: status }
          } else {
            // Create new solve entry
            updated[problemId] = {
              id: '',
              user_id: '',
              problem_id: problemId,
              solved: status,
              total_time_worked: 0,
              focus_time: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
          
          // Store optimistic state for cache
          optimisticSolves = updated
          return updated
        })
        // Update cache immediately with optimistic values
        solvesCache = optimisticSolves
        cacheTimestamp = Date.now()
        
        // Save to server in background (don't await - fire and forget)
        setProblemStatusServer(problemId, status).catch((error) => {
          console.error('Error saving problem status to server:', error)
          // On error, revert optimistic update by reloading data
          loadData()
        })
      }
    } catch (error) {
      console.error('Error setting problem status:', error)
      // On error, revert optimistic update by reloading data
      loadData()
    }
  }, [isAuthenticated, loadData])

  // Toggle problem status
  // When marking a problem as solved, all other in-progress problems will be reset to "start" state.
  const toggleProblemStatus = useCallback(async (problemId: string): Promise<boolean | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    try {
      const currentStatus = solves[problemId]?.solved ?? false
      const newStatus = !currentStatus

      // Optimistically update UI immediately
      let optimisticSolves: Record<string, UserSolve> = {}
      setSolves(prev => {
        const updated = { ...prev }
        
        // If marking as solved, clear all other in-progress problems
        if (newStatus) {
          for (const [id, solve] of Object.entries(updated)) {
            if (id !== problemId && solve.started_at && !solve.solved) {
              updated[id] = {
                ...solve,
                started_at: undefined,
              }
            }
          }
        }
        
        // Update the current problem's status
        if (updated[problemId]) {
          updated[problemId] = { ...updated[problemId], solved: newStatus }
        } else {
          updated[problemId] = {
            id: '',
            user_id: '',
            problem_id: problemId,
            solved: newStatus,
            total_time_worked: 0,
            focus_time: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        
        // Store optimistic state for cache
        optimisticSolves = updated
        return updated
      })
      
      // Update cache immediately with optimistic values
      solvesCache = optimisticSolves
      cacheTimestamp = Date.now()
      
      // Save to server in background (don't await - fire and forget)
      toggleProblemStatusServer(problemId).catch((error: any) => {
        console.error('Error saving problem status to server:', error)
        // On error, revert optimistic update by reloading data
        loadData()
      })
      
      return newStatus
    } catch (error: any) {
      console.error('Error toggling problem status:', error)
      // On error, revert optimistic update by reloading data
      loadData()
      return false
    }
  }, [solves, supabase.auth, loadData])

  // Start problem
  // Only one problem can be in progress at a time.
  // If another problem is in progress, it will be reset to "start" state.
  const startProblem = useCallback(async (problemId: string): Promise<boolean> => {
    try {
      if (isAuthenticated) {
        const startTime = new Date().toISOString()
        
        // Optimistically update UI immediately - clear other in-progress problems first
        let optimisticSolves: Record<string, UserSolve> = {}
        setSolves(prev => {
          const updated = { ...prev }
          const now = Date.now()
          
          // Clear started_at for all other in-progress problems and save their time
          for (const [id, solve] of Object.entries(updated)) {
            if (id !== problemId && solve.started_at && !solve.solved) {
              // Calculate elapsed time and add to total_time_worked
              const startTime = new Date(solve.started_at).getTime()
              const elapsed = Math.floor((now - startTime) / 1000)
              const currentTimeWorked = solve.total_time_worked || 0
              const newTimeWorked = currentTimeWorked + elapsed
              
              updated[id] = {
                ...solve,
                started_at: undefined,
                total_time_worked: newTimeWorked, // Preserve accumulated time
              }
            }
          }
          
          // Now start the new problem, preserving existing time data
          if (updated[problemId]) {
            // Calculate adjusted start time to account for previous time worked
            // If there's previous time, set started_at to that many seconds ago
            // so elapsed time calculation will continue from previous time
            const previousTimeWorked = updated[problemId].total_time_worked ?? 0
            const adjustedStartTime = new Date(now - previousTimeWorked * 1000).toISOString()
            
            updated[problemId] = {
              ...updated[problemId],
              started_at: adjustedStartTime, // Adjusted to account for previous time
              // Preserve existing total_time_worked and focus_time
              total_time_worked: previousTimeWorked,
              focus_time: updated[problemId].focus_time ?? 0,
            }
          } else {
            updated[problemId] = {
              id: '',
              user_id: '',
              problem_id: problemId,
              solved: false,
              started_at: startTime,
              total_time_worked: 0,
              focus_time: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
          
          // Store optimistic state for cache
          optimisticSolves = updated
          return updated
        })
        
        // Update cache immediately with optimistic values
        solvesCache = optimisticSolves
        cacheTimestamp = Date.now()
        
        // Save to server in background (don't await - fire and forget)
        startProblemServer(problemId).catch((error) => {
          console.error('Error saving start problem to server:', error)
          // On error, revert optimistic update by reloading data
          loadData()
        })
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error starting problem:', error)
      // On error, revert optimistic update by reloading data
      loadData()
      return false
    }
  }, [isAuthenticated, loadData])

  // Update time worked
  const updateTimeWorked = useCallback(async (problemId: string, additionalSeconds: number): Promise<boolean> => {
    try {
      if (isAuthenticated) {
        // Optimistically update UI immediately
        let optimisticSolves: Record<string, UserSolve> = {}
        setSolves(prev => {
          const updated = { ...prev }
          if (updated[problemId]) {
            updated[problemId] = {
              ...updated[problemId],
              total_time_worked: (updated[problemId].total_time_worked || 0) + additionalSeconds,
            }
          }
          
          // Store optimistic state for cache
          optimisticSolves = updated
          return updated
        })
        // Update cache immediately with optimistic values
        solvesCache = optimisticSolves
        cacheTimestamp = Date.now()
        
        // Save to server in background (don't await - fire and forget)
        updateTimeWorkedServer(problemId, additionalSeconds).catch((error) => {
          console.error('Error saving time worked to server:', error)
          // On error, revert optimistic update by reloading data
          loadData()
        })
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating time worked:', error)
      // On error, revert optimistic update by reloading data
      loadData()
      return false
    }
  }, [isAuthenticated, loadData])

  // Update focus time
  const updateFocusTime = useCallback(async (problemId: string, additionalSeconds: number): Promise<boolean> => {
    try {
      if (isAuthenticated) {
        // Optimistically update UI immediately
        let optimisticSolves: Record<string, UserSolve> = {}
        setSolves(prev => {
          const updated = { ...prev }
          if (updated[problemId]) {
            updated[problemId] = {
              ...updated[problemId],
              focus_time: (updated[problemId].focus_time || 0) + additionalSeconds,
            }
          }
          
          // Store optimistic state for cache
          optimisticSolves = updated
          return updated
        })
        // Update cache immediately with optimistic values
        solvesCache = optimisticSolves
        cacheTimestamp = Date.now()
        
        // Save to server in background (don't await - fire and forget)
        updateFocusTimeServer(problemId, additionalSeconds).catch((error) => {
          console.error('Error saving focus time to server:', error)
          // On error, revert optimistic update by reloading data
          loadData()
        })
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating focus time:', error)
      // On error, revert optimistic update by reloading data
      loadData()
      return false
    }
  }, [isAuthenticated, loadData])

  // Update note
  const updateNote = useCallback(async (problemId: string, note: string): Promise<boolean> => {
    try {
      if (isAuthenticated) {
        // Optimistically update UI immediately
        let optimisticSolves: Record<string, UserSolve> = {}
        setSolves(prev => {
          const updated = { ...prev }
          if (updated[problemId]) {
            updated[problemId] = { ...updated[problemId], note }
          } else {
            updated[problemId] = {
              id: '',
              user_id: '',
              problem_id: problemId,
              solved: false,
              note,
              total_time_worked: 0,
              focus_time: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
          
          // Store optimistic state for cache
          optimisticSolves = updated
          return updated
        })
        // Update cache immediately with optimistic values
        solvesCache = optimisticSolves
        cacheTimestamp = Date.now()
        
        // Save to server in background (don't await - fire and forget)
        updateProblemNoteServer(problemId, note).catch((error) => {
          console.error('Error saving note to server:', error)
          // On error, revert optimistic update by reloading data
          loadData()
        })
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating note:', error)
      // On error, revert optimistic update by reloading data
      loadData()
      return false
    }
  }, [isAuthenticated, loadData])

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

  return {
    problems,
    solves,
    solveCounts,
    loading,
    isAuthenticated,
    getProblemStatus,
    getUserSolve,
    setProblemStatus,
    toggleProblemStatus,
    startProblem,
    updateTimeWorked,
    updateFocusTime,
    updateNote,
    triggerLogin,
    refreshData: loadData,
  }
}
