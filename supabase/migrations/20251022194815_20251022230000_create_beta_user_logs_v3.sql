/*
  # Create Beta User Tracking System
  
  1. New Tables
    - `beta_user_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `email` (text)
      - `account_type` (text: artist/office/producer)
      - `language` (text: pt/en/es)
      - `signup_source` (text)
      - `created_at` (timestamp)
      
  2. Functions
    - `get_beta_user_stats()` - Returns aggregated beta user statistics
    
  3. Security
    - Enable RLS on `beta_user_logs` table
    - Users can read their own logs only
*/

-- Create beta_user_logs table
CREATE TABLE IF NOT EXISTS beta_user_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  account_type text CHECK (account_type IN ('artist', 'office', 'producer')),
  language text CHECK (language IN ('pt', 'en', 'es')) DEFAULT 'pt',
  signup_source text DEFAULT 'web',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE beta_user_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own logs
CREATE POLICY "Users can view own beta logs"
  ON beta_user_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for service role to insert logs
CREATE POLICY "Service role can insert beta logs"
  ON beta_user_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_beta_user_logs_created_at ON beta_user_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_user_logs_user_id ON beta_user_logs(user_id);