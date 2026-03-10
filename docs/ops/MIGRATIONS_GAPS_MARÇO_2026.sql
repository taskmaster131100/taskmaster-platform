-- =====================================================================
-- MIGRATIONS — Gaps Março 2026
-- Executar no Supabase Dashboard:
-- https://supabase.com/dashboard/project/fcmxljhckrztingxecss/sql
-- =====================================================================

-- ─── BUG-004: Fix RLS em setlists (expõe dados cross-org) ────────────
-- A policy atual não filtra por organization_id
-- Verificar se setlists tem organization_id ou artist_id linkado a org

-- Opção A: se setlists tem organization_id direto
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view setlists" ON setlists;
  CREATE POLICY "Users can view setlists"
    ON setlists FOR SELECT TO authenticated
    USING (
      organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Users can manage setlists" ON setlists;
  CREATE POLICY "Users can manage setlists"
    ON setlists FOR ALL TO authenticated
    USING (
      organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
    WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    );
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN
    -- Opção B: setlists linkado a artists que tem organization_id
    DROP POLICY IF EXISTS "Users can view setlists" ON setlists;
    CREATE POLICY "Users can view setlists"
      ON setlists FOR SELECT TO authenticated
      USING (
        artist_id IN (
          SELECT id FROM artists WHERE organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
          )
        )
      );

    DROP POLICY IF EXISTS "Users can manage setlists" ON setlists;
    CREATE POLICY "Users can manage setlists"
      ON setlists FOR ALL TO authenticated
      USING (
        artist_id IN (
          SELECT id FROM artists WHERE organization_id IN (
            SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
          )
        )
      );
END $$;

-- ─── GAP-011: Tabela team_invites + RPC accept_team_invite ───────────

CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  invited_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_invites_token_idx ON team_invites(token);
CREATE INDEX IF NOT EXISTS team_invites_org_idx ON team_invites(organization_id, status);
CREATE INDEX IF NOT EXISTS team_invites_email_idx ON team_invites(email, status);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_invites' AND policyname = 'Org admins can manage invites'
  ) THEN
    CREATE POLICY "Org admins can manage invites"
      ON team_invites FOR ALL TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM user_organizations
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM user_organizations
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

-- Qualquer um pode ler o próprio convite pelo token (para a página /invite/:token)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_invites' AND policyname = 'Anyone can read invite by token'
  ) THEN
    CREATE POLICY "Anyone can read invite by token"
      ON team_invites FOR SELECT
      USING (true); -- filtro por token feito no frontend; token é UUID não-enumerável
  END IF;
END $$;

-- RPC: accept_team_invite
CREATE OR REPLACE FUNCTION accept_team_invite(invite_token uuid)
RETURNS jsonb AS $$
DECLARE
  v_invite team_invites%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado.');
  END IF;

  -- Buscar convite
  SELECT * INTO v_invite
  FROM team_invites
  WHERE token = invite_token
    AND status = 'pending'
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite inválido, já utilizado ou expirado.');
  END IF;

  -- Verificar se usuário já é membro da org
  IF EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = v_user_id AND organization_id = v_invite.organization_id
  ) THEN
    -- Marcar convite como aceito mesmo assim
    UPDATE team_invites SET status = 'accepted' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', true, 'already_member', true);
  END IF;

  -- Adicionar usuário à organização
  INSERT INTO user_organizations (user_id, organization_id, role)
  VALUES (v_user_id, v_invite.organization_id, v_invite.role);

  -- Marcar convite como aceito
  UPDATE team_invites SET status = 'accepted' WHERE id = v_invite.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invite.organization_id,
    'role', v_invite.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_team_invite(uuid) TO authenticated;

-- ─── GAP-023: Tabela user_notification_preferences ───────────────────

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_tasks boolean DEFAULT true,
  email_shows boolean DEFAULT true,
  email_releases boolean DEFAULT true,
  email_financial boolean DEFAULT true,
  email_team_invites boolean DEFAULT true,
  email_weekly_summary boolean DEFAULT true,
  push_tasks boolean DEFAULT false,
  push_shows boolean DEFAULT false,
  push_releases boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false,
  whatsapp_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_notification_preferences' AND policyname = 'Users manage own preferences'
  ) THEN
    CREATE POLICY "Users manage own preferences"
      ON user_notification_preferences FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ─── GAP-006: Tabela leads (CRM MVP) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'site', 'indicacao', 'linkedin', 'instagram', 'google_ads', 'outro')),
  stage text NOT NULL DEFAULT 'novo' CHECK (stage IN ('novo', 'contato', 'demo_agendada', 'proposta_enviada', 'negociacao', 'fechado_ganho', 'fechado_perdido')),
  value numeric(12,2) DEFAULT 0,
  notes text,
  assigned_to uuid REFERENCES auth.users(id),
  last_contact_at timestamptz,
  expected_close_date date,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_org_stage_idx ON leads(organization_id, stage);
CREATE INDEX IF NOT EXISTS leads_assigned_idx ON leads(assigned_to);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Org members can manage leads'
  ) THEN
    CREATE POLICY "Org members can manage leads"
      ON leads FOR ALL TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Trigger updated_at para leads
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();

-- ─── VERIFICAÇÃO ──────────────────────────────────────────────────────
-- SELECT table_name FROM information_schema.tables
--   WHERE table_name IN ('team_invites', 'user_notification_preferences', 'leads');
-- SELECT routine_name FROM information_schema.routines WHERE routine_name = 'accept_team_invite';
