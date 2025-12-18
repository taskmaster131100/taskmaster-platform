/*
  # Create KPIs System

  1. New Tables
    - `kpis`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations) - For multi-tenant
      - `title` (text, KPI name)
      - `description` (text, KPI description)
      - `current_value` (numeric, current progress)
      - `target_value` (numeric, target goal)
      - `unit` (text, measurement unit: streams, shows, $, etc)
      - `category` (text, KPI category)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `kpis` table
    - Add policies for authenticated users to manage KPIs in their organization
    - Users can view, create, update, delete KPIs in their organization

  3. Indexes
    - Index on organization_id for faster queries
    - Index on category for filtering
    - Index on created_by for user-specific queries
*/

-- Create kpis table
CREATE TABLE IF NOT EXISTS kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  current_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  unit text DEFAULT '',
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'streaming', 'shows', 'social', 'financial', 'marketing')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

-- Policies for kpis
CREATE POLICY "Users can view KPIs in their organization"
  ON kpis FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create KPIs in their organization"
  ON kpis FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update KPIs in their organization"
  ON kpis FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete KPIs in their organization"
  ON kpis FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_kpis_organization
  ON kpis(organization_id);

CREATE INDEX IF NOT EXISTS idx_kpis_category
  ON kpis(category);

CREATE INDEX IF NOT EXISTS idx_kpis_created_by
  ON kpis(created_by);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_kpis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kpis_updated_at
  BEFORE UPDATE ON kpis
  FOR EACH ROW
  EXECUTE FUNCTION update_kpis_updated_at();
