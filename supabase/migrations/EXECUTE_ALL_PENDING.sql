-- =====================================================
-- TASKMASTER - MIGRAÇÕES PENDENTES COMPLETAS
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. TABELA DE PROJETOS (NOVA - NÃO EXISTIA)
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  budget numeric(12,2) DEFAULT 0,
  color text DEFAULT '#3b82f6',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para projects
CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_artist ON projects(artist_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- RLS para projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projects in their organization"
  ON projects FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their organization"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their organization"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects in their organization"
  ON projects FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 2. TABELA DE TAREFAS (CRÍTICA)
-- =====================================================

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date timestamptz,
  estimated_hours numeric(6,2),
  actual_hours numeric(6,2),
  labels text[] DEFAULT '{}',
  order_index integer DEFAULT 0,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

-- RLS para tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their organization"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in their organization"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in their organization"
  ON tasks FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in their organization"
  ON tasks FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. SISTEMA DE PLANEAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS plannings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'manual' CHECK (type IN ('ai_generated', 'imported_pdf', 'imported_docx', 'imported_txt', 'imported_md', 'manual')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_prompt text,
  original_file_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS planning_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_id uuid NOT NULL REFERENCES plannings(id) ON DELETE CASCADE,
  action text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plannings_organization ON plannings(organization_id);
CREATE INDEX IF NOT EXISTS idx_plannings_created_by ON plannings(created_by);
CREATE INDEX IF NOT EXISTS idx_plannings_status ON plannings(status);
CREATE INDEX IF NOT EXISTS idx_planning_phases_planning ON planning_phases(planning_id);
CREATE INDEX IF NOT EXISTS idx_planning_logs_planning ON planning_logs(planning_id);

-- RLS
ALTER TABLE plannings ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plannings in their organization"
  ON plannings FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create plannings"
  ON plannings FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update plannings"
  ON plannings FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete plannings"
  ON plannings FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view planning phases"
  ON planning_phases FOR SELECT TO authenticated
  USING (planning_id IN (SELECT id FROM plannings WHERE organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage planning phases"
  ON planning_phases FOR ALL TO authenticated
  USING (planning_id IN (SELECT id FROM plannings WHERE organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can view planning logs"
  ON planning_logs FOR SELECT TO authenticated
  USING (planning_id IN (SELECT id FROM plannings WHERE organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can create planning logs"
  ON planning_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. EVENTOS DE CALENDÁRIO
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text DEFAULT 'event' CHECK (event_type IN ('event', 'meeting', 'deadline', 'reminder', 'show', 'release', 'rehearsal')),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  all_day boolean DEFAULT false,
  location text,
  color text DEFAULT '#3b82f6',
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recurrence_rule text,
  reminder_minutes integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_calendar_events_organization ON calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_project ON calendar_events(project_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_artist ON calendar_events(artist_id);

-- RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calendar events in their organization"
  ON calendar_events FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create calendar events"
  ON calendar_events FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update calendar events"
  ON calendar_events FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete calendar events"
  ON calendar_events FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

-- =====================================================
-- 5. BIBLIOTECA DE FICHEIROS
-- =====================================================

CREATE TABLE IF NOT EXISTS file_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  file_type text NOT NULL,
  file_size bigint,
  mime_type text,
  storage_path text NOT NULL,
  url text,
  folder_path text DEFAULT '/',
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_file_library_organization ON file_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_file_library_project ON file_library(project_id);
CREATE INDEX IF NOT EXISTS idx_file_library_folder ON file_library(folder_path);
CREATE INDEX IF NOT EXISTS idx_file_library_type ON file_library(file_type);

-- RLS
ALTER TABLE file_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view files in their organization"
  ON file_library FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can upload files"
  ON file_library FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update files"
  ON file_library FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete files"
  ON file_library FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

-- =====================================================
-- 6. SISTEMA DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'task', 'mention', 'reminder')),
  read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- =====================================================
-- 7. SISTEMA DE KPIs
-- =====================================================

CREATE TABLE IF NOT EXISTS kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('financial', 'engagement', 'productivity', 'growth', 'custom')),
  value numeric(15,2) NOT NULL DEFAULT 0,
  target numeric(15,2),
  unit text DEFAULT 'number',
  period text DEFAULT 'monthly' CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kpis_organization ON kpis(organization_id);
CREATE INDEX IF NOT EXISTS idx_kpis_category ON kpis(category);
CREATE INDEX IF NOT EXISTS idx_kpis_recorded ON kpis(recorded_at);
CREATE INDEX IF NOT EXISTS idx_kpis_artist ON kpis(artist_id);

-- RLS
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view KPIs in their organization"
  ON kpis FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create KPIs"
  ON kpis FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update KPIs"
  ON kpis FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete KPIs"
  ON kpis FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

-- =====================================================
-- 8. SISTEMA DE TURNÊS
-- =====================================================

CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  start_date date,
  end_date date,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  budget numeric(12,2) DEFAULT 0,
  actual_revenue numeric(12,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tour_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  show_id uuid REFERENCES shows(id) ON DELETE SET NULL,
  venue_name text NOT NULL,
  city text NOT NULL,
  country text DEFAULT 'Brasil',
  date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  fee numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tours_organization ON tours(organization_id);
CREATE INDEX IF NOT EXISTS idx_tours_artist ON tours(artist_id);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tour_dates_tour ON tour_dates(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_dates_date ON tour_dates(date);

-- RLS
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tours in their organization"
  ON tours FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage tours"
  ON tours FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can view tour dates"
  ON tour_dates FOR SELECT TO authenticated
  USING (tour_id IN (SELECT id FROM tours WHERE organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())));

CREATE POLICY "Users can manage tour dates"
  ON tour_dates FOR ALL TO authenticated
  USING (tour_id IN (SELECT id FROM tours WHERE organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid())));

-- =====================================================
-- 9. SISTEMA DE CONTEÚDO
-- =====================================================

CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'spotify', 'other')),
  post_type text DEFAULT 'post' CHECK (post_type IN ('post', 'story', 'reel', 'video', 'live', 'article')),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  media_urls text[] DEFAULT '{}',
  hashtags text[] DEFAULT '{}',
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_content_posts_organization ON content_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_artist ON content_posts(artist_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_platform ON content_posts(platform);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON content_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled ON content_posts(scheduled_at);

-- RLS
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view content in their organization"
  ON content_posts FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create content"
  ON content_posts FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can update content"
  ON content_posts FOR UPDATE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete content"
  ON content_posts FOR DELETE TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

-- =====================================================
-- 10. SISTEMA DE IA (Gerações de Texto)
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  result text,
  model text DEFAULT 'gpt-4',
  generation_type text DEFAULT 'text' CHECK (generation_type IN ('text', 'bio', 'press_release', 'social_post', 'email', 'lyrics', 'other')),
  tokens_used integer DEFAULT 0,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_generations_organization ON ai_generations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created ON ai_generations(created_at DESC);

-- RLS
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI generations in their organization"
  ON ai_generations FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

CREATE POLICY "Users can create AI generations"
  ON ai_generations FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

-- =====================================================
-- 11. PERFIS DE UTILIZADOR
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  job_title text,
  bio text,
  timezone text DEFAULT 'America/Sao_Paulo',
  language text DEFAULT 'pt-BR',
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT unnest(ARRAY['projects', 'tasks', 'plannings', 'calendar_events', 'file_library', 'tours', 'content_posts', 'user_profiles'])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- =====================================================
-- FIM DAS MIGRAÇÕES
-- =====================================================

SELECT 'Todas as migrações foram executadas com sucesso!' as status;
