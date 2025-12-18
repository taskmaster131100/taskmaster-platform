/*
  # Create Musical Releases Management System

  1. New Tables
    - `releases`
      - `id` (uuid, primary key)
      - `title` (text) - nome do lançamento
      - `artist_name` (text) - nome do artista
      - `release_type` (text) - single, ep, album, remix, live
      - `release_date` (date) - data de lançamento
      - `isrc` (text) - código ISRC
      - `upc` (text) - código UPC/EAN
      - `distributor` (text) - distribuidora
      - `cover_url` (text) - URL da capa
      - `status` (text) - pre_production, production, mixing, mastering, distribution, released
      - `notes` (text) - observações
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `release_phases`
      - `id` (uuid, primary key)
      - `release_id` (uuid, references releases)
      - `name` (text) - nome da fase
      - `description` (text) - descrição
      - `order_index` (int) - ordem da fase
      - `start_date` (date) - data de início
      - `end_date` (date) - data de término
      - `status` (text) - pending, in_progress, completed
      - `color` (text) - cor para visualização
      - `created_at` (timestamptz)

    - `release_attachments`
      - `id` (uuid, primary key)
      - `release_id` (uuid, references releases)
      - `file_type` (text) - cover, press_kit, track, document
      - `file_url` (text) - URL do arquivo
      - `file_name` (text) - nome original
      - `file_size` (bigint) - tamanho
      - `uploaded_by` (uuid, references auth.users)
      - `uploaded_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can manage their own releases

  3. Release Types
    - single: Single
    - ep: EP
    - album: Álbum
    - remix: Remix
    - live: Ao Vivo
*/

-- Create releases table
CREATE TABLE IF NOT EXISTS releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_name text NOT NULL,
  release_type text NOT NULL,
  release_date date NOT NULL,
  isrc text,
  upc text,
  distributor text,
  cover_url text,
  status text NOT NULL DEFAULT 'pre_production',
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_release_type CHECK (release_type IN ('single', 'ep', 'album', 'remix', 'live')),
  CONSTRAINT valid_status CHECK (status IN ('pre_production', 'production', 'mixing', 'mastering', 'distribution', 'released'))
);

-- Create release_phases table
CREATE TABLE IF NOT EXISTS release_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES releases(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  order_index int NOT NULL,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'pending',
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_phase_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Create release_attachments table
CREATE TABLE IF NOT EXISTS release_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES releases(id) ON DELETE CASCADE NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now(),
  CONSTRAINT valid_file_type CHECK (file_type IN ('cover', 'press_kit', 'track', 'document'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_releases_created_by ON releases(created_by);
CREATE INDEX IF NOT EXISTS idx_releases_release_date ON releases(release_date);
CREATE INDEX IF NOT EXISTS idx_releases_status ON releases(status);
CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist_name);
CREATE INDEX IF NOT EXISTS idx_release_phases_release_id ON release_phases(release_id);
CREATE INDEX IF NOT EXISTS idx_release_phases_order ON release_phases(order_index);
CREATE INDEX IF NOT EXISTS idx_release_attachments_release_id ON release_attachments(release_id);

-- Enable Row Level Security
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE release_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for releases
CREATE POLICY "Users can view their own releases"
  ON releases FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own releases"
  ON releases FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own releases"
  ON releases FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own releases"
  ON releases FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for release_phases
CREATE POLICY "Users can view phases of their releases"
  ON release_phases FOR SELECT
  TO authenticated
  USING (
    release_id IN (
      SELECT id FROM releases WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert phases to their releases"
  ON release_phases FOR INSERT
  TO authenticated
  WITH CHECK (
    release_id IN (
      SELECT id FROM releases WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update phases of their releases"
  ON release_phases FOR UPDATE
  TO authenticated
  USING (
    release_id IN (
      SELECT id FROM releases WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    release_id IN (
      SELECT id FROM releases WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete phases from their releases"
  ON release_phases FOR DELETE
  TO authenticated
  USING (
    release_id IN (
      SELECT id FROM releases WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for release_attachments
CREATE POLICY "Users can view attachments of their releases"
  ON release_attachments FOR SELECT
  TO authenticated
  USING (
    release_id IN (
      SELECT id FROM releases WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments to their releases"
  ON release_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    release_id IN (
      SELECT id FROM releases WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete attachments from their releases"
  ON release_attachments FOR DELETE
  TO authenticated
  USING (
    release_id IN (
      SELECT id FROM releases WHERE created_by = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_releases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_releases_updated_at
  BEFORE UPDATE ON releases
  FOR EACH ROW
  EXECUTE FUNCTION update_releases_updated_at();
