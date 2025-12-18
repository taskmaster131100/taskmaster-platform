import { supabase } from '../lib/supabase';

export interface Release {
  id: string;
  title: string;
  artist_name: string;
  release_type: ReleaseType;
  release_date: string;
  isrc?: string;
  upc?: string;
  distributor?: string;
  cover_url?: string;
  status: ReleaseStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

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

export type ReleaseType = 'single' | 'ep' | 'album' | 'remix' | 'live';
export type ReleaseStatus = 'pre_production' | 'production' | 'mixing' | 'mastering' | 'distribution' | 'released';
export type PhaseStatus = 'pending' | 'in_progress' | 'completed';
export type FileType = 'cover' | 'press_kit' | 'track' | 'document';

export const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'album', label: 'Álbum' },
  { value: 'remix', label: 'Remix' },
  { value: 'live', label: 'Ao Vivo' }
];

export const RELEASE_STATUSES: { value: ReleaseStatus; label: string; color: string }[] = [
  { value: 'pre_production', label: 'Pré-produção', color: 'gray' },
  { value: 'production', label: 'Produção', color: 'blue' },
  { value: 'mixing', label: 'Mixagem', color: 'yellow' },
  { value: 'mastering', label: 'Masterização', color: 'orange' },
  { value: 'distribution', label: 'Distribuição', color: 'green' },
  { value: 'released', label: 'Lançado', color: 'purple' }
];

const DEFAULT_PHASES = [
  { name: 'Pré-produção', description: 'Composição, arranjos e planejamento', color: '#6B7280', weeks_before: 12 },
  { name: 'Produção', description: 'Gravação de instrumentos e vocais', color: '#3B82F6', weeks_before: 8 },
  { name: 'Mixagem', description: 'Balanceamento e efeitos', color: '#EAB308', weeks_before: 6 },
  { name: 'Masterização', description: 'Finalização e ajustes finais', color: '#F97316', weeks_before: 4 },
  { name: 'Distribuição', description: 'Envio para plataformas digitais', color: '#10B981', weeks_before: 2 },
  { name: 'Divulgação', description: 'Marketing e promoção', color: '#8B5CF6', weeks_before: 1 }
];

export async function createRelease(releaseData: Partial<Release>): Promise<Release> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('releases')
    .insert({
      ...releaseData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  await createDefaultPhases(data.id, data.release_date);
  await createCalendarEvent(data);

  return data;
}

async function createDefaultPhases(releaseId: string, releaseDate: string): Promise<void> {
  const releaseDateObj = new Date(releaseDate);

  const phases = DEFAULT_PHASES.map((phase, index) => {
    const endDate = new Date(releaseDateObj);
    endDate.setDate(endDate.getDate() - (phase.weeks_before * 7));

    const startDate = new Date(endDate);
    if (index < DEFAULT_PHASES.length - 1) {
      const nextPhase = DEFAULT_PHASES[index + 1];
      startDate.setDate(startDate.getDate() - ((phase.weeks_before - nextPhase.weeks_before) * 7));
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    return {
      release_id: releaseId,
      name: phase.name,
      description: phase.description,
      order_index: index,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      status: 'pending' as PhaseStatus,
      color: phase.color
    };
  });

  await supabase.from('release_phases').insert(phases);
}

async function createCalendarEvent(release: Release): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('calendar_events').insert({
    title: `Lançamento: ${release.title}`,
    description: `${release.artist_name} - ${RELEASE_TYPES.find(t => t.value === release.release_type)?.label}`,
    event_date: release.release_date,
    event_type: 'deadline',
    color: 'purple',
    created_by: user.id,
    metadata: {
      release_id: release.id,
      artist_name: release.artist_name,
      release_type: release.release_type
    }
  });
}

export async function updateRelease(id: string, updates: Partial<Release>): Promise<Release> {
  const { data, error } = await supabase
    .from('releases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteRelease(id: string): Promise<void> {
  const { error } = await supabase
    .from('releases')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await supabase
    .from('calendar_events')
    .delete()
    .eq('metadata->>release_id', id);
}

export async function listReleases(filters?: {
  status?: ReleaseStatus;
  type?: ReleaseType;
}): Promise<Release[]> {
  let query = supabase
    .from('releases')
    .select('*')
    .order('release_date', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.type) {
    query = query.eq('release_type', filters.type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getReleaseById(id: string): Promise<Release | null> {
  const { data, error } = await supabase
    .from('releases')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listPhases(releaseId: string): Promise<ReleasePhase[]> {
  const { data, error } = await supabase
    .from('release_phases')
    .select('*')
    .eq('release_id', releaseId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function updatePhase(id: string, updates: Partial<ReleasePhase>): Promise<ReleasePhase> {
  const { data, error } = await supabase
    .from('release_phases')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadAttachment(
  releaseId: string,
  file: File,
  fileType: FileType
): Promise<ReleaseAttachment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `releases/${releaseId}/${fileType}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('release_attachments')
    .insert({
      release_id: releaseId,
      file_type: fileType,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      uploaded_by: user.id
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from('files').remove([filePath]);
    throw error;
  }

  return data;
}

export async function listAttachments(releaseId: string): Promise<ReleaseAttachment[]> {
  const { data, error } = await supabase
    .from('release_attachments')
    .select('*')
    .eq('release_id', releaseId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function getStatusColor(status: ReleaseStatus): string {
  const statusInfo = RELEASE_STATUSES.find(s => s.value === status);
  return statusInfo?.color || 'gray';
}
