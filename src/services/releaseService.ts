import { supabase } from '../lib/supabase';

// ── Tipos alinhados ao schema real do banco ───────────────────────────────────
export type ReleaseType = 'single' | 'ep' | 'album' | 'remix' | 'live';
export type ReleaseStatus = 'pre_production' | 'production' | 'mixing' | 'mastering' | 'distribution' | 'released';
export type PhaseStatus = 'pending' | 'in_progress' | 'completed';
export type FileType = 'cover' | 'press_kit' | 'track' | 'document';

export type PlaylistPitchStatus = 'not_sent' | 'sent' | 'in_analysis' | 'approved' | 'rejected';

export interface Release {
  id: string;
  title: string;
  // artist
  artist_id?: string;
  artist_name: string;  // derivado do join
  // release
  release_type: ReleaseType;
  release_date: string;
  // campos do banco real
  upc?: string;
  label?: string;       // distribuidora
  distributor?: string; // alias de label
  catalog_number?: string;
  cover_art_url?: string;
  cover_url?: string;   // alias
  release_notes?: string;
  notes?: string;       // alias de release_notes
  status: ReleaseStatus;
  organization_id?: string;
  org_id?: string;
  isrc?: string;
  // campos operacionais adicionais
  presave_link?: string;
  playlist_pitch_status?: PlaylistPitchStatus;
  budget?: number;
  cover_art_status?: 'pending' | 'ready' | 'approved';
  created_at: string;
  updated_at: string;
}

// ReleasePhase ainda não existe no banco — mantemos interface para compatibilidade
export interface ReleasePhase {
  id: string;
  release_id: string;
  name: string;
  description?: string;
  order_index: number;
  start_date?: string;
  end_date?: string;
  status: PhaseStatus;
  color: string;
  created_at: string;
}

export interface ReleaseAttachment {
  id: string;
  release_id: string;
  file_type: FileType;
  file_url: string;
  file_name: string;
  file_size: number;
  uploaded_by?: string;
  uploaded_at: string;
}

export const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'ep',     label: 'EP' },
  { value: 'album',  label: 'Álbum' },
  { value: 'remix',  label: 'Remix' },
  { value: 'live',   label: 'Ao Vivo' },
];

export const RELEASE_STATUSES: { value: ReleaseStatus; label: string; color: string }[] = [
  { value: 'pre_production', label: 'Pré-produção',  color: 'gray' },
  { value: 'production',     label: 'Produção',      color: 'blue' },
  { value: 'mixing',         label: 'Mixagem',       color: 'yellow' },
  { value: 'mastering',      label: 'Masterização',  color: 'orange' },
  { value: 'distribution',   label: 'Distribuição',  color: 'green' },
  { value: 'released',       label: 'Lançado',       color: 'purple' },
];

// ── Helpers internos ──────────────────────────────────────────────────────────

async function getUserOrgId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const { data } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data?.organization_id) throw new Error('Organização não encontrada');
  return data.organization_id;
}

async function resolveArtistId(artistName?: string, artistId?: string): Promise<string | null> {
  if (artistId) return artistId;
  if (!artistName) return null;
  const { data } = await supabase
    .from('artists')
    .select('id')
    .ilike('name', artistName.trim())
    .maybeSingle();
  return data?.id ?? null;
}

