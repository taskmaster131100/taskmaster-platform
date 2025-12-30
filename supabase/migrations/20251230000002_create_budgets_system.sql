/*
  # Create Budgets System

  1. New Tables
    - `budgets` - Main budget table
    - `budget_items` - Individual budget line items

  2. Security
    - Enable RLS on all tables
    - Policies for organization members
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid,
  name text NOT NULL,
  description text,
  total_amount decimal(15,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_items table
CREATE TABLE IF NOT EXISTS budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text NOT NULL,
  planned_amount decimal(15,2) NOT NULL DEFAULT 0,
  actual_amount decimal(15,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  due_date date,
  paid_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_organization ON budgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_status ON budget_items(status);
CREATE INDEX IF NOT EXISTS idx_budget_items_due_date ON budget_items(due_date);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- Policies for budgets
CREATE POLICY "Users can view org budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create org budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'manager')
    )
  );

CREATE POLICY "Users can update org budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'manager')
    )
  );

CREATE POLICY "Users can delete org budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Policies for budget_items
CREATE POLICY "Users can view budget items"
  ON budget_items FOR SELECT
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM budgets
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create budget items"
  ON budget_items FOR INSERT
  TO authenticated
  WITH CHECK (
    budget_id IN (
      SELECT id FROM budgets
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'manager')
      )
    )
  );

CREATE POLICY "Users can update budget items"
  ON budget_items FOR UPDATE
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM budgets
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner', 'manager')
      )
    )
  );

CREATE POLICY "Users can delete budget items"
  ON budget_items FOR DELETE
  TO authenticated
  USING (
    budget_id IN (
      SELECT id FROM budgets
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
        AND role IN ('admin', 'owner')
      )
    )
  );

-- View for budget summary
CREATE OR REPLACE VIEW budget_summary AS
SELECT 
  b.id,
  b.organization_id,
  b.name,
  b.total_amount,
  b.currency,
  b.status,
  b.start_date,
  b.end_date,
  COALESCE(SUM(bi.planned_amount), 0) as total_planned,
  COALESCE(SUM(bi.actual_amount), 0) as total_spent,
  b.total_amount - COALESCE(SUM(bi.actual_amount), 0) as remaining,
  COUNT(bi.id) as item_count,
  COUNT(CASE WHEN bi.status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN bi.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN bi.status = 'overdue' THEN 1 END) as overdue_count
FROM budgets b
LEFT JOIN budget_items bi ON bi.budget_id = b.id
GROUP BY b.id;

-- Grant access to the view
GRANT SELECT ON budget_summary TO authenticated;

-- Function to get budget by category
CREATE OR REPLACE FUNCTION get_budget_by_category(p_budget_id uuid)
RETURNS TABLE (
  category text,
  planned_total decimal,
  actual_total decimal,
  item_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bi.category,
    SUM(bi.planned_amount) as planned_total,
    SUM(bi.actual_amount) as actual_total,
    COUNT(*) as item_count
  FROM budget_items bi
  WHERE bi.budget_id = p_budget_id
  GROUP BY bi.category
  ORDER BY planned_total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark overdue items
CREATE OR REPLACE FUNCTION mark_overdue_budget_items()
RETURNS void AS $$
BEGIN
  UPDATE budget_items
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
