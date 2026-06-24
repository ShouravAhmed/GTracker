#!/usr/bin/env node

/**
 * Reset all users' module enrollment and practice progress (global wipe).
 *
 * What this does when executed with --execute:
 *   1. DELETE every row from `user_module_starts`
 *      → Unenrolls all users from every module (GAMAM 150 "all", Coding, System Design, etc.)
 *      → Removes module start timestamps and stored `current_day` (day position).
 *   2. DELETE every row from `user_solves`
 *      → Clears solved / in-progress flags, per-problem notes, focus_time (seconds),
 *        started_at, solved_at for all users.
 *      → "Days completed" and day-level stats in the app are derived from these rows,
 *        so they return to zero once rows are gone.
 *
 * What is NOT changed:
 *   - `150DayProblems` (problem catalog)
 *   - `auth.users` (accounts / logins)
 *   - Any other tables
 *
 * Requirements (same as upload scripts):
 *   NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   node scripts/reset-all-user-progress.js           # dry run: print counts only
 *   node scripts/reset-all-user-progress.js --execute # perform the deletes
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

const ZERO_UUID = '00000000-0000-0000-0000-000000000000'

async function countRows(supabase, table) {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    throw new Error(`${table}: ${error.message}`)
  }
  return count ?? 0
}

async function deleteAllRows(supabase, table) {
  const { error } = await supabase.from(table).delete().neq('id', ZERO_UUID)
  if (error) {
    throw new Error(`${table} delete: ${error.message}`)
  }
}

async function main() {
  const execute = process.argv.includes('--execute')

  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  } catch {
    // optional
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL must be set in .env.local')
    process.exit(1)
  }
  if (!serviceRoleKey) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log('')
  console.log('=== Reset all user progress ===')
  console.log('')
  console.log('Planned changes:')
  console.log('  - user_module_starts: DELETE all rows (unenroll every user from every module)')
  console.log('  - user_solves:        DELETE all rows (notes, solves, times, focus_time)')
  console.log('')
  console.log('Not modified: 150DayProblems, auth users, problem_solve_counts (view updates from data).')
  console.log('')

  let moduleStartsCount
  let solvesCount
  try {
    moduleStartsCount = await countRows(supabase, 'user_module_starts')
    solvesCount = await countRows(supabase, 'user_solves')
  } catch (e) {
    console.error(String(e.message || e))
    process.exit(1)
  }

  console.log('Current row counts:')
  console.log(`  user_module_starts: ${moduleStartsCount}`)
  console.log(`  user_solves:        ${solvesCount}`)
  console.log('')

  if (!execute) {
    console.log('Dry run only — no changes were made.')
    console.log('To apply, run: node scripts/reset-all-user-progress.js --execute')
    console.log('')
    process.exit(0)
  }

  console.log('Executing deletes...')
  try {
    await deleteAllRows(supabase, 'user_module_starts')
    await deleteAllRows(supabase, 'user_solves')
  } catch (e) {
    console.error(String(e.message || e))
    process.exit(1)
  }

  const afterModule = await countRows(supabase, 'user_module_starts')
  const afterSolves = await countRows(supabase, 'user_solves')
  console.log('')
  console.log('Done. Row counts after reset:')
  console.log(`  user_module_starts: ${afterModule}`)
  console.log(`  user_solves:        ${afterSolves}`)
  console.log('')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
