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

    const updateData: any = {
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
export type StartProblemResult = { ok: true } | { ok: false; reason: string }

export async function startProblem(problemId: string): Promise<StartProblemResult> {
  try {
    console.log('[startProblem] Server: starting for problemId', problemId)
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      const msg = `auth.getUser: ${authError.message}`
      console.error('[startProblem] Server:', msg)
      return { ok: false, reason: msg }
    }
    if (!user) {
      const msg = 'Not authenticated (no user from cookies)'
      console.warn('[startProblem] Server:', msg)
      return { ok: false, reason: msg }
    }
    console.log('[startProblem] Server: user id', user.id)

    const { data: existingSolve, error: fetchError } = await supabase
      .from('user_solves')
      .select('focus_time, solved_at')
      .eq('user_id', user.id)
      .eq('problem_id', problemId)
      .maybeSingle()

    if (fetchError) {
      const msg = `fetch existing solve: ${fetchError.message} (${fetchError.code ?? 'no code'})`
      console.error('[startProblem] Server:', msg)
      return { ok: false, reason: msg }
    }

    const now = new Date().toISOString()
    const focusTime = existingSolve?.focus_time ?? 0

    const { error } = await supabase
      .from('user_solves')
      .upsert({
        user_id: user.id,
        problem_id: problemId,
        solved: false,
        started_at: now,
        solved_at: null,
        focus_time: focusTime,
        updated_at: now,
      }, {
        onConflict: 'user_id,problem_id'
      })

    if (error) {
      const msg = `upsert: ${error.message} (${error.code ?? 'no code'})`
      console.error('[startProblem] Server:', msg)
      return { ok: false, reason: msg }
    }

    console.log('[startProblem] Server: success')
    try {
      revalidatePath('/gamam-150')
    } catch (revalidateErr: any) {
      console.warn('[startProblem] revalidatePath failed (non-fatal):', revalidateErr?.message ?? revalidateErr)
    }
    return { ok: true }
  } catch (error: any) {
    const msg = String(error?.message ?? error)
    console.error('[startProblem] Server: caught error', msg)
    return { ok: false, reason: msg }
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
        current_day: moduleType === 'all' ? 0 : undefined, // Set current_day to 0 for GAMAM 150
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

export interface ModuleProgress {
  currentDay: number
  completedDays: number
  overdueDays: number
  totalDays: number
  completedPercentage: number
  overduePercentage: number
  startedAt?: string
}

/**
 * Get progress for GAMAM 150 module (module_type = 'all')
 */
export async function getModuleProgress(): Promise<ModuleProgress | null> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    // Get module start info
    const { data: moduleStart, error: moduleError } = await supabase
      .from('user_module_starts')
      .select('started_at, current_day')
      .eq('user_id', user.id)
      .eq('module_type', 'all')
      .single()

    if (moduleError || !moduleStart) {
      return null
    }

    // Get all problems (including those without day assignment for Day 127-150)
    const { data: problems, error: problemsError } = await supabase
      .from('150DayProblems')
      .select('id, day')
      .order('day', { ascending: true, nullsFirst: false })

    if (problemsError || !problems) {
      return null
    }

    // Get user solves
    const { data: solves, error: solvesError } = await supabase
      .from('user_solves')
      .select('problem_id, solved')
      .eq('user_id', user.id)
      .eq('solved', true)

    if (solvesError) {
      return null
    }

    const solvedProblemIds = new Set(solves?.map(s => s.problem_id) || [])

    // Group problems by day and check completion
    const daysMap = new Map<number, { total: number; solved: number }>()
    let otherProblemsCount = 0
    let otherProblemsSolved = 0

    problems.forEach(problem => {
      if (problem.day === null || problem.day === undefined) {
        // Problems without day assignment belong to "Day 127-150"
        otherProblemsCount++
        if (solvedProblemIds.has(problem.id)) {
          otherProblemsSolved++
        }
      } else {
        const day = problem.day
        if (!daysMap.has(day)) {
          daysMap.set(day, { total: 0, solved: 0 })
        }
        const dayData = daysMap.get(day)!
        dayData.total++
        if (solvedProblemIds.has(problem.id)) {
          dayData.solved++
        }
      }
    })

    // Calculate completed days (all problems in day are solved)
    const completedDays = Array.from(daysMap.entries())
      .filter(([_, data]) => data.solved === data.total && data.total > 0)
      .map(([day]) => day)
      .sort((a, b) => a - b)

    // Check if "Day 127-150" is completed (all problems in that section are solved)
    const otherSectionCompleted = otherProblemsCount > 0 && otherProblemsSolved === otherProblemsCount

    // Count days with specific assignments + Day 127-150 section
    // Day 127-150 represents 24 days (days 127, 128, ..., 150)
    const daysWithSpecificDay = daysMap.size
    const day127To150Count = otherProblemsCount > 0 ? 24 : 0 // Day 127-150 represents 24 days
    const totalDays = 150 // Always 150 days total for GAMAM 150 challenge

    // If "Day 127-150" section is completed, add the remaining days to reach 150 total
    // This ensures we never exceed 150 completed days
    const completedFromSpecificDays = completedDays.length
    const remainingDaysFor150 = totalDays - daysWithSpecificDay
    const completedDaysCount = completedFromSpecificDays + (otherSectionCompleted ? remainingDaysFor150 : 0)

    // Calculate expected day based on start date
    // Day 0 should be completed by end of day 1, day 1 by end of day 2, etc.
    const startedAt = new Date(moduleStart.started_at)
    const now = new Date()
    const daysSinceStart = Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24))
    // Expected day is the day they should be working on (daysSinceStart)
    // Days 0 to (expectedDay - 1) should be completed
    const expectedDay = Math.min(daysSinceStart, totalDays - 1) // Can be up to totalDays - 1 (0-indexed, so max is 149)

    // Find current day (highest completed day + 1, or expected day if no progress)
    const highestCompletedDay = completedDays.length > 0
      ? Math.max(...completedDays)
      : -1

    // Check if we're in the Day 127-150 range
    const isInOtherSection = expectedDay >= 127 && expectedDay < 150

    const currentDay = Math.max(
      highestCompletedDay + 1,
      expectedDay,
      moduleStart.current_day !== null && moduleStart.current_day !== undefined ? moduleStart.current_day : 0
    )

    // Calculate overdue days (days that should be completed but aren't)
    // Days 0 to (expectedDay - 1) should be completed
    const overdueDays: number[] = []
    for (let day = 0; day < expectedDay && day < 127; day++) {
      if (!completedDays.includes(day)) {
        const dayData = daysMap.get(day)
        if (dayData && dayData.total > 0) {
          overdueDays.push(day)
        }
      }
    }

    // Check if Day 127-150 section is overdue (expected day is >= 127 but section not completed)
    if (expectedDay >= 127 && !otherSectionCompleted && otherProblemsCount > 0) {
      // Count overdue days in the 127-150 range
      // If expectedDay is 130, then days 127, 128, 129 are overdue
      for (let day = 127; day < expectedDay && day < 150; day++) {
        overdueDays.push(day)
      }
    }

    const overdueDaysCount = overdueDays.length

    // Calculate percentages
    const completedPercentage = totalDays > 0 ? Math.round((completedDaysCount / totalDays) * 100) : 0
    const overduePercentage = totalDays > 0 ? Math.round((overdueDaysCount / totalDays) * 100) : 0

    return {
      currentDay,
      completedDays: completedDaysCount,
      overdueDays: overdueDaysCount,
      totalDays,
      completedPercentage,
      overduePercentage,
      startedAt: moduleStart.started_at,
    }
  } catch (error: any) {
    console.error('Error in getModuleProgress:', error)
    return null
  }
}

