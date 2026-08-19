-- ============================================================================
-- ADD RATING + FOLLOW-UP COLUMNS
-- Additive, idempotent migration. Safe to run on a live database — it never
-- drops or rewrites existing data, only adds new nullable/defaulted columns.
-- ============================================================================

ALTER TABLE user_solves
  ADD COLUMN IF NOT EXISTS rating SMALLINT CHECK (rating IS NULL OR (rating BETWEEN 1 AND 10)),
  ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS followup BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS followup_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_user_solves_followup ON user_solves(user_id, followup) WHERE followup = true;
CREATE INDEX IF NOT EXISTS idx_user_solves_rating ON user_solves(user_id, rating) WHERE rating IS NOT NULL;
