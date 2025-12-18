/*
  # Create Shows Management System

  1. New Tables
    - `shows`
      - `id` (uuid, primary key)
      - `title` (text) - nome do show
      - `artist_name` (text) - nome do artista
      - `show_date` (date) - data do show
      - `show_time` (time) - horário do show
      - `venue` (text) - local/casa de show
      - `city` (text) - cidade
      - `state` (text) - estado
      - `country` (text) - país
      - `contractor_name` (text) - nome do contratante
      - `contractor_contact` (text) - contato do contratante
      - `value` (numeric) - valor do cachê
      - `currency` (text) - moeda
      - `status` (text) - consultado, proposto, fechado, pago
      - `notes` (text) - observações
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `show_contracts`
      - `id` (uuid, primary key)
      - `show_id` (uuid, references shows)
      - `file_url` (text) - URL do contrato no storage
      - `file_name` (text) - nome original do arquivo
      - `file_size` (bigint) - tamanho do arquivo
      - `signed_at` (timestamptz) - data de assinatura
      - `uploaded_by` (uuid, references auth.users)
      - `uploaded_at` (timestamptz)

    - `show_tasks`
      - `id` (uuid, primary key)
      - `show_id` (uuid, references shows)
      - `title` (text) - título da tarefa
      - `description` (text) - descrição
      - `status` (text) - pending, in_progress, completed
      - `due_date` (date) - prazo
      - `assigned_to` (uuid, references auth.users)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can manage shows they created
    - Users can view shows they have access to

  3. Indexes
    - Optimized for queries by date, status, and artist
*/

-- Create shows table
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_name text NOT NULL,
  show_date date NOT NULL,
  show_time time,
  venue text,
  city text NOT NULL,
  state text,
  country text DEFAULT 'Brasil',
  contractor_name text,
  contractor_contact text,
  value numeric(10, 2),
  currency text DEFAULT 'BRL',
  status text NOT NULL DEFAULT 'consultado',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('consultado', 'proposto', 'fechado', 'pago'))
);

-- Create show_contracts table
CREATE TABLE IF NOT EXISTS show_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  signed_at timestamptz,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create show_tasks table
CREATE TABLE IF NOT EXISTS show_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT valid_task_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shows_created_by ON shows(created_by);
CREATE INDEX IF NOT EXISTS idx_shows_show_date ON shows(show_date);
CREATE INDEX IF NOT EXISTS idx_shows_status ON shows(status);
CREATE INDEX IF NOT EXISTS idx_shows_artist ON shows(artist_name);
CREATE INDEX IF NOT EXISTS idx_show_contracts_show_id ON show_contracts(show_id);
CREATE INDEX IF NOT EXISTS idx_show_tasks_show_id ON show_tasks(show_id);
CREATE INDEX IF NOT EXISTS idx_show_tasks_status ON show_tasks(status);

-- Enable Row Level Security
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shows
CREATE POLICY "Users can view their own shows"
  ON shows FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own shows"
  ON shows FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own shows"
  ON shows FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own shows"
  ON shows FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for show_contracts
CREATE POLICY "Users can view contracts of their shows"
  ON show_contracts FOR SELECT
  TO authenticated
  USING (
    show_id IN (
      SELECT id FROM shows WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert contracts to their shows"
  ON show_contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    show_id IN (
      SELECT id FROM shows WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete contracts from their shows"
  ON show_contracts FOR DELETE
  TO authenticated
  USING (
    show_id IN (
      SELECT id FROM shows WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for show_tasks
CREATE POLICY "Users can view tasks of their shows"
  ON show_tasks FOR SELECT
  TO authenticated
  USING (
    show_id IN (
      SELECT id FROM shows WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks to their shows"
  ON show_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    show_id IN (
      SELECT id FROM shows WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of their shows"
  ON show_tasks FOR UPDATE
  TO authenticated
  USING (
    show_id IN (
      SELECT id FROM shows WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    show_id IN (
      SELECT id FROM shows WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks from their shows"
  ON show_tasks FOR DELETE
  TO authenticated
  USING (
    show_id IN (
      SELECT id FROM shows WHERE created_by = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON shows
  FOR EACH ROW
  EXECUTE FUNCTION update_shows_updated_at();
