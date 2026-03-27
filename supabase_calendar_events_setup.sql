-- ============================================================
-- TASKMASTER — Setup da tabela calendar_events
-- Rodar no Supabase SQL Editor se a tabela não existir
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  event_type TEXT DEFAULT 'event',  -- task | meeting | event | show | deadline | planning
  color TEXT DEFAULT 'blue',
  location TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read calendar events"
  ON calendar_events FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS "Users can insert calendar events"
  ON calendar_events FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can update own calendar events"
  ON calendar_events FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY IF NOT EXISTS "Users can delete own calendar events"
  ON calendar_events FOR DELETE USING (auth.uid() = created_by);

-- Índice para filtragem por data (usado pelo CalendarView)
CREATE INDEX IF NOT EXISTS idx_calendar_events_date
  ON calendar_events (event_date, event_type);

-- Índice para filtro por metadata (usado por show e release delete/update)
CREATE INDEX IF NOT EXISTS idx_calendar_events_metadata
  ON calendar_events USING GIN (metadata);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calendar_events_updated_at ON calendar_events;
CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_calendar_events_updated_at();