/**
 * Get progress for a specific day
 */
export async function getDayProgress(day: number): Promise<{ completed: number; total: number; percentage: number } | null> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return null
    }

    // Get all problems for this day
    const { data: problems, error: problemsError } = await supabase
      .from('150DayProblems')
      .select('id')
      .eq('day', day)

    if (problemsError || !problems) {
      return null
    }

    const problemIds = problems.map(p => p.id)
    const total = problemIds.length

    if (total === 0) {
      return { completed: 0, total: 0, percentage: 0 }
    }

    // Get solved problems for this day
    const { data: solves, error: solvesError } = await supabase
      .from('user_solves')
      .select('problem_id')
      .eq('user_id', user.id)
      .eq('solved', true)
      .in('problem_id', problemIds)

    if (solvesError) {
      return null
    }

    const completed = solves?.length || 0
    const percentage = Math.round((completed / total) * 100)

    return { completed, total, percentage }
  } catch (error: any) {
    console.error('Error in getDayProgress:', error)
    return null
  }
}

/**
 * Update current day when a day is completed
 */
export async function updateCurrentDay(newDay: number): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return false
    }

    const { error } = await supabase
      .from('user_module_starts')
      .update({ current_day: newDay, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('module_type', 'all')

    if (error) {
      console.error('Error updating current day:', error)
      return false
    }

    revalidatePath('/gamam-150')
    return true
  } catch (error: any) {
    console.error('Error in updateCurrentDay:', error)
    return false
  }
}