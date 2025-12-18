/*
  # Sistema de Produção Musical Completo

  ## Visão Geral
  Sistema completo para gestão de repertório, arranjos, ensaios, setlists e shows
  com suporte a modo palco offline e aprovações integradas.

  ## Tabelas Criadas

  ### Músicas e Repertório
  - `songs` - Biblioteca de músicas com metadados (tom, BPM, compasso, estrutura)
  - `song_assets` - Arquivos anexados (PDF, MusicXML, MIDI, áudio) com versionamento
  - `arrangements` - Arranjos e versões com aprovação
  - `parts` - Partes individuais por instrumento com transposição

  ### Ensaios
  - `rehearsals` - Agendamento de ensaios com pauta e materiais
  - `rehearsal_attendance` - Controle de presença

  ### Shows e Setlists
  - `setlists` - Setlists de shows com trava D-1
  - `setlist_items` - Músicas do setlist com ordem e configurações
  - `stage_docs` - Documentos técnicos (stage plot, patch list, mic map)
  - `show_access_tokens` - Tokens de acesso para músicos via QR code

  ### Músicos
  - `musician_profiles` - Perfis de músicos com preferências de transposição

  ### Aprovações
  - `music_approvals` - Sistema de aprovação para arranjos, partes e setlists

  ## Segurança
  - RLS ativado em todas as tabelas
  - Políticas por organização/artista
  - Controle de acesso por papel (músico vê apenas o necessário)
*/

-- Songs (Repertório)
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  artist_name text,
  original_key text,
  bpm integer,
  time_signature text DEFAULT '4/4',
  structure jsonb DEFAULT '[]'::jsonb,
  lyrics text,
  chords text,
  notes text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
  genre text,
  duration_seconds integer,
  language text DEFAULT 'pt',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_songs_org ON songs(organization_id);
CREATE INDEX IF NOT EXISTS idx_songs_status ON songs(status);

-- Song Assets (PDFs, MusicXML, MIDI, Audio)
CREATE TABLE IF NOT EXISTS song_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('pdf', 'musicxml', 'midi', 'audio', 'video', 'other')),
  name text NOT NULL,
  url text NOT NULL,
  size_bytes bigint,
  version integer DEFAULT 1,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_song_assets_song ON song_assets(song_id);
CREATE INDEX IF NOT EXISTS idx_song_assets_type ON song_assets(type);

-- Arrangements (Arranjos)
CREATE TABLE IF NOT EXISTS arrangements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  arranger_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  version integer DEFAULT 1,
  title text NOT NULL,
  description text,
  notes text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'rejected', 'archived')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_reason text,
  is_current boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arrangements_song ON arrangements(song_id);
CREATE INDEX IF NOT EXISTS idx_arrangements_status ON arrangements(status);
CREATE INDEX IF NOT EXISTS idx_arrangements_current ON arrangements(is_current);

-- Parts (Partes por Instrumento)
CREATE TABLE IF NOT EXISTS parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arrangement_id uuid REFERENCES arrangements(id) ON DELETE CASCADE NOT NULL,
  instrument text NOT NULL,
  transpose_semitones integer DEFAULT 0,
  clef text DEFAULT 'treble' CHECK (clef IN ('treble', 'bass', 'alto', 'tenor')),
  url_pdf text,
  url_musicxml text,
  url_midi text,
  version integer DEFAULT 1,
  notes text,
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parts_arrangement ON parts(arrangement_id);
CREATE INDEX IF NOT EXISTS idx_parts_instrument ON parts(instrument);

-- Rehearsals (Ensaios)
CREATE TABLE IF NOT EXISTS rehearsals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  date_time timestamptz NOT NULL,
  duration_minutes integer DEFAULT 120,
  location text,
  agenda jsonb DEFAULT '[]'::jsonb,
  attachments jsonb DEFAULT '[]'::jsonb,
  notes text,
  post_notes text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rehearsals_artist ON rehearsals(artist_id);
CREATE INDEX IF NOT EXISTS idx_rehearsals_project ON rehearsals(project_id);
CREATE INDEX IF NOT EXISTS idx_rehearsals_org ON rehearsals(organization_id);
CREATE INDEX IF NOT EXISTS idx_rehearsals_datetime ON rehearsals(date_time);

