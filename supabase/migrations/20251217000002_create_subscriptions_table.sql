/*
  # Create Subscriptions System

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `plan_id` (text) - starter, pro, enterprise
      - `status` (text) - active, cancelled, past_due, trialing
      - `stripe_customer_id` (text)
      - `stripe_subscription_id` (text)
      - `stripe_price_id` (text)
      - `current_period_start` (timestamptz)
      - `current_period_end` (timestamptz)
      - `cancel_at_period_end` (boolean)
      - `trial_start` (timestamptz)
      - `trial_end` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `subscriptions` table
    - Add policies for organization members to view their subscription
    - Add policies for admins to manage subscriptions
*/

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id text NOT NULL CHECK (plan_id IN ('starter', 'pro', 'enterprise')),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  trial_start timestamptz,
  trial_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view their subscription
CREATE POLICY "Organization members can view subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Policy: Organization admins can update subscription
CREATE POLICY "Organization admins can update subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT uo.organization_id 
      FROM user_organizations uo
      JOIN organization_members om ON om.organization_id = uo.organization_id AND om.user_id = uo.user_id
      WHERE uo.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );

-- Policy: System can insert subscriptions (for Stripe webhooks)
CREATE POLICY "System can insert subscriptions"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Create view for easy subscription status checking
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.*,
  o.name as organization_name,
  CASE 
    WHEN s.status = 'trialing' AND s.trial_end > now() THEN true
    WHEN s.status = 'active' AND s.current_period_end > now() THEN true
    ELSE false
  END as is_active
FROM subscriptions s
JOIN organizations o ON o.id = s.organization_id;

-- Grant access to the view
GRANT SELECT ON active_subscriptions TO authenticated;
