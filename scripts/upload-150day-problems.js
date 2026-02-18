#!/usr/bin/env node

/**
 * Upload 150 Day Problems Script
 * 
 * This script uploads all 150 Day problems from gamam150.json to the database using Supabase client.
 * It ensures no duplicate problems are added under the same type and handles conflicts gracefully.
 * 
 * Usage:
 *   npm run upload-150day-problems
 * 
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   SUPABASE_SERVICE_ROLE_KEY in .env.local (for admin access to insert problems)
 * 
 * Note: Service role key bypasses RLS. Get it from:
 *   Supabase Dashboard > Settings > API > service_role key (secret)
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function uploadProblems() {
  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  } catch (e) {
    // .env doesn't exist, that's okay
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL must be set in .env.local')
    console.error('')
    console.error('Get it from: Supabase Dashboard > Settings > API > Project URL')
    process.exit(1)
  }

  if (!serviceRoleKey) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
    console.error('')
    console.error('Get it from: Supabase Dashboard > Settings > API > service_role key (secret)')
    console.error('')
    console.error('⚠️  Important: This is a secret key - never commit it to git!')
    console.error('   It bypasses Row Level Security, so only use it in server-side scripts.')
    process.exit(1)
  }

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  try {
    console.log('✅ Connected to Supabase')
    console.log('')

    // Read the JSON file (standard location: project data folder)
    const jsonPath = path.join(__dirname, '..', 'data', 'gamam150.json')
    if (!fs.existsSync(jsonPath)) {
      console.error(`❌ Error: JSON file not found at ${jsonPath}`)
      process.exit(1)
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    console.log('✅ Loaded JSON file')
    console.log('')

    // Prepare all problems
    const problems = []
    const categories = ['Coding', 'SystemDesign', 'ObjectOrientedDesign', 'SchemaDesign', 'APIDesign', 'Behavioral']
    
    for (const category of categories) {
      if (!jsonData[category]) continue
      
      const categoryType = category === 'SystemDesign' ? 'System Design' :
                          category === 'ObjectOrientedDesign' ? 'Object Oriented Design' :
                          category === 'SchemaDesign' ? 'Schema Design' :
                          category === 'APIDesign' ? 'API Design' :
                          category

      for (const problem of jsonData[category]) {
        if (!problem.name || !problem.url) continue
        
        problems.push({
          name: problem.name,
          url: problem.url,
          difficulty: problem.difficulty || null,
          day: problem.day !== undefined ? problem.day : null,
          type: categoryType,
        })
      }
    }

    // Deduplicate problems within the same type (keep first occurrence)
    const seenProblems = new Map()
    const deduplicatedProblems = []
    const duplicatesInAsset = []

    for (const problem of problems) {
      const key = `${problem.name}|${problem.url}|${problem.type}`
      if (seenProblems.has(key)) {
        duplicatesInAsset.push(problem)
      } else {
        seenProblems.set(key, true)
        deduplicatedProblems.push(problem)
      }
    }

    console.log(`📦 Found ${problems.length} problems in asset`)
    if (duplicatesInAsset.length > 0) {
      console.log(`   ⚠️  Removed ${duplicatesInAsset.length} duplicate(s) from asset (same name, url, type)`)
    }
    console.log(`   ✅ ${deduplicatedProblems.length} unique problems to process`)
    console.log('')

    // Check if problems already exist in database
    const { count: existingCount, error: countError } = await supabase
      .from('150DayProblems')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      if (countError.code === 'PGRST116' || countError.message?.includes('relation') || countError.message?.includes('does not exist')) {
        console.error('❌ Error: The 150DayProblems table does not exist.')
        console.error('')
        console.error('Please run the migration first:')
        console.error('  1. Go to Supabase Dashboard > SQL Editor')
        console.error('  2. Run the SQL from supabase/migrations/001_create_user_solves.sql')
        console.error('     (Or use: npm run migrate if you have DATABASE_URL set)')
        process.exit(1)
      }
      throw countError
    }

    console.log(`📊 Current database state:`)
    console.log(`   Total problems in remote database: ${existingCount || 0}`)
    console.log('')

    // Insert problems in batches (Supabase has a limit of 1000 rows per insert)
    // Use smaller batches to avoid "cannot affect row a second time" error
    const batchSize = 50
    let inserted = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < deduplicatedProblems.length; i += batchSize) {
      const batch = deduplicatedProblems.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(deduplicatedProblems.length / batchSize)

      console.log(`📤 Uploading batch ${batchNum}/${totalBatches} (${batch.length} problems)...`)

      // Further deduplicate within batch to avoid "cannot affect row a second time" error
      const batchDeduped = []
      const batchSeen = new Set()
      for (const problem of batch) {
        const key = `${problem.name}|${problem.url}|${problem.type}`
        if (!batchSeen.has(key)) {
          batchSeen.add(key)
          batchDeduped.push(problem)
        }
      }

      if (batchDeduped.length < batch.length) {
        console.log(`   ⚠️  Removed ${batch.length - batchDeduped.length} duplicate(s) from batch`)
      }

      // Insert one by one to handle conflicts gracefully
      for (const problem of batchDeduped) {
        try {
          const { data: singleData, error: singleError } = await supabase
            .from('150DayProblems')
            .upsert(problem, {
              onConflict: 'name,url,type',
              ignoreDuplicates: false,
            })
            .select()

          if (singleError) {
            if (singleError.code === '23505' || singleError.message?.includes('duplicate') || singleError.message?.includes('unique')) {
              // Unique constraint violation - duplicate in database
              skipped++
            } else {
              console.error(`   ❌ Error inserting "${problem.name}" (${problem.type}):`, singleError.message)
              errors++
            }
          } else if (singleData && singleData.length > 0) {
            inserted++
          } else {
            // No data returned - likely a duplicate
            skipped++
          }
        } catch (err) {
          console.error(`   ❌ Error inserting "${problem.name}" (${problem.type}):`, err.message)
          errors++
        }
      }
    }

    console.log('')

    // Get final count
    const { count: finalCount, error: totalError } = await supabase
      .from('150DayProblems')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      console.error('⚠️  Could not fetch final count:', totalError.message)
    }

    // Final report
    console.log('═══════════════════════════════════════════════════════════')
    console.log('📊 UPLOAD REPORT - 150 Day Problems')
    console.log('═══════════════════════════════════════════════════════════')
    console.log(`📦 Total problems in asset (JSON):     ${problems.length}`)
    if (duplicatesInAsset.length > 0) {
      console.log(`   └─ Duplicates removed from asset:    ${duplicatesInAsset.length}`)
    }
    console.log(`   └─ Unique problems processed:        ${deduplicatedProblems.length}`)
    console.log('')
    console.log(`💾 Remote database state:`)
    console.log(`   └─ Problems before upload:          ${existingCount || 0}`)
    console.log(`   └─ Problems after upload:             ${finalCount || existingCount || 0}`)
    console.log('')
    console.log(`📈 Upload results:`)
    console.log(`   └─ New problems added:               ${inserted}`)
    console.log(`   └─ Duplicates skipped (in DB):       ${skipped}`)
    if (errors > 0) {
      console.log(`   └─ Errors encountered:                ${errors}`)
    }
    console.log('')
    console.log(`✅ Upload complete!`)
    console.log('═══════════════════════════════════════════════════════════')

  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code === 'PGRST205' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
      console.error('')
      console.error('The 150DayProblems table does not exist. Please run the migration first.')
      console.error('  1. Go to Supabase Dashboard > SQL Editor')
      console.error('  2. Run the SQL from supabase/migrations/001_create_user_solves.sql')
    } else if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
      console.error('')
      console.error('Authentication failed. Check your SUPABASE_SERVICE_ROLE_KEY.')
      console.error('Get it from: Supabase Dashboard > Settings > API > service_role key (secret)')
    }
    process.exit(1)
  }
}

uploadProblems().catch(console.error)
