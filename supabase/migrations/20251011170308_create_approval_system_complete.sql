/*
  # Create Complete Approval System with RACI, SLA and Audit Trail

  ## Overview
  Implements a comprehensive approval system for task workflows with:
  - Organizations and user relationships
  - Tasks with approval requirements
  - Configurable approval rules by workstream and task type
  - RACI matrix support for role-based approvals
  - SLA tracking with automatic escalation
  - Freeze window protection near launch dates
  - Complete audit trail with snapshots

  ## 1. New Tables
  
  ### organizations
  Multi-tenant organizations:
  - `id` (uuid, primary key)
  - `name` (text)
  - `created_at` (timestamptz)
  
  ### user_organizations
  User membership in organizations:
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Reference to auth.users
  - `organization_id` (uuid) - Reference to organizations
  - `role` (text) - User role (admin, manager, member, viewer)
  - `created_at` (timestamptz)
  
  ### tasks
  Task management:
  - `id` (uuid, primary key)
  - `organization_id` (uuid)
  - `title` (text)
  - `description` (text)
  - `status` (text)
  - `workstream` (text) - Content area
  - `task_type` (text) - Specific type
  - `requires_approval` (boolean)
  - `deadline` (timestamptz)
  - `created_by` (uuid)
  - `assigned_to` (uuid)
  - `metadata` (jsonb)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  
  ### approval_rules
  Defines approval requirements:
  - `id` (uuid, primary key)
  - `org_id` (uuid)
  - `workstream` (text)
  - `task_type` (text)
  - `required_roles` (text[])
  - `sla_hours` (int)
  - `freeze_window_days` (int)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### task_approvals
  Tracks approval requests:
  - `id` (uuid, primary key)
  - `task_id` (uuid)
  - `rule_id` (uuid)
  - `status` (text)
  - `requested_by` (uuid)
  - `requested_at` (timestamptz)
  - `sla_deadline` (timestamptz)
  - `freeze_active` (boolean)
  - `completed_at` (timestamptz)
  - `snapshot` (jsonb)
  - `org_id` (uuid)

  ### approval_history
  Complete audit trail:
  - `id` (uuid, primary key)
  - `approval_id` (uuid)
  - `task_id` (uuid)
  - `actor_id` (uuid)
  - `action` (text)
  - `comment` (text)
  - `snapshot` (jsonb)
  - `created_at` (timestamptz)

  ## 2. Security
  - Enable RLS on all tables
  - Policies for authenticated users to read/manage within their org
  - Audit trail is append-only

  ## 3. Indexes
  - Optimized queries for lookups by task, org, status
  - SLA deadline tracking for escalation
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_organizations junction table
CREATE TABLE IF NOT EXISTS user_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'pending_approval', 'approved', 'done', 'cancelled')),
  workstream text CHECK (workstream IN ('conteudo', 'shows', 'logistica', 'estrategia', 'geral')),
  task_type text,
  requires_approval boolean DEFAULT false,
  deadline timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  assigned_to uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create approval_rules table
CREATE TABLE IF NOT EXISTS approval_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workstream text NOT NULL CHECK (workstream IN ('conteudo', 'shows', 'logistica', 'estrategia', 'geral')),
  task_type text NOT NULL,
  required_roles text[] NOT NULL DEFAULT '{}',
  sla_hours int NOT NULL DEFAULT 24 CHECK (sla_hours > 0),
  freeze_window_days int DEFAULT 3 CHECK (freeze_window_days >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create task_approvals table
CREATE TABLE IF NOT EXISTS task_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  rule_id uuid REFERENCES approval_rules(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated', 'cancelled')),
  requested_by uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz DEFAULT now(),
  sla_deadline timestamptz NOT NULL,
  freeze_active boolean DEFAULT false,
  completed_at timestamptz,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create approval_history table
CREATE TABLE IF NOT EXISTS approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid NOT NULL REFERENCES task_approvals(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('requested', 'approved', 'rejected', 'escalated', 'commented', 'cancelled')),
  comment text,
  snapshot jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_workstream ON tasks(workstream);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_approval_rules_org ON approval_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_approval_rules_workstream ON approval_rules(workstream, task_type);
CREATE INDEX IF NOT EXISTS idx_task_approvals_task ON task_approvals(task_id);
CREATE INDEX IF NOT EXISTS idx_task_approvals_status ON task_approvals(status);
CREATE INDEX IF NOT EXISTS idx_task_approvals_org ON task_approvals(org_id);
CREATE INDEX IF NOT EXISTS idx_task_approvals_sla ON task_approvals(sla_deadline) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_approval_history_approval ON approval_history(approval_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_task ON approval_history(task_id);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage their organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for user_organizations
CREATE POLICY "Users can view members of their organizations"
  ON user_organizations FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organization members"
  ON user_organizations FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their org"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their org"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their org"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete tasks in their org"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for approval_rules
CREATE POLICY "Users can view approval rules in their org"
  ON approval_rules FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage approval rules"
  ON approval_rules FOR ALL
  TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS Policies for task_approvals
CREATE POLICY "Users can view approvals in their org"
  ON task_approvals FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can request approvals in their org"
  ON task_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update approvals in their org"
  ON task_approvals FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for approval_history
CREATE POLICY "Users can view approval history in their org"
  ON approval_history FOR SELECT
  TO authenticated
  USING (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN user_organizations uo ON uo.organization_id = t.organization_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add to approval history"
  ON approval_history FOR INSERT
  TO authenticated
  WITH CHECK (
    task_id IN (
      SELECT t.id FROM tasks t
      JOIN user_organizations uo ON uo.organization_id = t.organization_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_approval_rules_updated_at ON approval_rules;
CREATE TRIGGER update_approval_rules_updated_at
  BEFORE UPDATE ON approval_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check freeze window
CREATE OR REPLACE FUNCTION check_freeze_window(
  p_task_id uuid,
  p_freeze_days int
) RETURNS boolean AS $$
DECLARE
  v_deadline timestamptz;
  v_freeze_active boolean;
BEGIN
  SELECT deadline INTO v_deadline
  FROM tasks
  WHERE id = p_task_id;
  
  IF v_deadline IS NULL THEN
    RETURN false;
  END IF;
  
  v_freeze_active := (v_deadline - INTERVAL '1 day' * p_freeze_days) <= now();
  RETURN v_freeze_active;
END;
$$ LANGUAGE plpgsql;

-- Seed default approval rules (only if organizations exist)
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    -- Master final (conteúdo)
    INSERT INTO approval_rules (org_id, workstream, task_type, required_roles, sla_hours, freeze_window_days)
    VALUES (
      org_record.id,
      'conteudo',
      'master_final',
      ARRAY['A&R', 'Produtor Musical'],
      48,
      7
    )
    ON CONFLICT DO NOTHING;
    
    -- Capa final (conteúdo)
    INSERT INTO approval_rules (org_id, workstream, task_type, required_roles, sla_hours, freeze_window_days)
    VALUES (
      org_record.id,
      'conteudo',
      'capa_final',
      ARRAY['Diretor de Arte', 'Marketing'],
      24,
      5
    )
    ON CONFLICT DO NOTHING;
    
    -- Rider técnico (shows)
    INSERT INTO approval_rules (org_id, workstream, task_type, required_roles, sla_hours, freeze_window_days)
    VALUES (
      org_record.id,
      'shows',
      'rider_tecnico',
      ARRAY['Produtor de Shows', 'Diretor Técnico'],
      72,
      10
    )
    ON CONFLICT DO NOTHING;
    
    -- Orçamento (logística)
    INSERT INTO approval_rules (org_id, workstream, task_type, required_roles, sla_hours, freeze_window_days)
    VALUES (
      org_record.id,
      'logistica',
      'orcamento',
      ARRAY['Financeiro', 'Gerente de Projeto'],
      24,
      3
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;