function normalizeRelease(row: any): Release {
  const artistName = row.artists?.stage_name || row.artists?.name || '';
  return {
    id: row.id,
    title: row.title || '',
    artist_id: row.artist_id,
    artist_name: artistName,
    release_type: row.release_type as ReleaseType,
    release_date: row.release_date ? String(row.release_date).substring(0, 10) : '',
    upc: row.upc || row.upc_ean || '',
    label: row.label || '',
    distributor: row.label || '',
    catalog_number: row.catalog_number || '',
    cover_art_url: row.cover_art_url || '',
    cover_url: row.cover_art_url || '',
    release_notes: row.release_notes || '',
    notes: row.release_notes || '',
    status: row.status as ReleaseStatus,
    organization_id: row.organization_id || row.org_id,
    org_id: row.org_id || row.organization_id,
    isrc: row.isrc || '',
    presave_link: row.presave_link || '',
    playlist_pitch_status: (row.playlist_pitch_status as PlaylistPitchStatus) || 'not_sent',
    budget: row.budget ? Number(row.budget) : undefined,
    cover_art_status: row.cover_art_status || 'pending',
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
  };
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function createRelease(
  releaseData: Partial<Release> & { artist_name?: string; distributor?: string; notes?: string }
): Promise<Release> {
  const orgId = await getUserOrgId();
  const artistId = await resolveArtistId(releaseData.artist_name, releaseData.artist_id);

  const dbRecord: any = {
    organization_id: orgId,
    org_id: orgId,
    artist_id: artistId,
    title: releaseData.title,
    release_type: releaseData.release_type || 'single',
    release_date: releaseData.release_date || null,
    upc: releaseData.upc || null,
    label: releaseData.label || releaseData.distributor || null,
    catalog_number: releaseData.catalog_number || null,
    cover_art_url: releaseData.cover_art_url || releaseData.cover_url || null,
    release_notes: releaseData.release_notes || releaseData.notes || null,
    isrc: (releaseData as any).isrc || null,
    status: releaseData.status || 'pre_production',
    presave_link: releaseData.presave_link || null,
    playlist_pitch_status: releaseData.playlist_pitch_status || 'not_sent',
    budget: releaseData.budget ?? null,
    cover_art_status: releaseData.cover_art_status || 'pending',
  };

  const { data, error } = await supabase
    .from('releases')
    .insert(dbRecord)
    .select('*, artists(name, stage_name)')
    .single();

  if (error) throw error;

  // Cria fases padrão para o tipo de lançamento (não bloqueia se falhar)
  createDefaultPhases(data.id, data.release_type as ReleaseType).catch(() => {});

  // Evento no calendário (não bloqueia se falhar)
  createCalendarEvent(data).catch(() => {});

  return normalizeRelease(data);
}

export async function updateRelease(id: string, updates: Partial<Release> & { artist_name?: string; distributor?: string; notes?: string }): Promise<Release> {
  const dbUpdates: any = {};
  if (updates.title !== undefined)        dbUpdates.title = updates.title;
  if (updates.release_type !== undefined) dbUpdates.release_type = updates.release_type;
  if (updates.release_date !== undefined) dbUpdates.release_date = updates.release_date;
  if (updates.status !== undefined)       dbUpdates.status = updates.status;
  if (updates.upc !== undefined)          dbUpdates.upc = updates.upc;
  if (updates.label !== undefined || updates.distributor !== undefined) {
    dbUpdates.label = updates.label || updates.distributor;
  }
  if (updates.release_notes !== undefined || updates.notes !== undefined) {
    dbUpdates.release_notes = updates.release_notes || updates.notes;
  }
  if (updates.cover_art_url !== undefined || updates.cover_url !== undefined) {
    dbUpdates.cover_art_url = updates.cover_art_url || updates.cover_url;
  }
  if ((updates as any).isrc !== undefined) dbUpdates.isrc = (updates as any).isrc;
  if (updates.presave_link !== undefined) dbUpdates.presave_link = updates.presave_link || null;
  if (updates.playlist_pitch_status !== undefined) dbUpdates.playlist_pitch_status = updates.playlist_pitch_status;
  if (updates.budget !== undefined) dbUpdates.budget = updates.budget ?? null;
  if (updates.cover_art_status !== undefined) dbUpdates.cover_art_status = updates.cover_art_status;
  if (updates.artist_name) {
    const aid = await resolveArtistId(updates.artist_name, updates.artist_id);
    if (aid) dbUpdates.artist_id = aid;
  }

  const { data, error } = await supabase
    .from('releases')
    .update(dbUpdates)
    .eq('id', id)
    .select('*, artists(name, stage_name)')
    .single();

  if (error) throw error;
  return normalizeRelease(data);
}

export async function deleteRelease(id: string): Promise<void> {
  const { error } = await supabase.from('releases').delete().eq('id', id);
  if (error) throw error;
  try { await supabase.from('calendar_events').delete().eq('metadata->>release_id', id); } catch { /* ignore */ }
}

export async function listReleases(filters?: {
  type?: ReleaseType;
  status?: ReleaseStatus;
  artist?: string;
  artist_id?: string;
}): Promise<Release[]> {
  let query = supabase
    .from('releases')
    .select('*, artists(name, stage_name)')
    .order('release_date', { ascending: true });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.type)   query = query.eq('release_type', filters.type);

  if (filters?.artist_id) {
    query = query.eq('artist_id', filters.artist_id);
  } else if (filters?.artist) {
    const { data: artistData } = await supabase
      .from('artists')
      .select('id')
      .ilike('name', `%${filters.artist}%`)
      .limit(1)
      .maybeSingle();
    if (artistData?.id) query = query.eq('artist_id', artistData.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeRelease);
}

export async function getReleaseById(id: string): Promise<Release | null> {
  const { data, error } = await supabase
    .from('releases')
    .select('*, artists(name, stage_name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeRelease(data) : null;
}

// ── Fases ─────────────────────────────────────────────────────────────────────
export async function listPhases(releaseId: string): Promise<ReleasePhase[]> {
  const { data, error } = await supabase
    .from('release_phases')
    .select('*')
    .eq('release_id', releaseId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data || []) as ReleasePhase[];
}

export async function updatePhase(id: string, updates: Partial<ReleasePhase>): Promise<ReleasePhase> {
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined)        dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined)      dbUpdates.status = updates.status;
  if (updates.start_date !== undefined)  dbUpdates.start_date = updates.start_date;
  if (updates.end_date !== undefined)    dbUpdates.end_date = updates.end_date;
  if (updates.order_index !== undefined) dbUpdates.order_index = updates.order_index;
  if (updates.color !== undefined)       dbUpdates.color = updates.color;

  const { data, error } = await supabase
    .from('release_phases')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as ReleasePhase;
}

