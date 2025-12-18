/*
  # Beta User Logs and Registration Tracking

  ## Purpose
  Track all beta user registrations for go-live analytics and capacity planning (target: 1,100 users).

  ## Tables Created

  ### beta_user_logs
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to auth.users)
  - `email` (text, not null)
  - `account_type` (text) - 'artist', 'office', 'producer'
  - `language` (text) - 'pt', 'en', 'es'
  - `signup_source` (text) - 'web', 'mobile', 'api'
  - `ip_address` (text) - for analytics
  - `user_agent` (text) - browser/device info
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Only service_role can read logs (admin dashboard)
  - Insert policy for authenticated users during signup
*/

-- Create beta_user_logs table
CREATE TABLE IF NOT EXISTS beta_user_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  account_type text CHECK (account_type IN ('artist', 'office', 'producer')),
  language text CHECK (language IN ('pt', 'en', 'es')) DEFAULT 'pt',
  signup_source text DEFAULT 'web',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beta_user_logs_user_id ON beta_user_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_user_logs_created_at ON beta_user_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_user_logs_account_type ON beta_user_logs(account_type);

-- Enable RLS
ALTER TABLE beta_user_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all logs (for admin dashboard)
CREATE POLICY "Service role can manage all beta logs"
  ON beta_user_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can insert their own log during signup
CREATE POLICY "Users can insert own beta log"
  ON beta_user_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to get beta user stats (for admin dashboard)
CREATE OR REPLACE FUNCTION get_beta_user_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_signups', COUNT(*),
      'by_account_type', (
        SELECT json_object_agg(account_type, count)
        FROM (
          SELECT account_type, COUNT(*) as count
          FROM beta_user_logs
          GROUP BY account_type
        ) subq
      ),
      'by_language', (
        SELECT json_object_agg(language, count)
        FROM (
          SELECT language, COUNT(*) as count
          FROM beta_user_logs
          GROUP BY language
        ) subq
      ),
      'signups_today', (
        SELECT COUNT(*)
        FROM beta_user_logs
        WHERE created_at >= CURRENT_DATE
      ),
      'signups_this_week', (
        SELECT COUNT(*)
        FROM beta_user_logs
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      ),
      'signups_this_month', (
        SELECT COUNT(*)
        FROM beta_user_logs
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      )
    )
    FROM beta_user_logs
  );
END;
$$;

-- View for beta dashboard (accessible by admins)
CREATE OR REPLACE VIEW beta_signups_summary AS
SELECT
  DATE(created_at) as signup_date,
  account_type,
  language,
  COUNT(*) as count
FROM beta_user_logs
GROUP BY DATE(created_at), account_type, language
ORDER BY signup_date DESC;
