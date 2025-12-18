/*
  # Create Content Workflow Management System

  1. New Tables
    - `content_posts`
      - `id` (uuid, primary key)
      - `title` (text) - título do conteúdo
      - `content` (text) - conteúdo/texto
      - `platform` (text) - instagram, tiktok, youtube, facebook, twitter, linkedin
      - `post_type` (text) - feed, story, reel, video, carousel
      - `status` (text) - draft, scheduled, published, cancelled
      - `scheduled_date` (timestamptz) - data agendada
      - `published_date` (timestamptz) - data de publicação
      - `media_urls` (jsonb) - URLs de mídia
      - `hashtags` (text[]) - hashtags
      - `mentions` (text[]) - mentions
      - `engagement_goal` (text) - objetivo de engajamento
      - `notes` (text) - observações
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `content_calendar`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references content_posts)
      - `calendar_date` (date) - data no calendário
      - `time_slot` (time) - horário
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can manage their own content

  3. Content Status Flow
    - draft: Rascunho
    - scheduled: Agendado
    - published: Publicado
    - cancelled: Cancelado
*/

-- Create content_posts table
CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  platform text NOT NULL,
  post_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  scheduled_date timestamptz,
  published_date timestamptz,
  media_urls jsonb DEFAULT '[]'::jsonb,
  hashtags text[] DEFAULT ARRAY[]::text[],
  mentions text[] DEFAULT ARRAY[]::text[],
  engagement_goal text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_platform CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'linkedin', 'threads')),
  CONSTRAINT valid_post_type CHECK (post_type IN ('feed', 'story', 'reel', 'video', 'carousel', 'tweet', 'short')),
  CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled'))
);

-- Create content_calendar table
CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES content_posts(id) ON DELETE CASCADE NOT NULL,
  calendar_date date NOT NULL,
  time_slot time,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_posts_created_by ON content_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON content_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_platform ON content_posts(platform);
CREATE INDEX IF NOT EXISTS idx_content_posts_scheduled_date ON content_posts(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(calendar_date);
CREATE INDEX IF NOT EXISTS idx_content_calendar_post_id ON content_calendar(post_id);

-- Enable Row Level Security
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_posts
CREATE POLICY "Users can view their own content"
  ON content_posts FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own content"
  ON content_posts FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own content"
  ON content_posts FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own content"
  ON content_posts FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for content_calendar
CREATE POLICY "Users can view calendar of their content"
  ON content_calendar FOR SELECT
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM content_posts WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert calendar for their content"
  ON content_calendar FOR INSERT
  TO authenticated
  WITH CHECK (
    post_id IN (
      SELECT id FROM content_posts WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update calendar of their content"
  ON content_calendar FOR UPDATE
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM content_posts WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    post_id IN (
      SELECT id FROM content_posts WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete calendar from their content"
  ON content_calendar FOR DELETE
  TO authenticated
  USING (
    post_id IN (
      SELECT id FROM content_posts WHERE created_by = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_content_posts_updated_at
  BEFORE UPDATE ON content_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_content_posts_updated_at();

-- Function to sync content to calendar_events
CREATE OR REPLACE FUNCTION sync_content_to_calendar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' AND NEW.scheduled_date IS NOT NULL THEN
    INSERT INTO calendar_events (
      title,
      description,
      event_date,
      event_type,
      color,
      created_by,
      metadata
    ) VALUES (
      'Publicação: ' || NEW.title,
      NEW.content,
      NEW.scheduled_date::date,
      'content',
      'pink',
      NEW.created_by,
      jsonb_build_object(
        'post_id', NEW.id,
        'platform', NEW.platform,
        'post_type', NEW.post_type
      )
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync content to calendar
CREATE TRIGGER sync_content_calendar
  AFTER INSERT OR UPDATE ON content_posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_content_to_calendar();