export async function createPhase(releaseId: string, phase: Partial<ReleasePhase>): Promise<ReleasePhase> {
  const { data, error } = await supabase
    .from('release_phases')
    .insert({
      release_id: releaseId,
      name: phase.name || 'Nova Fase',
      description: phase.description || null,
      order_index: phase.order_index ?? 0,
      start_date: phase.start_date || null,
      end_date: phase.end_date || null,
      status: phase.status || 'pending',
      color: phase.color || '#6366f1',
    })
    .select()
    .single();
  if (error) throw error;
  return data as ReleasePhase;
}

export async function deletePhase(id: string): Promise<void> {
  const { error } = await supabase.from('release_phases').delete().eq('id', id);
  if (error) throw error;
}

// ── Fases padrão por tipo de lançamento ──────────────────────────────────────
export const DEFAULT_PHASES: Record<ReleaseType, { name: string; color: string }[]> = {
  single: [
    { name: 'Produção', color: '#6366f1' },
    { name: 'Mixagem & Masterização', color: '#8b5cf6' },
    { name: 'Arte & Capa', color: '#ec4899' },
    { name: 'Distribuição', color: '#f59e0b' },
    { name: 'Divulgação', color: '#10b981' },
  ],
  ep: [
    { name: 'Produção', color: '#6366f1' },
    { name: 'Mixagem & Masterização', color: '#8b5cf6' },
    { name: 'Arte & Identidade Visual', color: '#ec4899' },
    { name: 'Distribuição', color: '#f59e0b' },
    { name: 'Press Kit & Mídia', color: '#3b82f6' },
    { name: 'Divulgação', color: '#10b981' },
  ],
  album: [
    { name: 'Pré-produção', color: '#6366f1' },
    { name: 'Gravação', color: '#8b5cf6' },
    { name: 'Mixagem', color: '#a855f7' },
    { name: 'Masterização', color: '#ec4899' },
    { name: 'Arte & Identidade Visual', color: '#f43f5e' },
    { name: 'Distribuição', color: '#f59e0b' },
    { name: 'Press Kit & Mídia', color: '#3b82f6' },
    { name: 'Divulgação', color: '#10b981' },
  ],
  remix: [
    { name: 'Produção do Remix', color: '#6366f1' },
    { name: 'Masterização', color: '#8b5cf6' },
    { name: 'Distribuição', color: '#f59e0b' },
    { name: 'Divulgação', color: '#10b981' },
  ],
  live: [
    { name: 'Gravação', color: '#6366f1' },
    { name: 'Mixagem & Masterização', color: '#8b5cf6' },
    { name: 'Edição de Vídeo', color: '#ec4899' },
    { name: 'Distribuição', color: '#f59e0b' },
    { name: 'Divulgação', color: '#10b981' },
  ],
};

