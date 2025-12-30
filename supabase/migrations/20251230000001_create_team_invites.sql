/*
  # Create Team Invites System

  1. New Tables
    - `team_invites`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `email` (text)
      - `role` (text)
      - `token` (text, unique)
      - `invited_by` (uuid, references auth.users)
      - `status` (text)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `team_invites` table
    - Add policies for organization admins
*/

-- Create team_invites table
CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_invites_organization ON team_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view org invites
CREATE POLICY "Admins can view org invites"
  ON team_invites FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Admins can create invites
CREATE POLICY "Admins can create invites"
  ON team_invites FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Admins can update invites
CREATE POLICY "Admins can update invites"
  ON team_invites FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Admins can delete invites
CREATE POLICY "Admins can delete invites"
  ON team_invites FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policy: Anyone can view invite by token (for accepting)
CREATE POLICY "Anyone can view invite by token"
  ON team_invites FOR SELECT
  TO anon, authenticated
  USING (status = 'pending' AND expires_at > now());

-- Function to accept invite
CREATE OR REPLACE FUNCTION accept_team_invite(invite_token text)
RETURNS jsonb AS $$
DECLARE
  v_invite team_invites%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get invite
  SELECT * INTO v_invite
  FROM team_invites
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now();

  IF v_invite.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;

  -- Add user to organization
  INSERT INTO user_organizations (user_id, organization_id, role)
  VALUES (v_user_id, v_invite.organization_id, v_invite.role)
  ON CONFLICT (user_id, organization_id) DO UPDATE SET role = EXCLUDED.role;

  -- Mark invite as accepted
  UPDATE team_invites
  SET status = 'accepted'
  WHERE id = v_invite.id;

  RETURN jsonb_build_object('success', true, 'organization_id', v_invite.organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire old invites (run via cron)
CREATE OR REPLACE FUNCTION expire_old_invites()
RETURNS void AS $$
BEGIN
  UPDATE team_invites
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