-- Rehearsal Attendance (Presença)
CREATE TABLE IF NOT EXISTS rehearsal_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rehearsal_id uuid REFERENCES rehearsals(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'present', 'absent', 'late')),
  notes text,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(rehearsal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_rehearsal ON rehearsal_attendance(rehearsal_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON rehearsal_attendance(user_id);

-- Setlists
CREATE TABLE IF NOT EXISTS setlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  show_date timestamptz,
  venue text,
  locked boolean DEFAULT false,
  locked_at timestamptz,
  locked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_duration_minutes integer DEFAULT 0,
  notes text,
  technical_notes text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'locked', 'archived')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_setlists_show ON setlists(show_id);
CREATE INDEX IF NOT EXISTS idx_setlists_artist ON setlists(artist_id);
CREATE INDEX IF NOT EXISTS idx_setlists_org ON setlists(organization_id);
CREATE INDEX IF NOT EXISTS idx_setlists_date ON setlists(show_date);
CREATE INDEX IF NOT EXISTS idx_setlists_locked ON setlists(locked);

-- Setlist Items
CREATE TABLE IF NOT EXISTS setlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id uuid REFERENCES setlists(id) ON DELETE CASCADE NOT NULL,
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  position integer NOT NULL,
  key_override text,
  tempo_override integer,
  arrangement_id uuid REFERENCES arrangements(id) ON DELETE SET NULL,
  cues text,
  notes text,
  estimated_duration_seconds integer,
  segue_to_next boolean DEFAULT false,
  is_encore boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(setlist_id, position)
);

CREATE INDEX IF NOT EXISTS idx_setlist_items_setlist ON setlist_items(setlist_id);
CREATE INDEX IF NOT EXISTS idx_setlist_items_song ON setlist_items(song_id);
CREATE INDEX IF NOT EXISTS idx_setlist_items_position ON setlist_items(setlist_id, position);

