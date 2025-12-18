/*
  # Create Planning Attachments System

  1. New Table
    - `planning_attachments` - Arquivos anexados aos planejamentos
      - Suporta .txt, .docx, .pdf, .md
      - Armazena resultado do processamento da IA
      - RLS para acesso restrito ao criador

  2. Security
    - Enable RLS
    - Only creators can view/manage their attachments
*/

-- Create planning_attachments table
CREATE TABLE IF NOT EXISTS planning_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid REFERENCES plannings(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('txt', 'docx', 'pdf', 'md')),
  file_content text, -- Texto extraído do arquivo
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  processed boolean DEFAULT false,
  processing_result jsonb, -- Resultado estruturado da IA
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE planning_attachments ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own attachments
CREATE POLICY "Users can view own attachments"
  ON planning_attachments FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can upload attachments"
  ON planning_attachments FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own attachments"
  ON planning_attachments FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own attachments"
  ON planning_attachments FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attachments_planning ON planning_attachments(planning_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user ON planning_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_processed ON planning_attachments(processed);

-- Updated_at trigger
CREATE TRIGGER update_planning_attachments_updated_at
  BEFORE UPDATE ON planning_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_updated_at();
