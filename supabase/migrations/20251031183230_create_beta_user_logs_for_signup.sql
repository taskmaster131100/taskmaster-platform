/*
  # Beta User Logs - Simplified for Signup

  ## Purpose
  Create a simplified beta_user_logs table that works with the current signup flow.

  ## Tables Created

  ### beta_user_logs
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `action_type` (text) - 'signup', 'login', etc
  - `module` (text) - 'auth', 'music', etc
  - `metadata` (jsonb) - flexible data storage
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Anonymous users can insert (for signup before auth completes)
  - Authenticated users can insert their own logs
  - Only service_role can read all logs
*/

-- Create beta_user_logs table
CREATE TABLE IF NOT EXISTS beta_user_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  module text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_user_logs_user_id ON beta_user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_user_logs_created_at ON beta_user_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_user_logs_action_type ON beta_user_logs(action_type);

-- Enable RLS
ALTER TABLE beta_user_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anonymous users can insert (for signup)
CREATE POLICY "Anonymous users can insert beta logs"
  ON beta_user_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Authenticated users can insert their own logs
CREATE POLICY "Authenticated users can insert own beta logs"
  ON beta_user_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Service role can manage all logs
CREATE POLICY "Service role can manage all beta logs"
  ON beta_user_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
