/*
  # Add Organization Profile Fields
  Adds phone, description, website, social_media, logo_url, address fields
  to the organizations table so users can fill in their org profile.
*/

-- Add profile columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS social_media jsonb DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_team_members integer DEFAULT 5;
