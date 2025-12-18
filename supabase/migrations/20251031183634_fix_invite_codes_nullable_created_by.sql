/*
  # Fix Invite Codes - Allow NULL created_by
  
  ## Purpose
  Allow invite codes without created_by for pre-generated codes (like BETA-TEAM-DEV)
  
  ## Changes
  - Make created_by nullable (already is)
  - Update RLS policies to allow anonymous users to use codes
  - Add policy for anonymous users to increment usage
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create invite codes" ON invite_codes;
DROP POLICY IF EXISTS "Users can update invite codes they created" ON invite_codes;
DROP POLICY IF EXISTS "Users can view invite codes they created" ON invite_codes;

-- Keep anonymous read access
-- (Already exists: "Anonymous users can validate invite codes")

-- Keep service role access  
-- (Already exists: "Service role can manage all invite codes")

-- Allow authenticated users to create codes (with their ID)
CREATE POLICY "Authenticated users can create invite codes"
  ON invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow authenticated users to view codes they created
CREATE POLICY "Authenticated users can view own invite codes"
  ON invite_codes
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Allow authenticated users to update codes they created
CREATE POLICY "Authenticated users can update own invite codes"
  ON invite_codes
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow anonymous users to update used_count (via RPC function)
-- This is handled by the SECURITY DEFINER function increment_invite_code_usage
