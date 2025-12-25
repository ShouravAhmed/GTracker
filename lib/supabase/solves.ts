'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'

export interface Problem {
  id: string
  name: string
  url: string
  difficulty?: string
  day?: number
  type: string
  created_at: string
}

export interface UserSolve {
  id: string
  user_id: string
  problem_id: string
  solved: boolean
  note?: string
  started_at?: string
  total_time_worked: number
  focus_time: number
  created_at: string
  updated_at: string
}

export interface ProblemWithSolve extends Problem {
  solve?: UserSolve
  solve_count?: number
}

/**
 * Get all problems from database
 */
export async function getAllProblems(): Promise<Problem[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('150DayProblems')
      .select('*')
      .order('day', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('150DayProblems')) {
        console.warn('150DayProblems table not found. Please run the migration and upload problems.')
        return []
      }
      console.error('Error fetching problems:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getAllProblems:', error)
    return []
  }
}

/**
 * Get solve counts for all problems
 */
export async function getProblemSolveCounts(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('problem_solve_counts')
      .select('problem_id, solve_count')

    if (error) {
      console.error('Error fetching solve counts:', error)
      return {}
    }

    const countsMap: Record<string, number> = {}
    data?.forEach((row) => {
      countsMap[row.problem_id] = row.solve_count || 0
    })

    return countsMap
  } catch (error) {
    console.error('Error in getProblemSolveCounts:', error)
    return {}
  }
}

/**
 * Get all solves for the current user
 */
export async function getUserSolves(): Promise<Record<string, UserSolve>> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {}
    }

    const { data, error } = await supabase
      .from('user_solves')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('user_solves')) {
        console.warn('Database table not found. Please run the migration SQL in Supabase dashboard.')
        return {}
      }
      console.error('Error fetching user solves:', error)
      return {}
    }

    // Convert array to object keyed by problem_id
    const solvesMap: Record<string, UserSolve> = {}
    data?.forEach((solve) => {
      solvesMap[solve.problem_id] = solve
    })

    return solvesMap
  } catch (error) {
    console.error('Error in getUserSolves:', error)
    return {}
  }
}

/**
 * Get solve status for a specific problem by problem_id
 */
export async function getProblemStatus(problemId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('user_solves')
      .select('solved')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return false
      }
      if (error.code === 'PGRST205' || error.message?.includes('user_solves')) {
        console.warn('Database table not found.')
        return false
      }
      console.error('Error fetching problem status:', error)
      return false
    }

    return data?.solved ?? false
  } catch (error) {
    console.error('Error in getProblemStatus:', error)
    return false
  }
}

/**
 * Set solve status for a problem (upsert)
 */
export async function setProblemStatus(
  problemId: string,
  solved: boolean
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('user_solves')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        solved,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,problem_id'
      })

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('user_solves') || error.message?.includes('table')) {
        console.warn('Database table not found.')
        return solved
      }
      console.error('Error setting problem status:', error)
      return solved
    }

    revalidatePath('/gamam-150')
    return solved
  } catch (error: any) {
    console.error('Error in setProblemStatus:', error)
    return solved
  }
}

/**
 * Toggle solve status for a problem
 * When marking a problem as solved, all other in-progress problems will be reset to "start" state.
 */
export async function toggleProblemStatus(problemId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // First, get current status
    const { data: existing } = await supabase
      .from('user_solves')
      .select('solved')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    const newStatus = existing ? !existing.solved : true

    // If marking as solved, clear all other in-progress problems
    if (newStatus) {
      const { data: inProgressProblems, error: findError } = await supabase
        .from('user_solves')
        .select('problem_id')
        .eq('user_id', user.id)
        .not('started_at', 'is', null)
        .eq('solved', false)
        .neq('problem_id', problemId)

      if (findError) {
        console.error('Error finding in-progress problems:', findError)
      } else if (inProgressProblems && inProgressProblems.length > 0) {
        // Clear started_at for all other in-progress problems
        const problemIdsToClear = inProgressProblems.map(p => p.problem_id)
        const { error: clearError } = await supabase
          .from('user_solves')
          .update({ started_at: null, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .in('problem_id', problemIdsToClear)

        if (clearError) {
          console.error('Error clearing in-progress problems:', clearError)
        }
      }
    }

    // Upsert with new status
    const { error } = await supabase
      .from('user_solves')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        solved: newStatus,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,problem_id'
      })

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('user_solves') || error.message?.includes('table')) {
        console.warn('Database table not found.')
        return newStatus
      }
      console.error('Error toggling problem status:', error)
      return newStatus
    }

    revalidatePath('/gamam-150')
    return newStatus
  } catch (error: any) {
    console.error('Error in toggleProblemStatus:', error)
    return false
  }
}

