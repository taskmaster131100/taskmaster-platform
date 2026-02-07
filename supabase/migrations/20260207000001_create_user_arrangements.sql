-- Tabela para arranjos/cifras/partituras criados pelo usuário no módulo de Produção Musical
-- Separada da tabela arrangements (que é vinculada a songs/organization)
CREATE TABLE IF NOT EXISTS user_arrangements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  artist text DEFAULT '',
  type text DEFAULT 'cifra' CHECK (type IN ('cifra', 'partitura', 'arranjo', 'letra')),
  content text DEFAULT '',
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

-- RLS
ALTER TABLE user_arrangements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own arrangements"
  ON user_arrangements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own arrangements"
  ON user_arrangements FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own arrangements"
  ON user_arrangements FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own arrangements"
  ON user_arrangements FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger updated_at
CREATE TRIGGER user_arrangements_updated_at BEFORE UPDATE ON user_arrangements
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

-- Tabela para transações financeiras do usuário
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

-- RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own transactions"
  ON financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions"
  ON financial_transactions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own transactions"
  ON financial_transactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
