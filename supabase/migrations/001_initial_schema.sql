-- ============================================================================
-- INITIAL SCHEMA MIGRATION
-- This migration creates all tables, views, functions, and policies from scratch
-- It will drop existing objects if they exist for a fresh start
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Starting fresh database migration...';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- CLEANUP: Drop all existing tables, views, functions, and constraints
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Cleaning up existing database objects...';
  RAISE NOTICE '============================================================================';
END $$;

-- Drop tables first (CASCADE will drop dependent triggers, policies, etc.)
DROP TABLE IF EXISTS user_module_starts CASCADE;
DROP TABLE IF EXISTS user_solves CASCADE;
DROP TABLE IF EXISTS "150DayProblems" CASCADE;

-- Drop views (if they exist independently)
DROP VIEW IF EXISTS problem_solve_counts;

-- Drop functions (if they exist independently)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop indexes if they exist independently
DROP INDEX IF EXISTS idx_150dayproblems_name;
DROP INDEX IF EXISTS idx_150dayproblems_type;
DROP INDEX IF EXISTS idx_150dayproblems_day;
DROP INDEX IF EXISTS idx_user_solves_user_id;
DROP INDEX IF EXISTS idx_user_solves_problem_id;
DROP INDEX IF EXISTS idx_user_solves_solved;
DROP INDEX IF EXISTS idx_user_module_starts_user_id;
DROP INDEX IF EXISTS idx_user_module_starts_module_type;
DROP INDEX IF EXISTS idx_user_module_starts_current_day;

DO $$
BEGIN
  RAISE NOTICE 'Cleanup completed successfully!';
  RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- CREATE TABLES: Create fresh tables with new structure
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Creating new tables and objects...';
  RAISE NOTICE '============================================================================';
END $$;

-- Create 150DayProblems table to store all 150 Day problems
DO $$
BEGIN
  RAISE NOTICE 'Creating table: 150DayProblems';
  CREATE TABLE "150DayProblems" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    difficulty TEXT,
    day INTEGER,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, url, type)
  );
  RAISE NOTICE 'Table 150DayProblems created successfully';
END $$;

-- Create indexes for 150DayProblems
DO $$
BEGIN
  RAISE NOTICE 'Creating indexes for 150DayProblems...';
  CREATE INDEX idx_150dayproblems_name ON "150DayProblems"(name);
  CREATE INDEX idx_150dayproblems_type ON "150DayProblems"(type);
  CREATE INDEX idx_150dayproblems_day ON "150DayProblems"(day);
  RAISE NOTICE 'Indexes for 150DayProblems created successfully';
END $$;

-- Create user_solves table to store problem solve status for each user
DO $$
BEGIN
  RAISE NOTICE 'Creating table: user_solves';
  CREATE TABLE user_solves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES "150DayProblems"(id) ON DELETE CASCADE,
    solved BOOLEAN NOT NULL DEFAULT true,
    note TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    solved_at TIMESTAMP WITH TIME ZONE,
    focus_time INTEGER NOT NULL DEFAULT 0, -- in seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, problem_id)
  );
  RAISE NOTICE 'Table user_solves created successfully';
END $$;

-- Create indexes for user_solves
DO $$
BEGIN
  RAISE NOTICE 'Creating indexes for user_solves...';
  CREATE INDEX idx_user_solves_user_id ON user_solves(user_id);
  CREATE INDEX idx_user_solves_problem_id ON user_solves(problem_id);
  CREATE INDEX idx_user_solves_solved ON user_solves(solved);
  RAISE NOTICE 'Indexes for user_solves created successfully';
END $$;

-- Create user_module_starts table to track module start status for each user
DO $$
BEGIN
  RAISE NOTICE 'Creating table: user_module_starts';
  CREATE TABLE user_module_starts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_type TEXT NOT NULL, -- e.g., 'Coding', 'System Design', 'all' for GAMAM 150
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_day INTEGER DEFAULT 0, -- Current day number (0-indexed) for GAMAM 150 module. Day 0 = first day after starting.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, module_type)
  );
  RAISE NOTICE 'Table user_module_starts created successfully';
END $$;

-- Create indexes for user_module_starts
DO $$
BEGIN
  RAISE NOTICE 'Creating indexes for user_module_starts...';
  CREATE INDEX idx_user_module_starts_user_id ON user_module_starts(user_id);
  CREATE INDEX idx_user_module_starts_module_type ON user_module_starts(module_type);
  CREATE INDEX idx_user_module_starts_current_day ON user_module_starts(user_id, module_type, current_day);
  RAISE NOTICE 'Indexes for user_module_starts created successfully';