-- Stage Documents (Stage Plot, Patch List, Mic Map)
CREATE TABLE IF NOT EXISTS stage_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  setlist_id uuid REFERENCES setlists(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  stage_plot_url text,
  patch_list_url text,
  mic_map_url text,
  tech_rider_url text,
  input_list jsonb DEFAULT '[]'::jsonb,
  technical_notes text,
  version integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stage_docs_show ON stage_docs(show_id);
CREATE INDEX IF NOT EXISTS idx_stage_docs_setlist ON stage_docs(setlist_id);

-- Musician Profiles
CREATE TABLE IF NOT EXISTS musician_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  instrument text NOT NULL,
  secondary_instruments text[] DEFAULT ARRAY[]::text[],
  transposition_preference integer DEFAULT 0,
  preferred_clef text DEFAULT 'treble',
  preferred_key_view text DEFAULT 'sharps',
  chart_notation_preference text DEFAULT 'standard' CHECK (chart_notation_preference IN ('standard', 'nashville', 'leadsheet', 'tabs')),
  language text DEFAULT 'pt',
  bio text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_musician_profiles_user ON musician_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_musician_profiles_org ON musician_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_musician_profiles_instrument ON musician_profiles(instrument);

-- Show Access Tokens (QR Code Access)
CREATE TABLE IF NOT EXISTS show_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  setlist_id uuid REFERENCES setlists(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,
  token text UNIQUE NOT NULL,
  qr_code_url text,
  expires_at timestamptz NOT NULL,
  max_uses integer DEFAULT 1,
  use_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_tokens_setlist ON show_access_tokens(setlist_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_user ON show_access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON show_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_access_tokens_expires ON show_access_tokens(expires_at);

-- Music Approvals
CREATE TABLE IF NOT EXISTS music_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  entity_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('arrangement', 'part', 'setlist', 'song', 'asset')),
  required_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  required_role text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_reason text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  due_date timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_music_approvals_entity ON music_approvals(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_music_approvals_org ON music_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_music_approvals_status ON music_approvals(status);
CREATE INDEX IF NOT EXISTS idx_music_approvals_required ON music_approvals(required_by);

-- Enable RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsals ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsal_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE musician_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Songs
CREATE POLICY "Users can view songs in their organization"
  ON songs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create songs in their organization"
  ON songs FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update songs in their organization"
  ON songs FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete songs in their organization"
  ON songs FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Song Assets
CREATE POLICY "Users can view song assets in their organization"
  ON song_assets FOR SELECT
  TO authenticated
  USING (
    song_id IN (
      SELECT id FROM songs WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create song assets"
  ON song_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    song_id IN (
      SELECT id FROM songs WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own song assets"
  ON song_assets FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own song assets"
  ON song_assets FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- RLS Policies for Arrangements
CREATE POLICY "Users can view arrangements in their organization"
  ON arrangements FOR SELECT
  TO authenticated
  USING (
    song_id IN (
      SELECT id FROM songs WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create arrangements"
  ON arrangements FOR INSERT
  TO authenticated
  WITH CHECK (
    song_id IN (
      SELECT id FROM songs WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update arrangements"
  ON arrangements FOR UPDATE
  TO authenticated
  USING (
    song_id IN (
      SELECT id FROM songs WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete arrangements"
  ON arrangements FOR DELETE
  TO authenticated
  USING (
    song_id IN (
      SELECT id FROM songs WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for Parts
CREATE POLICY "Users can view parts in their organization"
  ON parts FOR SELECT
  TO authenticated
  USING (
    arrangement_id IN (
      SELECT a.id FROM arrangements a
      JOIN songs s ON a.song_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create parts"
  ON parts FOR INSERT
  TO authenticated
  WITH CHECK (
    arrangement_id IN (
      SELECT a.id FROM arrangements a
      JOIN songs s ON a.song_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update parts"
  ON parts FOR UPDATE
  TO authenticated
  USING (
    arrangement_id IN (
      SELECT a.id FROM arrangements a
      JOIN songs s ON a.song_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete parts"
  ON parts FOR DELETE
  TO authenticated
  USING (
    arrangement_id IN (
      SELECT a.id FROM arrangements a
      JOIN songs s ON a.song_id = s.id
      WHERE s.organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for Rehearsals
CREATE POLICY "Users can view rehearsals in their organization"
  ON rehearsals FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create rehearsals"
  ON rehearsals FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rehearsals"
  ON rehearsals FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rehearsals"
  ON rehearsals FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for Attendance
CREATE POLICY "Users can view their own attendance"
  ON rehearsal_attendance FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    rehearsal_id IN (
      SELECT id FROM rehearsals WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create attendance"
  ON rehearsal_attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    rehearsal_id IN (
      SELECT id FROM rehearsals WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own attendance"
  ON rehearsal_attendance FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for Setlists
CREATE POLICY "Users can view setlists in their organization"
  ON setlists FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create setlists"
  ON setlists FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update unlocked setlists"
  ON setlists FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own setlists"
  ON setlists FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND locked = false);

-- RLS Policies for Setlist Items
CREATE POLICY "Users can view setlist items"
  ON setlist_items FOR SELECT
  TO authenticated
  USING (
    setlist_id IN (
      SELECT id FROM setlists WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage setlist items"
  ON setlist_items FOR ALL
  TO authenticated
  USING (
    setlist_id IN (
      SELECT id FROM setlists WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      ) AND locked = false
    )
  );

-- RLS Policies for Stage Docs
CREATE POLICY "Users can view stage docs in their organization"
  ON stage_docs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage stage docs"
  ON stage_docs FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Musician Profiles
CREATE POLICY "Users can view musician profiles in their organization"
  ON musician_profiles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own musician profile"
  ON musician_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for Access Tokens
CREATE POLICY "Users can view own access tokens"
  ON show_access_tokens FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    setlist_id IN (
      SELECT id FROM setlists WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage access tokens"
  ON show_access_tokens FOR ALL
  TO authenticated
  USING (
    setlist_id IN (
      SELECT id FROM setlists WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for Music Approvals
CREATE POLICY "Users can view approvals in their organization"
  ON music_approvals FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create approvals"
  ON music_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update approvals"
  ON music_approvals FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_music_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER songs_updated_at BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

CREATE TRIGGER arrangements_updated_at BEFORE UPDATE ON arrangements
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

CREATE TRIGGER parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

CREATE TRIGGER rehearsals_updated_at BEFORE UPDATE ON rehearsals
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

CREATE TRIGGER setlists_updated_at BEFORE UPDATE ON setlists
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

CREATE TRIGGER stage_docs_updated_at BEFORE UPDATE ON stage_docs
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

CREATE TRIGGER musician_profiles_updated_at BEFORE UPDATE ON musician_profiles
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();

CREATE TRIGGER music_approvals_updated_at BEFORE UPDATE ON music_approvals
  FOR EACH ROW EXECUTE FUNCTION update_music_updated_at();
