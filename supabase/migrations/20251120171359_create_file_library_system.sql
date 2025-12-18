/*
  # Create File Library System

  1. New Tables
    - `file_library`
      - `id` (uuid, primary key)
      - `file_name` (text) - original file name
      - `file_url` (text) - Supabase Storage URL
      - `file_type` (text) - MIME type
      - `file_size` (bigint) - size in bytes
      - `category` (text) - file category for organization
      - `linked_to_type` (text, nullable) - type of linked entity (show, release, song, planning)
      - `linked_to_id` (uuid, nullable) - ID of linked entity
      - `tags` (text[], nullable) - searchable tags
      - `description` (text, nullable) - file description
      - `uploaded_by` (uuid, references auth.users) - user who uploaded
      - `uploaded_at` (timestamptz) - upload timestamp
      - `updated_at` (timestamptz) - last update timestamp

  2. Security
    - Enable RLS on `file_library` table
    - Add policies for authenticated users to manage their own files

  3. Categories
    - contratos, letras, cifras, partituras, press_kit, fotos, logos, riders, documentos, outros

  4. Storage
    - Storage bucket 'files' for file uploads
    - Path structure: {user_id}/{category}/{filename}
*/

-- Create file_library table
CREATE TABLE IF NOT EXISTS file_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  linked_to_type text,
  linked_to_id uuid,
  tags text[],
  description text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_file_library_category ON file_library(category);
CREATE INDEX IF NOT EXISTS idx_file_library_linked ON file_library(linked_to_type, linked_to_id);
CREATE INDEX IF NOT EXISTS idx_file_library_uploaded_by ON file_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_library_tags ON file_library USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_file_library_uploaded_at ON file_library(uploaded_at DESC);

-- Enable Row Level Security
ALTER TABLE file_library ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own files
CREATE POLICY "Users can view their own files"
  ON file_library
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Policy: Users can insert their own files
CREATE POLICY "Users can insert their own files"
  ON file_library
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can update their own files
CREATE POLICY "Users can update their own files"
  ON file_library
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their own files"
  ON file_library
  FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_file_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_file_library_updated_at
  BEFORE UPDATE ON file_library
  FOR EACH ROW
  EXECUTE FUNCTION update_file_library_updated_at();
