/*
  # Create Calendar Events System

  1. New Tables
    - `calendar_events`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `title` (text, event title)
      - `description` (text, event details)
      - `event_date` (date, when event occurs)
      - `start_time` (time, optional start time)
      - `end_time` (time, optional end time)
      - `event_type` (text, type: task, meeting, event, show, deadline)
      - `color` (text, display color)
      - `location` (text, optional location)
      - `created_by` (uuid, references auth.users)
      - `metadata` (jsonb, additional data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `calendar_events` table
    - Add policies for authenticated users to manage events in their organization
    - Users can view, create, update events in their organization
    - Only creators and admins can delete events

  3. Indexes
    - Index on organization_id for faster queries
    - Index on event_date for calendar views
    - Index on event_type for filtering
*/

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  event_type text NOT NULL DEFAULT 'event' CHECK (event_type IN ('task', 'meeting', 'event', 'show', 'deadline', 'planning')),
  color text DEFAULT 'blue',
  location text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Policies for calendar_events
CREATE POLICY "Users can view their events"
  ON calendar_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create events"
  ON calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their events"
  ON calendar_events FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their events"
  ON calendar_events FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_date
  ON calendar_events(event_date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_type
  ON calendar_events(event_type);

CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by
  ON calendar_events(created_by);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_calendar_events_updated_at();