/**
 * Start working on a problem
 * Only one problem can be in progress at a time.
 * If another problem is in progress, it will be reset to "start" state.
 */
export async function startProblem(problemId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // First, find and clear any other in-progress problems
    // We need to save their current time worked before clearing started_at
    const { data: inProgressProblems, error: findError } = await supabase
      .from('user_solves')
      .select('problem_id, started_at, total_time_worked')
      .eq('user_id', user.id)
      .not('started_at', 'is', null)
      .eq('solved', false)
      .neq('problem_id', problemId)

    if (findError) {
      console.error('Error finding in-progress problems:', findError)
    } else if (inProgressProblems && inProgressProblems.length > 0) {
      // For each in-progress problem, calculate and save the accumulated time
      const now = Date.now()
      for (const problem of inProgressProblems) {
        if (problem.started_at) {
          const startTime = new Date(problem.started_at).getTime()
          const elapsed = Math.floor((now - startTime) / 1000)
          const currentTimeWorked = problem.total_time_worked || 0
          const newTimeWorked = currentTimeWorked + elapsed

          // Update with accumulated time and clear started_at
          const { error: updateError } = await supabase
            .from('user_solves')
            .update({
              total_time_worked: newTimeWorked,
              started_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .eq('problem_id', problem.problem_id)

          if (updateError) {
            console.error('Error updating time for problem:', problem.problem_id, updateError)
          }
        }
      }
    }

    // Get existing solve data to preserve total_time_worked and focus_time
    const { data: existingSolve } = await supabase
      .from('user_solves')
      .select('total_time_worked, focus_time')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    // Calculate started_at to account for previous time worked
    // If there's previous time, set started_at to that many seconds ago
    // so elapsed time calculation will continue from previous time
    const previousTimeWorked = existingSolve?.total_time_worked ?? 0
    const now = new Date()
    const adjustedStartTime = new Date(now.getTime() - previousTimeWorked * 1000)

    // Now start the new problem, preserving existing time data
    const { error } = await supabase
      .from('user_solves')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        solved: false, // Explicitly set to false when starting
        started_at: adjustedStartTime.toISOString(), // Adjusted to account for previous time
        total_time_worked: previousTimeWorked, // Preserve existing time
        focus_time: existingSolve?.focus_time ?? 0, // Preserve existing focus time
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,problem_id'
      })

    if (error) {
      console.error('Error starting problem:', error)
      return false
    }

    revalidatePath('/gamam-150')
    return true
  } catch (error: any) {
    console.error('Error in startProblem:', error)
    return false
  }
}

/**
 * Update total time worked on a problem
 */
export async function updateTimeWorked(
  problemId: string,
  additionalSeconds: number
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get current time worked
    const { data: existing } = await supabase
      .from('user_solves')
      .select('total_time_worked')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    const currentTime = existing?.total_time_worked || 0
    const newTime = currentTime + additionalSeconds

    const { error } = await supabase
      .from('user_solves')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        total_time_worked: newTime,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,problem_id'
      })

    if (error) {
      console.error('Error updating time worked:', error)
      return false
    }

    revalidatePath('/gamam-150')
    return true
  } catch (error: any) {
    console.error('Error in updateTimeWorked:', error)
    return false
  }
}

/**
 * Update focus time for a problem
 */
export async function updateFocusTime(
  problemId: string,
  additionalSeconds: number
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get current focus time
    const { data: existing } = await supabase
      .from('user_solves')
      .select('focus_time')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    const currentTime = existing?.focus_time || 0
    const newTime = currentTime + additionalSeconds

    const { error } = await supabase
      .from('user_solves')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        focus_time: newTime,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,problem_id'
      })

    if (error) {
      console.error('Error updating focus time:', error)
      return false
    }

    revalidatePath('/gamam-150')
    return true
  } catch (error: any) {
    console.error('Error in updateFocusTime:', error)
    return false
  }
}

/**
 * Update note for a problem
 */
export async function updateProblemNote(
  problemId: string,
  note: string
): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('user_solves')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        note,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,problem_id'
      })

    if (error) {
      console.error('Error updating note:', error)
      return false
    }

    revalidatePath('/gamam-150')
    return true
  } catch (error: any) {
    console.error('Error in updateProblemNote:', error)
    return false
  }
}
