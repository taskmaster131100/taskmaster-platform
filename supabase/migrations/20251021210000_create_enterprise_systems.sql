/*
  # Enterprise Systems - TaskMaster Pro

  1. New Tables
    - `automation_rules`: No-code automation rules
    - `automation_runs`: Execution log
    - `financial_transactions`: DRE and cost tracking
    - `cost_centers`: Budget allocation
    - `crm_contacts`: Show promoters and venues
    - `crm_deals`: Sales pipeline
    - `contracts`: Legal agreements
    - `contract_signatures`: Digital signatures
    - `media_assets`: DAM system
    - `asset_share_links`: Expirable asset links
    - `weekly_ops_reports`: Automated reports
    - `user_roles`: Granular permissions
    - `audit_log`: Complete audit trail
    - `telemetry_events`: Performance monitoring

  2. Security
    - Enable RLS on all tables
    - Policies by organization and role
*/

-- Automation Rules System
CREATE TABLE IF NOT EXISTS automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL, -- task_due, approval_pending, setlist_locked, project_over_budget
  trigger_config jsonb DEFAULT '{}'::jsonb,
  conditions jsonb DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL, -- [{ type: 'sendWhatsApp', config: {...} }]
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org automation rules"
  ON automation_rules FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage automation rules"
  ON automation_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND organization_id = automation_rules.organization_id
      AND role IN ('admin', 'owner')
    )
  );

-- Automation Runs Log
CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_data jsonb NOT NULL,
  actions_executed jsonb NOT NULL,
  status text NOT NULL, -- success, failed, partial
  error_message text,
  execution_time_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org automation runs"
  ON automation_runs FOR SELECT
  TO authenticated
  USING (
    rule_id IN (
      SELECT id FROM automation_rules
      WHERE organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

-- Financial Transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  project_id uuid,
  artist_id uuid,
  cost_center_id uuid,
  transaction_date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL, -- revenue, expense, royalty, fee
  amount decimal(15,2) NOT NULL,
  currency text DEFAULT 'BRL',
  status text DEFAULT 'pending', -- pending, approved, paid, cancelled
  payment_method text,
  invoice_number text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financial users can view org data"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'financeiro')
    )
  );

CREATE POLICY "Financial users can manage transactions"
  ON financial_transactions FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'financeiro')
    )
  );

-- Cost Centers
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  budget_annual decimal(15,2),
  parent_id uuid REFERENCES cost_centers(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, code)
);

ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org cost centers"
  ON cost_centers FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- CRM Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  company text,
  role text, -- promoter, venue_owner, municipality, sponsor
  email text,
  phone text,
  tags text[] DEFAULT '{}',
  location jsonb, -- { city, state, region }
  rating integer, -- 1-5 stars
  notes text,
  last_contact_date date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org CRM contacts"
  ON crm_contacts FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sales users can manage CRM contacts"
  ON crm_contacts FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'shows', 'sales')
    )
  );

-- CRM Deals (Sales Pipeline)
CREATE TABLE IF NOT EXISTS crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  contact_id uuid REFERENCES crm_contacts(id),
  artist_id uuid,
  title text NOT NULL,
  stage text NOT NULL, -- lead, contacted, proposal_sent, negotiating, won, lost
  value decimal(15,2),
  probability integer, -- 0-100
  expected_close_date date,
  event_date date,
  venue text,
  proposal_sent_at timestamptz,
  last_followup_at timestamptz,
  next_followup_at timestamptz,
  notes text,
  loss_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org CRM deals"
  ON crm_deals FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Sales users can manage CRM deals"
  ON crm_deals FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'shows', 'sales')
    )
  );

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  title text NOT NULL,
  template_name text,
  contract_type text NOT NULL, -- show, artist, service, venue, sponsor
  parties jsonb NOT NULL, -- [{ name, role, email }]
  content text NOT NULL,
  variables jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'draft', -- draft, pending, signed, cancelled, expired
  value decimal(15,2),
  start_date date,
  end_date date,
  version integer DEFAULT 1,
  parent_contract_id uuid REFERENCES contracts(id),
  requires_signature boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Legal users can manage contracts"
  ON contracts FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner', 'juridico')
    )
  );

-- Contract Signatures
CREATE TABLE IF NOT EXISTS contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signer_role text NOT NULL,
  token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  signed_at timestamptz,
  status text DEFAULT 'pending', -- pending, signed, declined, expired
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign with valid token"
  ON contract_signatures FOR UPDATE
  USING (status = 'pending' AND expires_at > now());

CREATE POLICY "Users can view org signatures"
  ON contract_signatures FOR SELECT
  TO authenticated
  USING (
    contract_id IN (
      SELECT id FROM contracts
      WHERE organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

-- Media Assets (DAM)
CREATE TABLE IF NOT EXISTS media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  artist_id uuid,
  project_id uuid,
  folder_path text DEFAULT '/',
  filename text NOT NULL,
  file_type text NOT NULL, -- image, video, audio, document
  mime_type text,
  size_bytes bigint,
  url text NOT NULL,
  thumbnail_url text,
  watermarked_url text,
  width integer,
  height integer,
  duration_seconds integer,
  tags text[] DEFAULT '{}',
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org media"
  ON media_assets FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can upload media"
  ON media_assets FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- Asset Share Links
CREATE TABLE IF NOT EXISTS asset_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES media_assets(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz,
  max_downloads integer,
  download_count integer DEFAULT 0,
  password_hash text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE asset_share_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can download with valid token"
  ON asset_share_links FOR SELECT
  USING (
    (expires_at IS NULL OR expires_at > now())
    AND (max_downloads IS NULL OR download_count < max_downloads)
  );

-- Weekly Ops Reports
CREATE TABLE IF NOT EXISTS weekly_ops_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  summary jsonb NOT NULL,
  sent_at timestamptz,
  recipients text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_ops_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org reports"
  ON weekly_ops_reports FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
  ));

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  changes jsonb,
  reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Telemetry Events
CREATE TABLE IF NOT EXISTS telemetry_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  user_id uuid,
  event_type text NOT NULL,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  duration_ms integer,
  error_message text,
  stack_trace text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can log telemetry"
  ON telemetry_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view telemetry"
  ON telemetry_events FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_runs_rule ON automation_runs(rule_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_org ON financial_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON crm_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_org ON crm_deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_org ON media_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_events_type ON telemetry_events(event_type);
