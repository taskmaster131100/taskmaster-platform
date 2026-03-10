-- =====================================================================
-- MIGRAÇÕES PENDENTES — Executar no Supabase Dashboard
-- URL: https://supabase.com/dashboard/project/fcmxljhckrztingxecss/sql
-- Data: Março 2026
-- Descrição: Corrige BUG 1 (bootstrap_organization) e BUG 5 (user_arrangements)
-- =====================================================================

-- ─── PASSO 1: Função update_music_updated_at (dependência) ───────────
CREATE OR REPLACE FUNCTION update_music_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── PASSO 2: BUG 1 — Função bootstrap_organization ─────────────────
-- Permite que novos usuários criem sua própria organização
CREATE OR REPLACE FUNCTION bootstrap_organization(org_name text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  IF org_name IS NULL OR length(trim(org_name)) = 0 THEN
    org_name := 'Minha Organização';
  END IF;

  -- Only bootstrap if user has no org yet
  IF EXISTS(SELECT 1 FROM user_organizations WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', true, 'skipped', true);
  END IF;

  INSERT INTO organizations (name)
  VALUES (trim(org_name))
  RETURNING id INTO v_org_id;

  INSERT INTO user_organizations (user_id, organization_id, role)
  VALUES (v_user_id, v_org_id, 'admin');

  RETURN jsonb_build_object('success', true, 'organization_id', v_org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION bootstrap_organization(text) TO authenticated;

-- ─── PASSO 3: BUG 5 — Tabela user_arrangements ───────────────────────
-- Arranjos/cifras/partituras do módulo de Produção Musical
CREATE TABLE IF NOT EXISTS user_arrangements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  artist text DEFAULT '',
  type text DEFAULT 'cifra' CHECK (type IN ('cifra', 'partitura', 'arranjo', 'letra')),
  content text DEFAULT '',
  abc_notation text DEFAULT '',
  key text DEFAULT 'C',
  tempo integer DEFAULT 120,
  time_signature text DEFAULT '4/4',
  instruments jsonb DEFAULT '[]'::jsonb,
  file_url text,
  file_name text,
  status text DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'em_revisao', 'finalizado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_arrangements_user ON user_arrangements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_arrangements_type ON user_arrangements(type);

ALTER TABLE user_arrangements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_arrangements' AND policyname = 'Users can view own arrangements'
  ) THEN
    CREATE POLICY "Users can view own arrangements"
      ON user_arrangements FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_arrangements' AND policyname = 'Users can create own arrangements'
  ) THEN
    CREATE POLICY "Users can create own arrangements"
      ON user_arrangements FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_arrangements' AND policyname = 'Users can update own arrangements'
  ) THEN
    CREATE POLICY "Users can update own arrangements"
      ON user_arrangements FOR UPDATE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_arrangements' AND policyname = 'Users can delete own arrangements'
  ) THEN
    CREATE POLICY "Users can delete own arrangements"
      ON user_arrangements FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DROP TRIGGER IF EXISTS user_arrangements_updated_at ON user_arrangements;
CREATE TRIGGER user_arrangements_updated_at BEFORE UPDATE ON user_arrangements
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

-- ─── PASSO 4: Tabela financial_transactions ───────────────────────────
-- Transações financeiras do usuário (também da migration pendente)
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('revenue', 'expense')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_user ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_transactions' AND policyname = 'Users can view own transactions'
  ) THEN
    CREATE POLICY "Users can view own transactions"
      ON financial_transactions FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_transactions' AND policyname = 'Users can create own transactions'
  ) THEN
    CREATE POLICY "Users can create own transactions"
      ON financial_transactions FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_transactions' AND policyname = 'Users can update own transactions'
  ) THEN
    CREATE POLICY "Users can update own transactions"
      ON financial_transactions FOR UPDATE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_transactions' AND policyname = 'Users can delete own transactions'
  ) THEN
    CREATE POLICY "Users can delete own transactions"
      ON financial_transactions FOR DELETE TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ─── VERIFICAÇÃO FINAL ────────────────────────────────────────────────
-- Rode este SELECT para confirmar que tudo foi criado:
-- SELECT routine_name FROM information_schema.routines WHERE routine_name = 'bootstrap_organization';
-- SELECT table_name FROM information_schema.tables WHERE table_name IN ('user_arrangements', 'financial_transactions');
