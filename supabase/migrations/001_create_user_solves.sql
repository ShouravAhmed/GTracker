-- ============================================================================
-- CLEANUP: Drop all existing tables, views, functions, and constraints
-- ============================================================================



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
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = '150DayProblems') THEN
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
  ELSE
    RAISE NOTICE 'Table 150DayProblems already exists, skipping creation...';
  END IF;
END $$;

-- Create indexes for faster queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_150dayproblems_name') THEN
    RAISE NOTICE 'Creating index: idx_150dayproblems_name';
    CREATE INDEX idx_150dayproblems_name ON "150DayProblems"(name);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_150dayproblems_type') THEN
    RAISE NOTICE 'Creating index: idx_150dayproblems_type';
    CREATE INDEX idx_150dayproblems_type ON "150DayProblems"(type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_150dayproblems_day') THEN
    RAISE NOTICE 'Creating index: idx_150dayproblems_day';
    CREATE INDEX idx_150dayproblems_day ON "150DayProblems"(day);
  END IF;
  
  RAISE NOTICE 'Indexes for 150DayProblems created successfully';
END $$;

-- Create user_solves table to store problem solve status for each user
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_solves') THEN
    RAISE NOTICE 'Creating table: user_solves';
    CREATE TABLE user_solves (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      problem_id UUID NOT NULL REFERENCES "150DayProblems"(id) ON DELETE CASCADE,
      solved BOOLEAN NOT NULL DEFAULT true,
      note TEXT,
      started_at TIMESTAMP WITH TIME ZONE,
      total_time_worked INTEGER NOT NULL DEFAULT 0, -- in seconds
      focus_time INTEGER NOT NULL DEFAULT 0, -- in seconds
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, problem_id)
    );
    RAISE NOTICE 'Table user_solves created successfully';
  ELSE
    RAISE NOTICE 'Table user_solves already exists, skipping creation...';
  END IF;
END $$;

-- Create indexes for faster queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_solves_user_id') THEN
    RAISE NOTICE 'Creating index: idx_user_solves_user_id';
    CREATE INDEX idx_user_solves_user_id ON user_solves(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_solves_problem_id') THEN
    RAISE NOTICE 'Creating index: idx_user_solves_problem_id';
    CREATE INDEX idx_user_solves_problem_id ON user_solves(problem_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_solves_solved') THEN
    RAISE NOTICE 'Creating index: idx_user_solves_solved';
    CREATE INDEX idx_user_solves_solved ON user_solves(solved);
  END IF;
  
  RAISE NOTICE 'Indexes for user_solves created successfully';
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
  RAISE NOTICE 'Enabling Row Level Security on user_solves...';
  ALTER TABLE user_solves ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Enabling Row Level Security on 150DayProblems...';
  ALTER TABLE "150DayProblems" ENABLE ROW LEVEL SECURITY;
  RAISE NOTICE 'Row Level Security enabled successfully';
END $$;

-- Create RLS policies
DO $$
BEGIN
  RAISE NOTICE 'Creating Row Level Security policies...';
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Everyone can view 150 Day problems" ON "150DayProblems";
  DROP POLICY IF EXISTS "Users can view their own solves" ON user_solves;
  DROP POLICY IF EXISTS "Users can insert their own solves" ON user_solves;
  DROP POLICY IF EXISTS "Users can update their own solves" ON user_solves;
  DROP POLICY IF EXISTS "Users can delete their own solves" ON user_solves;
  
  -- Create policy: Everyone can view 150 Day problems
  RAISE NOTICE 'Creating policy: Everyone can view 150 Day problems';
  CREATE POLICY "Everyone can view 150 Day problems"
    ON "150DayProblems"
    FOR SELECT
    USING (true);

  -- Create policy: Users can only see their own solves
  RAISE NOTICE 'Creating policy: Users can view their own solves';
  CREATE POLICY "Users can view their own solves"
    ON user_solves
    FOR SELECT
    USING (auth.uid() = user_id);

  -- Create policy: Users can insert their own solves
  RAISE NOTICE 'Creating policy: Users can insert their own solves';
  CREATE POLICY "Users can insert their own solves"
    ON user_solves
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  -- Create policy: Users can update their own solves
  RAISE NOTICE 'Creating policy: Users can update their own solves';
  CREATE POLICY "Users can update their own solves"
    ON user_solves
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  -- Create policy: Users can delete their own solves
  RAISE NOTICE 'Creating policy: Users can delete their own solves';
  CREATE POLICY "Users can delete their own solves"
    ON user_solves
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

-- Create trigger to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_user_solves_updated_at') THEN
    RAISE NOTICE 'Creating trigger: update_user_solves_updated_at';
    CREATE TRIGGER update_user_solves_updated_at
      BEFORE UPDATE ON user_solves
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    RAISE NOTICE 'Trigger update_user_solves_updated_at created successfully';
  ELSE
    RAISE NOTICE 'Trigger update_user_solves_updated_at already exists, skipping...';
  END IF;
END $$;

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '============================================================================';
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
  (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'problem_solve_counts') as problem_solve_counts_view_exists,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'update_updated_at_column') as update_function_exists,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'update_user_solves_updated_at') as trigger_exists;

