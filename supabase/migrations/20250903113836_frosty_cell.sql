/*
  # Sistema Beta - Códigos de Convite e Feedback

  1. Novas Tabelas
    - `invite_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique, 8 caracteres)
      - `created_by` (uuid, referência para auth.users)
      - `organization_id` (uuid, para multi-tenant)
      - `max_uses` (int, padrão 5)
      - `used_count` (int, padrão 0)
      - `expires_at` (timestamptz, opcional)
      - `created_at` (timestamptz, padrão now())
    
    - `feedback`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, para multi-tenant)
      - `user_id` (uuid, referência para auth.users)
      - `area` (text, área do feedback)
      - `severity` (text, low/med/high)
      - `message` (text, conteúdo do feedback)
      - `created_at` (timestamptz, padrão now())

  2. Segurança
    - Enable RLS em ambas as tabelas
    - Políticas para usuários autenticados
    - Service role com acesso total
    - Índices para performance

  3. Funcionalidades
    - Códigos únicos de convite
    - Controle de uso e expiração
    - Feedback categorizado
    - Sistema multi-organização
*/

-- Tabela de códigos de convite
CREATE TABLE IF NOT EXISTS invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid,
  max_uses int DEFAULT 5,
  used_count int DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_organization_id ON invite_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Enable RLS
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para invite_codes
CREATE POLICY "Service role can manage all invite codes"
  ON invite_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can create invite codes"
  ON invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view invite codes they created"
  ON invite_codes
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can update invite codes they created"
  ON invite_codes
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Tabela de feedback
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  area text, -- planejamento, tarefas, shows, etc.
  severity text CHECK (severity IN ('low', 'med', 'high')) DEFAULT 'low',
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feedback_organization_id ON feedback(organization_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_area ON feedback(area);
CREATE INDEX IF NOT EXISTS idx_feedback_severity ON feedback(severity);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para feedback
CREATE POLICY "Service role can manage all feedback"
  ON feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can create feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());