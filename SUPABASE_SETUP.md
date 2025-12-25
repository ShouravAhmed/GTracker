# Supabase Setup Guide for User Solves

This guide will help you set up the Supabase database to store user progress/solves.

## Prerequisites

- A Supabase project (create one at https://supabase.com)
- Your Supabase project URL and anon key (found in Project Settings > API)

## Database Setup

### Option 1: Using npm script (Recommended - Automated)

You have two ways to configure the connection:

**Method A: Full Connection String (Recommended)**
1. Get your Postgres connection string:
   - Go to Supabase Dashboard > Settings > Database
   - Under "Connection string", you'll see multiple options:
     - **Transaction mode (Pooler)**: Use port `6543` - recommended for serverless/migrations
     - **Session mode (Pooler)**: Use port `5432` - for long-lived connections
     - **Direct connection**: Use port `5432` - direct database connection
   - Select "URI" format
   - Copy the connection string

2. **Recommended format (Transaction mode pooler):**
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   
   Example:
   ```env
   DATABASE_URL=postgresql://postgres.abcdefghijklmnop:your-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

3. Add it to your `.env.local` file (replace `[PROJECT-REF]`, `[PASSWORD]`, and `[REGION]` with your actual values)
   
   ⚠️ **Important**: 
   - Do NOT use `NEXT_PUBLIC_DATABASE_URL` - it contains sensitive credentials and should never be exposed to the browser
   - Make sure the hostname format is correct (should include `.pooler.supabase.com` or `.supabase.co`)
   - Include the port number (`:6543` for pooler transaction mode, `:5432` for session mode or direct)

**Method B: Just the Password (Simpler)**
1. Get your database password:
   - Go to Supabase Dashboard > Settings > Database
   - Find your database password (or reset it if needed)

2. Add it to your `.env.local` file (make sure `NEXT_PUBLIC_SUPABASE_URL` is already set):
   ```env
   SUPABASE_DB_PASSWORD=your-database-password
   ```
   ⚠️ **Important**: Do NOT use `NEXT_PUBLIC_SUPABASE_DB_PASSWORD` - passwords should never be exposed to the browser.

3. Run the migration:
   ```bash
   npm run migrate
   ```

That's it! The migration will run automatically.

### Option 2: Using Supabase Dashboard (Manual)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/001_create_user_solves.sql`
5. Click **Run** to execute the migration

### Option 3: Using Supabase CLI (Recommended for CLI users)

The Supabase CLI is the official way to manage migrations. It handles connection automatically.

**Installation:**
```bash
# Install Supabase CLI globally
npm install -g supabase

# Or using Homebrew (macOS)
brew install supabase/tap/supabase
```

**Setup and Migration:**
```bash
# 1. Login to Supabase (first time only)
supabase login

# 2. Link your project (get project-ref from Supabase Dashboard URL)
# Project ref is the part after /project/ in your dashboard URL
supabase link --project-ref your-project-ref

# 3. Push migrations to your database
supabase db push
```

**Benefits of using Supabase CLI:**
- Automatically handles connection strings
- Tracks migration history
- Can generate TypeScript types from your schema
- Better error messages and validation

**Note:** If you use Supabase CLI, you don't need to set `DATABASE_URL` in `.env.local` - the CLI handles authentication automatically.

## What the Migration Creates

The migration creates:

1. **`user_solves` table** - Stores problem solve status for each user
   - `id` - Unique identifier (UUID)
   - `user_id` - References the authenticated user
   - `problem_name` - Name of the problem
   - `solved` - Boolean indicating if the problem is solved
   - `created_at` - Timestamp when the record was created
   - `updated_at` - Timestamp when the record was last updated

2. **Row Level Security (RLS) Policies** - Ensures users can only access their own solves
   - Users can view their own solves
   - Users can insert their own solves
   - Users can update their own solves
   - Users can delete their own solves

3. **Indexes** - For faster queries on `user_id` and `problem_name`

4. **Trigger** - Automatically updates `updated_at` timestamp on record updates

## Features

### Automatic localStorage Migration

When a user logs in for the first time, the app will automatically:
1. Check if they have any data in localStorage
2. If localStorage data exists and no Supabase data exists, migrate it to Supabase
3. This ensures existing users don't lose their progress

### Fallback to localStorage

If a user is not authenticated, the app will:
- Fall back to localStorage for storing solves
- Automatically switch to Supabase once they log in

### Real-time Sync

All solves are stored in Supabase, so users can:
- Access their progress from any device
- See their progress sync across all browsers
- Never lose their progress data

## Testing

After running the migration:

1. Make sure your `.env.local` has the correct Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Start your development server:
   ```bash
   npm run dev
   ```

3. Log in with Google OAuth
4. Try marking a problem as solved
5. Check your Supabase dashboard > Table Editor > `user_solves` to see the data

## Troubleshooting

### "getaddrinfo ENOTFOUND" or "hostname cannot be resolved"
This error means your `DATABASE_URL` has an incorrect hostname format.

**Solution:**
1. Go to Supabase Dashboard > Settings > Database
2. Under "Connection string", select "URI" format
3. Make sure you're using one of these formats:
   - **Pooler (Transaction)**: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - **Pooler (Session)**: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`
   - **Direct**: `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres`
4. Copy the exact connection string and update your `.env.local`
5. Make sure the hostname includes `.pooler.supabase.com` or `.supabase.co` (not just `.supabase.co` without port)

**Alternative:** Use Supabase CLI instead (see Option 3 above) - it handles connections automatically.

### "relation user_solves does not exist"
- Make sure you've run the migration SQL in your Supabase dashboard
- Check that you're connected to the correct Supabase project

### "new row violates row-level security policy"
- This usually means RLS policies aren't set up correctly
- Re-run the migration SQL to ensure policies are created

### Data not syncing
- Check browser console for errors
- Verify your Supabase credentials in `.env.local`
- Make sure you're logged in (check the Navbar)

## Next Steps

Once the database is set up:
- Users can log in and their progress will be saved to Supabase
- Progress will sync across all devices
- localStorage data will be automatically migrated on first login

