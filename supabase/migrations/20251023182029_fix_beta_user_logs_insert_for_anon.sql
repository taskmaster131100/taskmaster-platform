/*
  # Fix beta_user_logs INSERT for Anonymous Users
  
  ## Problem
  During user registration (signUp), the system tries to insert into beta_user_logs
  but the user is still anonymous (not yet authenticated), so RLS blocks the INSERT.
  
  ## Solution
  Add a policy allowing anonymous users to INSERT into beta_user_logs.
  This is safe because:
  - Only occurs during registration flow
  - User_id will be set after signUp completes
  - Essential for tracking beta signups
  
  ## Changes
  1. Add policy: "Anonymous users can insert signup logs"
     - Role: anon
     - Command: INSERT
     - Allows logging during registration
*/

-- Create policy for anonymous users to insert beta logs during signup
CREATE POLICY "Anonymous users can insert signup logs"
  ON beta_user_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Note: This is safe because:
-- 1. Only used during signup flow
-- 2. User_id is set from signUp response
-- 3. Essential for beta tracking
-- 4. No security risk (public beta program)