-- Add financial split columns to shows table
-- These columns exist in the TypeScript interface and ShowForm but were missing from the DB schema,
-- causing all show creation attempts to fail with "column does not exist" error.

ALTER TABLE shows
  ADD COLUMN IF NOT EXISTS commission_rate numeric(5, 2) DEFAULT 20,
  ADD COLUMN IF NOT EXISTS artist_split numeric(5, 2) DEFAULT 80,
  ADD COLUMN IF NOT EXISTS production_split numeric(5, 2);
