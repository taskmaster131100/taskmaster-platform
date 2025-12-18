/*
  # Create Tours Management System

  1. New Tables
    - `tours`
      - `id` (uuid, primary key)
      - `name` (text) - nome da turnê
      - `description` (text) - descrição
      - `start_date` (date) - data de início
      - `end_date` (date) - data de término
      - `status` (text) - planning, confirmed, in_progress, completed, cancelled
      - `total_shows` (int) - total de shows (calculado)
      - `total_revenue` (decimal) - receita total estimada
      - `poster_url` (text) - URL do poster da turnê
      - `notes` (text) - observações
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `tour_shows`
      - `id` (uuid, primary key)
      - `tour_id` (uuid, references tours)
      - `show_id` (uuid, references shows)
      - `order_index` (int) - ordem do show na turnê
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can manage their own tours

  3. Tour Status Flow
    - planning: Planejamento
    - confirmed: Confirmada
    - in_progress: Em andamento
    - completed: Finalizada
    - cancelled: Cancelada
*/

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  total_shows int DEFAULT 0,
  total_revenue decimal(12,2) DEFAULT 0,
  poster_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_tour_status CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Create tour_shows junction table
CREATE TABLE IF NOT EXISTS tour_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE NOT NULL,
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tour_id, show_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tours_created_by ON tours(created_by);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_dates ON tours(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_tour_shows_tour_id ON tour_shows(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_shows_show_id ON tour_shows(show_id);
CREATE INDEX IF NOT EXISTS idx_tour_shows_order ON tour_shows(tour_id, order_index);

-- Enable Row Level Security
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_shows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tours
CREATE POLICY "Users can view their own tours"
  ON tours FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own tours"
  ON tours FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own tours"
  ON tours FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own tours"
  ON tours FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for tour_shows
CREATE POLICY "Users can view tour_shows of their tours"
  ON tour_shows FOR SELECT
  TO authenticated
  USING (
    tour_id IN (
      SELECT id FROM tours WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert tour_shows to their tours"
  ON tour_shows FOR INSERT
  TO authenticated
  WITH CHECK (
    tour_id IN (
      SELECT id FROM tours WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update tour_shows of their tours"
  ON tour_shows FOR UPDATE
  TO authenticated
  USING (
    tour_id IN (
      SELECT id FROM tours WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    tour_id IN (
      SELECT id FROM tours WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete tour_shows from their tours"
  ON tour_shows FOR DELETE
  TO authenticated
  USING (
    tour_id IN (
      SELECT id FROM tours WHERE created_by = auth.uid()
    )
  );

-- Function to update tour stats
CREATE OR REPLACE FUNCTION update_tour_stats(p_tour_id uuid)
RETURNS void AS $$
DECLARE
  v_total_shows int;
  v_total_revenue decimal(12,2);
BEGIN
  SELECT 
    COUNT(ts.id),
    COALESCE(SUM(s.amount), 0)
  INTO v_total_shows, v_total_revenue
  FROM tour_shows ts
  LEFT JOIN shows s ON s.id = ts.show_id
  WHERE ts.tour_id = p_tour_id;

  UPDATE tours
  SET 
    total_shows = v_total_shows,
    total_revenue = v_total_revenue
  WHERE id = p_tour_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_tours_updated_at
  BEFORE UPDATE ON tours
  FOR EACH ROW
  EXECUTE FUNCTION update_tours_updated_at();

-- Trigger to update tour stats when shows are added/removed
CREATE OR REPLACE FUNCTION trigger_update_tour_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_tour_stats(OLD.tour_id);
    RETURN OLD;
  ELSE
    PERFORM update_tour_stats(NEW.tour_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tour_shows_stats_trigger
  AFTER INSERT OR DELETE ON tour_shows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_tour_stats();