export async function createDefaultPhases(releaseId: string, releaseType: ReleaseType): Promise<ReleasePhase[]> {
  const templates = DEFAULT_PHASES[releaseType] || DEFAULT_PHASES.single;
  const rows = templates.map((t, i) => ({
    release_id: releaseId,
    name: t.name,
    order_index: i,
    status: 'pending' as PhaseStatus,
    color: t.color,
  }));
  const { data, error } = await supabase.from('release_phases').insert(rows).select();
  if (error) throw error;
  return (data || []) as ReleasePhase[];
}

// ── Anexos ────────────────────────────────────────────────────────────────────
export async function uploadAttachment(releaseId: string, file: File, fileType: FileType): Promise<ReleaseAttachment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const ext = file.name.split('.').pop();
  const path = `releases/${releaseId}/${fileType}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('files').upload(path, file);
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(path);

  // Persiste na tabela release_attachments
  const { data: attachment, error: dbError } = await supabase
    .from('release_attachments')
    .insert({
      release_id: releaseId,
      file_type: fileType,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (dbError) {
    // Upload no storage já foi feito; não bloqueia mas loga
    console.warn('Erro ao registrar anexo no banco:', dbError.message);
    return {
      id: crypto.randomUUID(),
      release_id: releaseId,
      file_type: fileType,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    };
  }

  // Se for capa, atualiza cover_art_url na release
  if (fileType === 'cover') {
    await supabase.from('releases').update({ cover_art_url: publicUrl }).eq('id', releaseId);
  }

  return {
    id: attachment.id,
    release_id: attachment.release_id,
    file_type: attachment.file_type as FileType,
    file_url: attachment.file_url,
    file_name: attachment.file_name,
    file_size: attachment.file_size,
    uploaded_by: attachment.uploaded_by,
    uploaded_at: attachment.uploaded_at,
  };
}

export async function listAttachments(releaseId: string): Promise<ReleaseAttachment[]> {
  const { data, error } = await supabase
    .from('release_attachments')
    .select('*')
    .eq('release_id', releaseId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((a: any) => ({
    id: a.id,
    release_id: a.release_id,
    file_type: a.file_type as FileType,
    file_url: a.file_url,
    file_name: a.file_name,
    file_size: a.file_size,
    uploaded_by: a.uploaded_by,
    uploaded_at: a.uploaded_at,
  }));
}

export async function deleteAttachment(id: string, fileUrl: string): Promise<void> {
  // Remove do banco
  const { error } = await supabase.from('release_attachments').delete().eq('id', id);
  if (error) throw error;
  // Tenta remover do storage (não bloqueia se falhar)
  try {
    const urlParts = fileUrl.split('/storage/v1/object/public/files/');
    if (urlParts[1]) {
      await supabase.storage.from('files').remove([urlParts[1]]);
    }
  } catch { /* ignore */ }
}

// ── Calendário ────────────────────────────────────────────────────────────────
async function createCalendarEvent(row: any): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const orgId = row.organization_id || row.org_id;
  if (!orgId) return;
  const artistName = row.artists?.stage_name || row.artists?.name || '';
  await supabase.from('calendar_events').insert({
    organization_id: orgId,
    artist_id: row.artist_id || null,
    created_by: user.id,
    title: `Lançamento: ${row.title}`,
    description: `${artistName} — ${row.release_type?.toUpperCase()}`,
    event_date: row.release_date || null,
    event_type: 'release',
    color: 'pink',
    metadata: { release_id: row.id, artist_name: artistName, status: row.status },
  });
}

// ── Utilitários ───────────────────────────────────────────────────────────────
export function formatDate(dateString: string): string {
  const d = new Date(dateString + (dateString.length === 10 ? 'T00:00:00' : ''));
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

export function getStatusColor(status: ReleaseStatus): string {
  return RELEASE_STATUSES.find(s => s.value === status)?.color || 'gray';
}
