/*
  # Create AI Text Generation System

  1. New Tables
    - `ai_generations`
      - `id` (uuid, primary key)
      - `generation_type` (text) - type of content (copywriting, press_release, bio, script, email, strategy)
      - `prompt` (text) - user's input/briefing
      - `result` (text) - AI generated content
      - `model` (text) - AI model used
      - `context` (jsonb) - additional context (artist_id, event_id, etc.)
      - `created_by` (uuid, references auth.users) - user who generated
      - `created_at` (timestamptz) - generation timestamp

  2. Security
    - Enable RLS on `ai_generations` table
    - Add policies for authenticated users to manage their own generations

  3. Generation Types
    - copywriting: Posts, ads, captions
    - press_release: Launch announcements
    - bio: Artist biographies
    - script: Videos, podcasts
    - email: Email marketing
    - strategy: Planning strategies
*/

-- Create ai_generations table
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_type text NOT NULL,
  prompt text NOT NULL,
  result text NOT NULL,
  model text NOT NULL DEFAULT 'gpt-4o-mini',
  context jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_by ON ai_generations(created_by);
CREATE INDEX IF NOT EXISTS idx_ai_generations_type ON ai_generations(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_generations_created_at ON ai_generations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own generations
CREATE POLICY "Users can view their own generations"
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Policy: Users can insert their own generations
CREATE POLICY "Users can insert their own generations"
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Policy: Users can delete their own generations
CREATE POLICY "Users can delete their own generations"
  ON ai_generations
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
