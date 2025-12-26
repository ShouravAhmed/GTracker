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
        
        // Merge server data with current state to preserve in-progress problems
        // This prevents losing in-progress state when tab becomes active again
        setSolves(prevSolves => {
          const merged: Record<string, UserSolve> = { ...userSolves }
          
          // Preserve local in-progress state if it exists and server doesn't have it or has stale data
          for (const [problemId, localSolve] of Object.entries(prevSolves)) {
            const serverSolve = userSolves[problemId]
            const isLocalInProgress = localSolve.started_at && !localSolve.solved
            
            if (isLocalInProgress) {
              // If local has in-progress state, check if server has it too
              if (!serverSolve || !serverSolve.started_at || serverSolve.solved) {
                // Server doesn't have in-progress state, preserve local state
                merged[problemId] = localSolve
              } else {
                // Server has in-progress state, use server's started_at but keep local state
                // This handles the case where server save completed
                merged[problemId] = {
                  ...localSolve,
                  started_at: serverSolve.started_at,
                  // Keep other local state like focus_time if it's more recent
                  focus_time: Math.max(localSolve.focus_time || 0, serverSolve.focus_time || 0),
                }
              }
            }
          }
          
          // Update cache with merged data
          solvesCache = merged
          return merged
        })
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
  // New state machine:
  // - From "in progress" -> "solved" (when marking solved)
  // - From "solved" -> "in progress" (when clicking solved again)
  // Multiple problems can be in progress at once.
  // State changes of one problem don't affect others.
  const toggleProblemStatus = useCallback(async (problemId: string): Promise<boolean | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    try {
      const currentSolve = solves[problemId]
      const isCurrentlySolved = currentSolve?.solved ?? false
      const now = new Date().toISOString()

      // Optimistically update UI immediately
      let optimisticSolves: Record<string, UserSolve> = {}
      setSolves(prev => {
        const updated = { ...prev }
        
        // Update the current problem's status
        if (updated[problemId]) {
          if (isCurrentlySolved) {
            // Currently solved -> change to in progress
            // Clear solved_at, set started_at to now, set solved to false
            updated[problemId] = {
              ...updated[problemId],
              solved: false,
              solved_at: undefined,
              started_at: now,
            }
          } else {
            // Currently in progress -> change to solved
            // Set solved_at to now, keep started_at, set solved to true
            updated[problemId] = {
              ...updated[problemId],
              solved: true,
              solved_at: now,
              // Keep started_at as is
            }
          }
        } else {
          // Create new solve entry (shouldn't happen, but handle it)
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
      
      return !isCurrentlySolved
    } catch (error: any) {
      console.error('Error toggling problem status:', error)
      // On error, revert optimistic update by reloading data
      loadData()
      return false
    }
  }, [solves, supabase.auth, loadData])

  // Start problem
  // Multiple problems can be in progress at once.
  // State changes of one problem don't affect others.
  const startProblem = useCallback(async (problemId: string): Promise<boolean> => {
    try {
      if (isAuthenticated) {
        const startTime = new Date().toISOString()
        
        // Optimistically update UI immediately
        let optimisticSolves: Record<string, UserSolve> = {}
        setSolves(prev => {
          const updated = { ...prev }
          
          // Start the new problem: set started_at to now, clear solved_at, set solved to false
          if (updated[problemId]) {
            updated[problemId] = {
              ...updated[problemId],
              solved: false,
              started_at: startTime,
              solved_at: undefined, // Clear solved_at when starting
              // Preserve existing focus_time
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
    updateFocusTime,
    updateNote,
    triggerLogin,
    refreshData: loadData,
  }
}
