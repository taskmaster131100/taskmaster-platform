-- ============================================================
-- TASKMASTER — Setup da tabela notifications
-- Rodar no Supabase SQL Editor se a tabela não existir
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  reference_type TEXT,
  reference_id TEXT,
  priority TEXT DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own notifications"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Authenticated can insert notifications"
  ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, is_read, created_at DESC);

-- RPC usada pelo NotificationCenter para marcar como lida
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS void AS $$
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RPC usada pelo NotificationCenter para marcar todas como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS void AS $$
  UPDATE notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
$$ LANGUAGE sql SECURITY DEFINER;
