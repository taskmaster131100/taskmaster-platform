/*
  # Beta Testing Infrastructure
  
  1. New Tables
    - `beta_users`: Gerencia usuários beta e seus convites
    - `beta_user_logs`: Logs de uso dos testers
    - `qa_error_logs`: Logs de erros encontrados
    - `beta_feedback`: Feedback específico de beta testers
      
  2. Security
    - Enable RLS on all tables
    - Beta users can only see their own data
    - Admins can see all beta data
    
  3. Important Notes
    - Beta mode is controlled by VITE_BETA_MODE env variable
    - Invites expire after 7 days by default
    - All actions are logged for analysis
*/

-- Create beta_users table
CREATE TABLE IF NOT EXISTS beta_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'revoked')),
  valid_until timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  tester_type text NOT NULL CHECK (tester_type IN ('artist_office', 'independent_artist', 'other')),
  invite_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  activated_at timestamptz
);

-- Create beta_user_logs table
CREATE TABLE IF NOT EXISTS beta_user_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('login', 'create', 'update', 'delete', 'view', 'error')),
  module text NOT NULL,
  metadata jsonb DEFAULT '{}',
  duration integer,
  created_at timestamptz DEFAULT now()
);

-- Create qa_error_logs table
CREATE TABLE IF NOT EXISTS qa_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  error_type text NOT NULL CHECK (error_type IN ('ui', 'api', 'database', 'performance', 'other')),
  module text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  metadata jsonb DEFAULT '{}',
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create beta_feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'question')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  module text,
  screenshots text[] DEFAULT '{}',
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'resolved', 'wont_fix')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE beta_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_user_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for beta_users
CREATE POLICY "Users can view own beta status"
  ON beta_users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all beta users"
  ON beta_users FOR SELECT
  TO authenticated
  USING (
    (auth.jwt()->>'role')::text = 'admin'
  );

CREATE POLICY "System can insert beta users"
  ON beta_users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own beta status"
  ON beta_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any beta status"
  ON beta_users FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin')
  WITH CHECK ((auth.jwt()->>'role')::text = 'admin');

-- Policies for beta_user_logs
CREATE POLICY "Users can view own logs"
  ON beta_user_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all logs"
  ON beta_user_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin');

CREATE POLICY "System can insert logs"
  ON beta_user_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for qa_error_logs
CREATE POLICY "Users can view own errors"
  ON qa_error_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all errors"
  ON qa_error_logs FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin');

CREATE POLICY "Anyone can insert errors"
  ON qa_error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update errors"
  ON qa_error_logs FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin')
  WITH CHECK ((auth.jwt()->>'role')::text = 'admin');

-- Policies for beta_feedback
CREATE POLICY "Users can view own feedback"
  ON beta_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON beta_feedback FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin');

CREATE POLICY "Users can insert own feedback"
  ON beta_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback"
  ON beta_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all feedback"
  ON beta_feedback FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'role')::text = 'admin')
  WITH CHECK ((auth.jwt()->>'role')::text = 'admin');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_beta_users_user_id ON beta_users(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_users_invite_code ON beta_users(invite_code);
CREATE INDEX IF NOT EXISTS idx_beta_users_status ON beta_users(status);

CREATE INDEX IF NOT EXISTS idx_beta_user_logs_user_id ON beta_user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_user_logs_created_at ON beta_user_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_user_logs_module ON beta_user_logs(module);

CREATE INDEX IF NOT EXISTS idx_qa_error_logs_created_at ON qa_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_error_logs_resolved ON qa_error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_qa_error_logs_module ON qa_error_logs(module);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id ON beta_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_status ON beta_feedback(status);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON beta_feedback(created_at DESC);

-- Function to generate unique invite code
CREATE OR REPLACE FUNCTION generate_beta_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := 'BETA-' || upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM beta_users WHERE invite_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Function to check and update expired invites
CREATE OR REPLACE FUNCTION update_expired_beta_invites()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE beta_users
  SET status = 'expired'
  WHERE status = 'pending'
  AND valid_until < now();
END;
$$;
