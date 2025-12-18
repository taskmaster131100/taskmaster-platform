/*
  # Sistema de Planejamento - TaskMaster

  1. Novas Tabelas
    - `plannings` - Planejamentos principais (gerados por IA ou importados)
      - `id` (uuid, primary key)
      - `name` (text) - Nome do planejamento
      - `description` (text) - Descrição/objetivo
      - `type` (text) - 'ai_generated', 'imported_pdf', 'imported_docx', 'manual'
      - `status` (text) - 'draft', 'in_progress', 'under_review', 'completed', 'archived'
      - `organization_id` (uuid) - Organização dona
      - `created_by` (uuid) - Usuário criador
      - `ai_prompt` (text) - Prompt usado (se gerado por IA)
      - `original_file_url` (text) - URL do arquivo original (se importado)
      - `metadata` (jsonb) - Dados extras (OCR, processamento, etc)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `planning_phases` - Fases do planejamento
      - `id` (uuid, primary key)
      - `planning_id` (uuid, foreign key)
      - `name` (text) - Nome da fase (ex: "Gravação", "Lançamento")
      - `description` (text)
      - `order_index` (integer) - Ordem de exibição
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text) - 'pending', 'in_progress', 'completed'
      - `color` (text) - Cor visual no timeline
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `planning_tasks` - Tarefas vinculadas a fases
      - `id` (uuid, primary key)
      - `phase_id` (uuid, foreign key)
      - `task_id` (uuid, foreign key → tasks) - Tarefa no TaskBoard
      - `module_type` (text) - 'content', 'shows', 'communication', 'analysis', 'kpis', 'finance'
      - `created_at` (timestamptz)

    - `planning_logs` - Auditoria de ações
      - `id` (uuid, primary key)
      - `planning_id` (uuid, foreign key)
      - `action` (text) - 'created', 'phase_added', 'task_created', 'status_changed', etc
      - `user_id` (uuid)
      - `details` (jsonb)
      - `created_at` (timestamptz)

  2. Segurança
    - Enable RLS em todas as tabelas
    - Policies para authenticated users poderem:
      - Ver planejamentos da sua organização
      - Criar planejamentos
      - Editar planejamentos que criaram (ou se admin)
*/

-- Criar tabela de planejamentos
CREATE TABLE IF NOT EXISTS plannings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('ai_generated', 'imported_pdf', 'imported_docx', 'imported_txt', 'imported_md', 'manual')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'under_review', 'completed', 'archived')),
  organization_id uuid,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
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
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  color text DEFAULT '#3b82f6',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de tarefas vinculadas
CREATE TABLE IF NOT EXISTS planning_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES planning_phases(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  module_type text NOT NULL CHECK (module_type IN ('content', 'shows', 'communication', 'analysis', 'kpis', 'finance', 'general')),
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
CREATE INDEX IF NOT EXISTS idx_plannings_organization ON plannings(organization_id);
CREATE INDEX IF NOT EXISTS idx_plannings_created_by ON plannings(created_by);
CREATE INDEX IF NOT EXISTS idx_plannings_status ON plannings(status);
CREATE INDEX IF NOT EXISTS idx_planning_phases_planning ON planning_phases(planning_id);
CREATE INDEX IF NOT EXISTS idx_planning_phases_order ON planning_phases(planning_id, order_index);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_phase ON planning_tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_planning_tasks_task ON planning_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_planning_logs_planning ON planning_logs(planning_id);

-- Enable Row Level Security
ALTER TABLE plannings ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para plannings
CREATE POLICY "Users can view plannings from their organization"
  ON plannings FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create plannings"
  ON plannings FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own plannings"
  ON plannings FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own plannings"
  ON plannings FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies para planning_phases
CREATE POLICY "Users can view phases from their organization plannings"
  ON planning_phases FOR SELECT
  TO authenticated
  USING (
    planning_id IN (
      SELECT id FROM plannings WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create phases"
  ON planning_phases FOR INSERT
  TO authenticated
  WITH CHECK (
    planning_id IN (
      SELECT id FROM plannings WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update phases"
  ON planning_phases FOR UPDATE
  TO authenticated
  USING (
    planning_id IN (
      SELECT id FROM plannings WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete phases"
  ON planning_phases FOR DELETE
  TO authenticated
  USING (
    planning_id IN (
      SELECT id FROM plannings WHERE created_by = auth.uid()
    )
  );

-- RLS Policies para planning_tasks
CREATE POLICY "Users can view planning tasks"
  ON planning_tasks FOR SELECT
  TO authenticated
  USING (
    phase_id IN (
      SELECT id FROM planning_phases WHERE planning_id IN (
        SELECT id FROM plannings WHERE organization_id IN (
          SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create planning tasks"
  ON planning_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    phase_id IN (
      SELECT id FROM planning_phases WHERE planning_id IN (
        SELECT id FROM plannings WHERE created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete planning tasks"
  ON planning_tasks FOR DELETE
  TO authenticated
  USING (
    phase_id IN (
      SELECT id FROM planning_phases WHERE planning_id IN (
        SELECT id FROM plannings WHERE created_by = auth.uid()
      )
    )
  );

-- RLS Policies para planning_logs
CREATE POLICY "Users can view logs from their organization plannings"
  ON planning_logs FOR SELECT
  TO authenticated
  USING (
    planning_id IN (
      SELECT id FROM plannings WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can create logs"
  ON planning_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_planning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_plannings_updated_at ON plannings;
CREATE TRIGGER update_plannings_updated_at
  BEFORE UPDATE ON plannings
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_updated_at();

-- Função helper para criar log de auditoria
CREATE OR REPLACE FUNCTION create_planning_log(
  p_planning_id uuid,
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO planning_logs (planning_id, action, user_id, details)
  VALUES (p_planning_id, p_action, auth.uid(), p_details)
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
