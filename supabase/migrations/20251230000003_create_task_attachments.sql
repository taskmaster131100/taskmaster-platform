/*
  # Create Task Attachments System

  1. New Tables
    - `task_attachments` - Attachments for tasks, events, and budget items

  2. Storage
    - Create storage bucket for attachments

  3. Security
    - Enable RLS
    - Policies for organization members
*/

-- Create task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,
  budget_item_id uuid REFERENCES budget_items(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text,
  storage_path text NOT NULL,
  url text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  
  -- At least one entity must be referenced
  CONSTRAINT attachment_has_entity CHECK (
    task_id IS NOT NULL OR 
    event_id IS NOT NULL OR 
    budget_item_id IS NOT NULL
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_attachments_organization ON task_attachments(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_event ON task_attachments(event_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_budget_item ON task_attachments(budget_item_id);

-- Enable RLS
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view org attachments
CREATE POLICY "Users can view org attachments"
  ON task_attachments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can upload attachments
CREATE POLICY "Users can upload attachments"
  ON task_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
  ON task_attachments FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Create storage bucket for attachments (if not exists)
-- Note: This needs to be run in Supabase Dashboard or via API
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('attachments', 'attachments', false)
-- ON CONFLICT (id) DO NOTHING;

-- Function to get attachments for a task
CREATE OR REPLACE FUNCTION get_task_attachments(p_task_id uuid)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_size bigint,
  file_type text,
  url text,
  uploaded_by uuid,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.file_name,
    ta.file_size,
    ta.file_type,
    ta.url,
    ta.uploaded_by,
    ta.created_at
  FROM task_attachments ta
  WHERE ta.task_id = p_task_id
  ORDER BY ta.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get attachments for an event
CREATE OR REPLACE FUNCTION get_event_attachments(p_event_id uuid)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_size bigint,
  file_type text,
  url text,
  uploaded_by uuid,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.file_name,
    ta.file_size,
    ta.file_type,
    ta.url,
    ta.uploaded_by,
    ta.created_at
  FROM task_attachments ta
  WHERE ta.event_id = p_event_id
  ORDER BY ta.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add attachment_count to tasks view
CREATE OR REPLACE VIEW tasks_with_attachments AS
SELECT 
  t.*,
  COALESCE(COUNT(ta.id), 0) as attachment_count
FROM tasks t
LEFT JOIN task_attachments ta ON ta.task_id = t.id
GROUP BY t.id;

-- Grant access to the view
GRANT SELECT ON tasks_with_attachments TO authenticated;
