/*
  # Sistema de Planejamento MVP - TaskMaster

  1. Novas Tabelas
    - `plannings` - Planejamentos principais
    - `planning_phases` - Fases do planejamento
    - `planning_logs` - Auditoria de ações

  2. Segurança
    - Enable RLS em todas as tabelas
    - Policies para authenticated users
*/

-- Criar tabela de planejamentos
CREATE TABLE IF NOT EXISTS plannings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('ai_generated', 'imported_pdf', 'imported_docx', 'imported_txt', 'imported_md', 'manual')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ai_prompt text,
  original_file_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de fases
CREATE TABLE IF NOT EXISTS planning_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid NOT NULL REFERENCES plannings(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  color text DEFAULT '#3b82f6',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS planning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid NOT NULL REFERENCES plannings(id) ON DELETE CASCADE,
  action text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_plannings_created_by ON plannings(created_by);
CREATE INDEX IF NOT EXISTS idx_plannings_status ON plannings(status);
CREATE INDEX IF NOT EXISTS idx_planning_phases_planning ON planning_phases(planning_id);
CREATE INDEX IF NOT EXISTS idx_planning_logs_planning ON planning_logs(planning_id);

-- Enable Row Level Security
ALTER TABLE plannings ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para plannings
CREATE POLICY "Users can view own plannings"
  ON plannings FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create plannings"
  ON plannings FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own plannings"
  ON plannings FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete own plannings"
  ON plannings FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies para planning_phases
CREATE POLICY "Users can view own planning phases"
  ON planning_phases FOR SELECT
  TO authenticated
  USING (
    planning_id IN (SELECT id FROM plannings WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can create planning phases"
  ON planning_phases FOR INSERT
  TO authenticated
  WITH CHECK (
    planning_id IN (SELECT id FROM plannings WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can update planning phases"
  ON planning_phases FOR UPDATE
  TO authenticated
  USING (
    planning_id IN (SELECT id FROM plannings WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can delete planning phases"
  ON planning_phases FOR DELETE
  TO authenticated
  USING (
    planning_id IN (SELECT id FROM plannings WHERE created_by = auth.uid())
  );

-- RLS Policies para planning_logs
CREATE POLICY "Users can view own planning logs"
  ON planning_logs FOR SELECT
  TO authenticated
  USING (
    planning_id IN (SELECT id FROM plannings WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can create planning logs"
  ON planning_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_planning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_plannings_updated_at
  BEFORE UPDATE ON plannings
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_updated_at();
