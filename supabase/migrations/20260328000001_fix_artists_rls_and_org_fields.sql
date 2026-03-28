/*
  # Fix: Artists RLS + Organization profile fields

  1. Garante que a tabela artists tem organization_id
  2. Habilita RLS na tabela artists
  3. Cria policies de acesso por organização
  4. Garante campos de perfil na tabela organizations (idempotente)
*/

-- ─── ORGANIZATIONS: garantir campos de perfil ──────────────────────────────
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS address     text,
  ADD COLUMN IF NOT EXISTS website     text,
  ADD COLUMN IF NOT EXISTS logo_url    text;

-- ─── ARTISTS: garantir coluna organization_id ──────────────────────────────
ALTER TABLE artists
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- Índice para performance nas queries por org
CREATE INDEX IF NOT EXISTS artists_organization_id_idx ON artists(organization_id);

-- ─── ARTISTS: habilitar RLS ────────────────────────────────────────────────
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "artists_select_own_org" ON artists;
DROP POLICY IF EXISTS "artists_insert_own_org" ON artists;
DROP POLICY IF EXISTS "artists_update_own_org" ON artists;
DROP POLICY IF EXISTS "artists_delete_own_org" ON artists;

-- Policy: SELECT — usuário vê só artistas da sua organização
CREATE POLICY "artists_select_own_org" ON artists
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: INSERT — usuário insere artistas na sua organização
CREATE POLICY "artists_insert_own_org" ON artists
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: UPDATE — usuário edita artistas da sua organização
CREATE POLICY "artists_update_own_org" ON artists
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: DELETE — usuário remove artistas da sua organização
CREATE POLICY "artists_delete_own_org" ON artists
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- ─── ARTISTS existentes sem org: sem user_id na tabela, nada a migrar ──────
-- Artistas criados antes do RLS precisam ser associados manualmente via app
