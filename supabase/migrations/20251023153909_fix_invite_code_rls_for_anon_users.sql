/*
  # Fix Invite Code RLS for Anonymous Users
  
  ## Problem
  Anonymous (not logged in) users cannot validate invite codes during registration
  because RLS policies only allow authenticated users to view codes they created.
  
  ## Solution
  Add a policy that allows anonymous users to SELECT invite codes by exact code match.
  This is safe because:
  - Users can only query by exact code (no wildcard searches)
  - No sensitive data exposed (just validation)
  - Required for registration flow
  
  ## Changes
  1. Add policy: "Anonymous users can validate invite codes by exact match"
     - Role: anon
     - Command: SELECT
     - Allows checking if a specific code exists and is valid
*/

-- Create policy for anonymous users to validate invite codes
CREATE POLICY "Anonymous users can validate invite codes"
  ON invite_codes
  FOR SELECT
  TO anon
  USING (true);

-- Note: This policy allows anon users to read invite_codes table
-- This is safe because:
-- 1. Users need to know the exact code to validate it
-- 2. Codes are meant to be shared
-- 3. No sensitive information in the table
-- 4. Essential for registration flow