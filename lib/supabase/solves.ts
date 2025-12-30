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
  solved_at?: string
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

    const now = new Date().toISOString()
    const updateData: any = {
      user_id: user.id,
      problem_id: problemId,
      solved,
      updated_at: now,
    }

    if (solved) {
      // When marking as solved, set solved_at if not already set
      updateData.solved_at = now
    } else {
      // When marking as not solved (in progress), clear solved_at and set started_at
      updateData.solved_at = null
      updateData.started_at = now
    }

    const { error } = await supabase
      .from('user_solves')
      .upsert(updateData, {
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
 * New state machine:
 * - From "not started" -> "in progress" (when starting)
 * - From "in progress" -> "solved" (when marking solved)
 * - From "solved" -> "in progress" (when clicking solved again)
 * Multiple problems can be in progress at once.
 * State changes of one problem don't affect others.
 */
export async function toggleProblemStatus(problemId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get current status
    const { data: existing } = await supabase
      .from('user_solves')
      .select('solved, started_at, solved_at')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    const isCurrentlySolved = existing?.solved ?? false
    const now = new Date().toISOString()
    
    let updateData: any = {
      user_id: user.id,
      problem_id: problemId,
      updated_at: now,
    }

    if (isCurrentlySolved) {
      // Currently solved -> change to in progress
      // Clear solved_at, set started_at to now, set solved to false
      updateData.solved = false
      updateData.solved_at = null
      updateData.started_at = now
    } else {
      // Currently in progress -> change to solved
      // Set solved_at to now, keep started_at, set solved to true
      updateData.solved = true
      updateData.solved_at = now
      // Keep started_at as is (don't clear it)
    }

    const { error } = await supabase
      .from('user_solves')
      .upsert(updateData, {
        onConflict: 'user_id,problem_id'
      })

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('user_solves') || error.message?.includes('table')) {
        console.warn('Database table not found.')
        return !isCurrentlySolved
      }
      console.error('Error toggling problem status:', error)
      return !isCurrentlySolved
    }

    revalidatePath('/gamam-150')
    return !isCurrentlySolved
  } catch (error: any) {
    console.error('Error in toggleProblemStatus:', error)
    return false
  }
}

/**
 * Start working on a problem
 * Multiple problems can be in progress at once.
 * State changes of one problem don't affect others.
 */
export async function startProblem(problemId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get existing solve data to preserve focus_time
    const { data: existingSolve } = await supabase
      .from('user_solves')
      .select('focus_time, solved_at')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .single()

    const now = new Date().toISOString()

    // Start the problem: set started_at to now, clear solved_at, set solved to false
    const { error } = await supabase
      .from('user_solves')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        solved: false,
        started_at: now,
        solved_at: null, // Clear solved_at when starting
        focus_time: existingSolve?.focus_time ?? 0, // Preserve existing focus time
        updated_at: now,
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

/**
 * Start a module for the current user
 * @param moduleType - The module type (e.g., 'Coding', 'System Design', 'all' for GAMAM 150)
 */
export async function startModule(moduleType: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('user_module_starts')
      .upsert({
        user_id: user.id,
        module_type: moduleType,
        started_at: now,
        updated_at: now,
      }, {
        onConflict: 'user_id,module_type'
      })

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('user_module_starts')) {
        console.warn('user_module_starts table not found. Please run the migration.')
        return false
      }
      console.error('Error starting module:', error)
      return false
    }

    revalidatePath('/gamam-150')
    revalidatePath('/coding')
    revalidatePath('/system-design')
    revalidatePath('/object-oriented-design')
    revalidatePath('/schema-design')
    revalidatePath('/api-design')
    revalidatePath('/behavioral')
    return true
  } catch (error: any) {
    console.error('Error in startModule:', error)
    return false
  }
}

/**
 * Check if a module has been started by the current user
 * @param moduleType - The module type (e.g., 'Coding', 'System Design', 'all' for GAMAM 150)
 */
export async function isModuleStarted(moduleType: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('user_module_starts')
      .select('id')
      .eq('user_id', user.id)
      .eq('module_type', moduleType)
      .single()

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('user_module_starts')) {
        // Table doesn't exist yet, return false
        return false
      }
      if (error.code === 'PGRST116') {
        // No rows returned, module not started
        return false
      }
      console.error('Error checking module start:', error)
      return false
    }

    return !!data
  } catch (error: any) {
    console.error('Error in isModuleStarted:', error)
    return false
  }
}

/**
 * Get all module starts for the current user
 */
export async function getUserModuleStarts(): Promise<Record<string, boolean>> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {}
    }

    const { data, error } = await supabase
      .from('user_module_starts')
      .select('module_type')
      .eq('user_id', user.id)

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('user_module_starts')) {
        // Table doesn't exist yet, return empty
        return {}
      }
      console.error('Error fetching module starts:', error)
      return {}
    }

    const startsMap: Record<string, boolean> = {}
    data?.forEach((row) => {
      startsMap[row.module_type] = true
    })

    return startsMap
  } catch (error: any) {
    console.error('Error in getUserModuleStarts:', error)
    return {}
  }
}
