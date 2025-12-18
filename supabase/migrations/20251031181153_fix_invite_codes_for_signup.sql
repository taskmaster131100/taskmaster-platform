/*
  # Fix Invite Codes for Anonymous Signup

  1. Changes
    - Allow anonymous users to SELECT from invite_codes table
    - This is needed for users to validate invite codes during signup (before they have an account)
    - Security: Anonymous users can only read, not modify invite codes
    
  2. Security
    - Anonymous users can only SELECT (read) invite codes
    - Only the code, max_uses, used_count, and expires_at fields are needed for validation
    - Users still cannot INSERT, UPDATE, or DELETE without authentication
*/

-- Create invite_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid,
  max_uses int DEFAULT 5,
  used_count int DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invite codes they created" ON invite_codes;
DROP POLICY IF EXISTS "Users can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can update invite codes they created" ON invite_codes;
DROP POLICY IF EXISTS "Service role can manage all invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Anonymous users can validate invite codes" ON invite_codes;

-- CRITICAL: Allow anonymous users to read invite codes for validation during signup
CREATE POLICY "Anonymous users can validate invite codes"
  ON invite_codes
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can view invite codes they created
CREATE POLICY "Users can view invite codes they created"
  ON invite_codes
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users can create invite codes
CREATE POLICY "Users can create invite codes"
  ON invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can update invite codes they created
CREATE POLICY "Users can update invite codes they created"
  ON invite_codes
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Service role can manage all invite codes
CREATE POLICY "Service role can manage all invite codes"
  ON invite_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_organization_id ON invite_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Insert BETA-TEAM-DEV code if it doesn't exist
INSERT INTO invite_codes (code, max_uses, used_count, expires_at)
VALUES ('BETA-TEAM-DEV', 999, 0, now() + interval '1 year')
ON CONFLICT (code) DO NOTHING;