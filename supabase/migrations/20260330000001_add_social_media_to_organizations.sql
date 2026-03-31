/*
  # Add social_media column to organizations
  Idempotent — safe to run even if column already exists.
*/

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS social_media jsonb DEFAULT '{}'::jsonb;
