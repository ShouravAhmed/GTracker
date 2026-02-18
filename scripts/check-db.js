#!/usr/bin/env node

/**
 * Check and log database state (150DayProblems, user_solves, etc.)
 *
 * Usage:
 *   npm run check-db
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

async function checkDb() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  } catch (e) {
    // .env doesn't exist, that's okay
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL must be set in .env.local')
    process.exit(1)
  }

  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  DB CHECK – GTracker Supabase')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')

  try {
    // ─── 150DayProblems ─────────────────────────────────────────────────
    const { count: problemsCount, error: problemsCountError } = await supabase
      .from('150DayProblems')
      .select('*', { count: 'exact', head: true })

    if (problemsCountError) {
      if (problemsCountError.code === 'PGRST116' || problemsCountError.message?.includes('relation') || problemsCountError.message?.includes('does not exist')) {
        console.log('❌ 150DayProblems: table does not exist. Run the migration first.')
      } else {
        console.log('❌ 150DayProblems:', problemsCountError.message)
      }
    } else {
      console.log('📦 150DayProblems')
      console.log('   Total rows:', problemsCount ?? 0)

      if ((problemsCount ?? 0) > 0) {
        const { data: byType, error: byTypeError } = await supabase
          .from('150DayProblems')
          .select('type')
        if (!byTypeError && byType?.length) {
          const typeCounts = byType.reduce((acc, row) => {
            acc[row.type] = (acc[row.type] || 0) + 1
            return acc
          }, {})
          console.log('   By type:', typeCounts)
        }

        const { data: sample, error: sampleError } = await supabase
          .from('150DayProblems')
          .select('id, name, type, day, difficulty')
          .order('day', { ascending: true, nullsFirst: false })
          .limit(3)
        if (!sampleError && sample?.length) {
          console.log('   Sample (first 3 by day):')
          sample.forEach((row) => console.log('     -', row.name, '|', row.type, '| day', row.day))
        }
      }
    }
    console.log('')

    // ─── user_solves ───────────────────────────────────────────────────
    const { count: solvesCount, error: solvesCountError } = await supabase
      .from('user_solves')
      .select('*', { count: 'exact', head: true })

    if (solvesCountError) {
      if (solvesCountError.code === 'PGRST116' || solvesCountError.message?.includes('relation')) {
        console.log('❌ user_solves: table does not exist.')
      } else {
        console.log('❌ user_solves:', solvesCountError.message)
      }
    } else {
      console.log('📋 user_solves')
      console.log('   Total rows:', solvesCount ?? 0)
    }
    console.log('')

    // ─── user_module_starts ─────────────────────────────────────────────
    const { count: moduleStartsCount, error: moduleStartsError } = await supabase
      .from('user_module_starts')
      .select('*', { count: 'exact', head: true })

    if (moduleStartsError) {
      if (moduleStartsError.code === 'PGRST116' || moduleStartsError.message?.includes('relation')) {
        console.log('❌ user_module_starts: table does not exist.')
      } else {
        console.log('❌ user_module_starts:', moduleStartsError.message)
      }
    } else {
      console.log('📅 user_module_starts')
      console.log('   Total rows:', moduleStartsCount ?? 0)
    }
    console.log('')

    // ─── problem_solve_counts (view) ───────────────────────────────────
    const { data: countsData, error: countsError } = await supabase
      .from('problem_solve_counts')
      .select('problem_id, solve_count')

    if (countsError) {
      if (countsError.code === 'PGRST116' || countsError.message?.includes('relation')) {
        console.log('❌ problem_solve_counts: view does not exist.')
      } else {
        console.log('❌ problem_solve_counts:', countsError.message)
      }
    } else {
      const totalSolves = (countsData || []).reduce((sum, row) => sum + (row.solve_count || 0), 0)
      console.log('📊 problem_solve_counts (view)')
      console.log('   Rows:', (countsData || []).length)
      console.log('   Sum of solve_count:', totalSolves)
    }
    console.log('')
    console.log('═══════════════════════════════════════════════════════════')
    console.log('')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

checkDb()