END $$;

-- Create view to count solves per problem
DO $$
BEGIN
  RAISE NOTICE 'Creating view: problem_solve_counts';
  CREATE OR REPLACE VIEW problem_solve_counts AS
  SELECT 
    p.id as problem_id,
    p.name,
    COUNT(us.id) FILTER (WHERE us.solved = true) as solve_count
  FROM "150DayProblems" p
  LEFT JOIN user_solves us ON p.id = us.problem_id
  GROUP BY p.id, p.name;
  RAISE NOTICE 'View problem_solve_counts created successfully';
END $$;

-- Enable Row Level Security
DO $$
BEGIN
  RAISE NOTICE 'Enabling Row Level Security...';
  ALTER TABLE user_solves ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "150DayProblems" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE user_module_starts ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Row Level Security enabled successfully';
END $$;

-- Create RLS policies
DO $$
BEGIN
  RAISE NOTICE 'Creating Row Level Security policies...';
  
  -- Policy: Everyone can view 150 Day problems
  RAISE NOTICE 'Creating policy: Everyone can view 150 Day problems';
  CREATE POLICY "Everyone can view 150 Day problems"
    ON "150DayProblems"
    FOR SELECT
    USING (true);

  -- Policies for user_solves
  RAISE NOTICE 'Creating policy: Users can view their own solves';
  CREATE POLICY "Users can view their own solves"
    ON user_solves
    FOR SELECT
    USING (auth.uid() = user_id);

  RAISE NOTICE 'Creating policy: Users can insert their own solves';
  CREATE POLICY "Users can insert their own solves"
    ON user_solves
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  RAISE NOTICE 'Creating policy: Users can update their own solves';
  CREATE POLICY "Users can update their own solves"
    ON user_solves
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  RAISE NOTICE 'Creating policy: Users can delete their own solves';
  CREATE POLICY "Users can delete their own solves"
    ON user_solves
    FOR DELETE
    USING (auth.uid() = user_id);

  -- Policies for user_module_starts
  RAISE NOTICE 'Creating policy: Users can view their own module starts';
  CREATE POLICY "Users can view their own module starts"
    ON user_module_starts
    FOR SELECT
    USING (auth.uid() = user_id);

  RAISE NOTICE 'Creating policy: Users can insert their own module starts';
  CREATE POLICY "Users can insert their own module starts"
    ON user_module_starts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  RAISE NOTICE 'Creating policy: Users can update their own module starts';
  CREATE POLICY "Users can update their own module starts"
    ON user_module_starts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  RAISE NOTICE 'Creating policy: Users can delete their own module starts';
  CREATE POLICY "Users can delete their own module starts"
    ON user_module_starts
    FOR DELETE
    USING (auth.uid() = user_id);
  
  RAISE NOTICE 'All RLS policies created successfully';
END $$;

-- Create function to update updated_at timestamp
DO $$
BEGIN
  RAISE NOTICE 'Creating function: update_updated_at_column()';
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $function$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $function$ LANGUAGE plpgsql;
  RAISE NOTICE 'Function update_updated_at_column() created successfully';
END $$;

-- Create triggers to automatically update updated_at
DO $$
BEGIN
  RAISE NOTICE 'Creating triggers...';
  
  CREATE TRIGGER update_user_solves_updated_at
    BEFORE UPDATE ON user_solves
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  RAISE NOTICE 'Trigger update_user_solves_updated_at created successfully';

  CREATE TRIGGER update_user_module_starts_updated_at
    BEFORE UPDATE ON user_module_starts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  RAISE NOTICE 'Trigger update_user_module_starts_updated_at created successfully';
  
  RAISE NOTICE 'All triggers created successfully';
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - 150DayProblems (stores all problems)';
  RAISE NOTICE '  - user_solves (tracks user progress on problems)';
  RAISE NOTICE '  - user_module_starts (tracks when users start modules with current_day progress)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run: npm run upload-150day-problems (to populate problems)';
  RAISE NOTICE '2. Verify tables exist: SELECT * FROM "150DayProblems" LIMIT 5;';
  RAISE NOTICE '============================================================================';
END $$;

-- Return migration summary (visible in query results)
SELECT 
  'Migration completed successfully!' as status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '150DayProblems') as "150DayProblems_table_exists",
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_solves') as user_solves_table_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'user_module_starts') as user_module_starts_table_exists,
  (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'problem_solve_counts') as problem_solve_counts_view_exists,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'update_updated_at_column') as update_function_exists,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'update_user_solves_updated_at') as user_solves_trigger_exists,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'update_user_module_starts_updated_at') as user_module_starts_trigger_exists;

