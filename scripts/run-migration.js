#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script runs the database migration using a direct Postgres connection.
 * 
 * Usage:
 *   npm run migrate
 * 
 * Requirements (choose one):
 *   Option 1: DATABASE_URL in .env.local (Postgres connection string)
 *   Option 2: SUPABASE_DB_PASSWORD in .env.local (password only, we'll construct the URL)
 * 
 * Get connection info from: Supabase Dashboard > Settings > Database > Connection string
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

async function runMigration() {
  // Load environment variables from .env.local
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

  // Also load from .env if it exists
  try {
    require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  } catch (e) {
    // .env doesn't exist, that's okay
  }

  // IMPORTANT: DATABASE_URL should NOT have NEXT_PUBLIC_ prefix
  // It contains sensitive credentials and should only be used server-side
  // NEXT_PUBLIC_ variables are exposed to the browser, which would be a security risk
  let databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  // If DATABASE_URL is not set, try to construct it from Supabase URL and password
  if (!databaseUrl) {
    // NEXT_PUBLIC_SUPABASE_URL is safe to use (it's public, no credentials)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    // SUPABASE_DB_PASSWORD should NOT have NEXT_PUBLIC_ prefix (sensitive)
    const dbPassword = process.env.SUPABASE_DB_PASSWORD

    if (supabaseUrl && dbPassword) {
      // Extract project ref from Supabase URL
      // URL format: https://[project-ref].supabase.co
      const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)
      if (urlMatch) {
        const projectRef = urlMatch[1]
        // Try pooler connection first (transaction mode, port 6543)
        // If that fails, user can use direct connection (port 5432)
        databaseUrl = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
        console.log('ℹ️  Constructed DATABASE_URL from NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_PASSWORD')
        console.log('   Using pooler connection (transaction mode)')
      }
    }
  }

  // Validate and fix common connection string issues
  if (databaseUrl) {
    // Check if using old/invalid host format
    if (databaseUrl.includes('db.') && databaseUrl.includes('.supabase.co') && !databaseUrl.includes(':5432') && !databaseUrl.includes(':6543')) {
      console.error('⚠️  Warning: Your DATABASE_URL appears to use an old format.')
      console.error('   Supabase connection strings should include a port number.')
      console.error('   Please update your DATABASE_URL in .env.local with the correct format.')
      console.error('')
      console.error('   Get the correct connection string from:')
      console.error('   Supabase Dashboard > Settings > Database > Connection string > URI')
    }
    
    // Try to extract and validate host
    const hostMatch = databaseUrl.match(/@([^:]+):(\d+)/)
    if (hostMatch) {
      const host = hostMatch[1]
      const port = hostMatch[2]
      
      // Check for common invalid host formats
      if (host.startsWith('db.') && host.endsWith('.supabase.co')) {
        // This is the direct connection format - should work but might need region-specific host
        console.log(`ℹ️  Using direct connection: ${host}:${port}`)
      } else if (host.includes('pooler.supabase.com')) {
        console.log(`ℹ️  Using pooler connection: ${host}:${port}`)
      }
    }
  }

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL or connection info is not set in .env.local')
    console.error('')
    console.error('   You have two options:')
    console.error('')
    console.error('   Option 1: Add DATABASE_URL (recommended)')
    console.error('   1. Go to Supabase Dashboard > Settings > Database')
    console.error('   2. Under "Connection string", select "URI"')
    console.error('   3. Copy the connection string')
    console.error('   4. Add it to .env.local as (NO NEXT_PUBLIC_ prefix!):')
    console.error('      DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres')
    console.error('')
    console.error('   Option 2: Add SUPABASE_DB_PASSWORD (simpler)')
    console.error('   1. Go to Supabase Dashboard > Settings > Database')
    console.error('   2. Find your database password (or reset it if needed)')
    console.error('   3. Add it to .env.local as (NO NEXT_PUBLIC_ prefix!):')
    console.error('      SUPABASE_DB_PASSWORD=your-database-password')
    console.error('   (Make sure NEXT_PUBLIC_SUPABASE_URL is also set)')
    console.error('')
    console.error('   ⚠️  Security Note: Never use NEXT_PUBLIC_ prefix for database credentials!')
    console.error('      Variables with NEXT_PUBLIC_ are exposed to the browser.')
    console.error('')
    console.error('   Option 3: Run migration manually')
    console.error('   1. Go to Supabase Dashboard > SQL Editor')
    console.error('   2. Copy the contents of supabase/migrations/001_create_user_solves.sql')
    console.error('   3. Paste and run it')
    process.exit(1)
  }

  // Read migration file
  const migrationFileName = '001_initial_schema.sql'
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFileName)
  let migrationSQL

  try {
    migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
    console.log(`📄 Reading migration: ${migrationFileName}`)
  } catch (error) {
    console.error(`❌ Error: Could not read migration file at ${migrationPath}`)
    console.error(`   Available migrations:`)
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
    try {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
      files.forEach(f => console.error(`   - ${f}`))
    } catch (e) {
      // Ignore
    }
    process.exit(1)
  }

  const client = new Client({
    connectionString: databaseUrl,
  })

  try {
    console.log('🚀 Connecting to database...')
    // Mask password in URL for logging
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':***@')
    console.log(`   Connection: ${maskedUrl}`)
    
    await client.connect()
    console.log('✅ Connected successfully')
    console.log('')
    console.log('📝 Running migration...')

    // Execute the migration SQL
    // Split by semicolons and execute statements one by one for better error reporting
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        try {
          await client.query(statement + ';')
        } catch (stmtError) {
          // Some errors are okay (like "already exists" for IF NOT EXISTS)
          if (stmtError.message.includes('already exists') || 
              stmtError.message.includes('duplicate') ||
              stmtError.code === '42P07' || // duplicate_table
              stmtError.code === '42710') {  // duplicate_object
            console.log(`   ⚠️  Statement ${i + 1}: ${stmtError.message.split('\n')[0]}`)
            console.log('      (This is okay - object already exists)')
          } else {
            throw stmtError
          }
        }
      }
    }

    console.log('✅ Migration executed successfully!')
    console.log('')
    console.log('🎉 Migration complete! All tables have been created:')
    console.log('   - 150DayProblems (stores all problems)')
    console.log('   - user_solves (tracks user progress on problems)')
    console.log('   - user_module_starts (tracks when users start modules)')
    console.log('')
    console.log('   Next steps:')
    console.log('   1. Restart your dev server (npm run dev)')
    console.log('   2. Run: npm run upload-150day-problems (to populate problems)')
    console.log('   3. Try starting a module from the home page or category page')
    console.log('   4. Check Supabase Dashboard > Table Editor to see the data')

  } catch (error) {
    console.error('❌ Error running migration:')
    console.error('   ' + error.message)
    if (error.code) {
      console.error(`   Error code: ${error.code}`)
    }
    
    // Provide helpful error messages
    if (error.message.includes('password authentication failed') || error.code === '28P01') {
      console.error('')
      console.error('   💡 This looks like an authentication error.')
      console.error('   Check that your DATABASE_URL password is correct.')
    } else if (error.message.includes('getaddrinfo ENOTFOUND') || error.code === 'ENOTFOUND') {
      console.error('')
      console.error('   💡 This looks like a connection error - the hostname cannot be resolved.')
      console.error('')
      console.error('   Common causes:')
      console.error('   1. Your DATABASE_URL uses an incorrect or outdated host format')
      console.error('   2. The hostname in your connection string is wrong')
      console.error('')
      console.error('   Solution: Get the correct connection string from Supabase Dashboard:')
      console.error('   1. Go to Supabase Dashboard > Settings > Database')
      console.error('   2. Under "Connection string", select "URI"')
      console.error('   3. Copy the connection string (should look like one of these):')
      console.error('      - Pooler: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres')
      console.error('      - Direct: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres')
      console.error('   4. Replace your DATABASE_URL in .env.local with the correct string')
      console.error('')
      console.error('   Alternative: Use Supabase CLI instead:')
      console.error('   1. Install: npm install -g supabase')
      console.error('   2. Link: supabase link --project-ref [your-project-ref]')
      console.error('   3. Push: supabase db push')
    } else if (error.message.includes('already exists')) {
      console.error('')
      console.error('   Note: It looks like the table or some objects already exist.')
      console.error('   This is okay - the migration uses IF NOT EXISTS clauses.')
      console.error('   The migration may have partially completed.')
    }
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigration().catch((error) => {
  console.error('❌ Unexpected error:')
  console.error(error)
  process.exit(1)
})

