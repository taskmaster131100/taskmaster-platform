/*
  # Add Multi-Tenant Support to Calendar Events

  1. Changes
    - Add `organization_id` column to `calendar_events` table
    - Update RLS policies to filter by organization
    - Add index on organization_id for performance
    - Migrate existing data (set organization_id from user's organization)

  2. Security
    - Update all RLS policies to check organization membership
    - Ensure users can only see events in their organization
*/

-- Add organization_id column to calendar_events
ALTER TABLE calendar_events
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_organization
  ON calendar_events(organization_id);

-- Migrate existing data: set organization_id from user's first organization
-- This is safe because we're in beta and can assume users have one organization
UPDATE calendar_events ce
SET organization_id = (
  SELECT uo.organization_id
  FROM user_organizations uo
  WHERE uo.user_id = ce.created_by
  LIMIT 1
)
WHERE organization_id IS NULL;

-- Make organization_id NOT NULL after migration
ALTER TABLE calendar_events
  ALTER COLUMN organization_id SET NOT NULL;

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their events" ON calendar_events;
DROP POLICY IF EXISTS "Users can create events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their events" ON calendar_events;

-- Create new organization-aware policies
CREATE POLICY "Users can view events in their organization"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events in their organization"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update events in their organization"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete events in their organization"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );
