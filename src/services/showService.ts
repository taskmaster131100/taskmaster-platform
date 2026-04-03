import { supabase } from '../lib/supabase';

// ── Tipos alinhados ao schema real do banco ───────────────────────────────────
export type ShowStatus = 'consultado' | 'proposto' | 'fechado' | 'pago';

export interface Show {
  id: string;
  title: string;
  // artist
  artist_id?: string;
  artist_name: string; // derivado do join com artists
  // venue
  venue?: string;
  venue_address?: string;
  city?: string;       // parsed de venue_address para exibição
  venue_contact_name?: string;
  venue_contact_phone?: string;
  // datas/horários
  show_date: string;
  show_time?: string;
  // financeiro
  deal_value?: number;
  value?: number;      // alias de deal_value
  currency?: string;
  commission_rate?: number;
  artist_split?: number;
  production_split?: number;
  // outros
  status: ShowStatus;
  notes?: string;
  org_id?: string;
  created_at: string;
  updated_at: string;
}

export const SHOW_STATUSES: { value: ShowStatus; label: string; color: string }[] = [
  { value: 'consultado', label: 'Consultado', color: 'gray' },
  { value: 'proposto',   label: 'Proposto',   color: 'blue' },
  { value: 'fechado',    label: 'Fechado',     color: 'green' },
  { value: 'pago',       label: 'Pago',        color: 'purple' },
];

// ── Helpers internos ──────────────────────────────────────────────────────────

async function getUserOrgId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');
  const { data } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
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

// Normaliza row do banco → Show (para exibição)
function normalizeShow(row: any): Show {
  const venueAddress = row.venue_address || '';
  const parts = venueAddress.split(',').map((s: string) => s.trim());
  // venue_contact pode ser jsonb {name, phone} ou texto
  const vc = row.venue_contact;
  const contactName = typeof vc === 'object' && vc ? vc.name : (typeof vc === 'string' ? vc : '');
  const contactPhone = typeof vc === 'object' && vc ? (vc.phone || vc.contact || '') : '';
  const artistName = row.artists?.stage_name || row.artists?.name || row.artist_name_cached || '';

  return {
    id: row.id,
    title: row.title || '',
    artist_id: row.artist_id,
    artist_name: artistName,
    venue: row.venue || '',
    venue_address: venueAddress,
    city: parts[0] || '',
    venue_contact_name: contactName,
    venue_contact_phone: contactPhone,
    show_date: row.show_date ? String(row.show_date).substring(0, 10) : '',
    show_time: row.show_time ? String(row.show_time).substring(11, 16) : undefined,
    deal_value: row.deal_value ? Number(row.deal_value) : undefined,
    value: row.deal_value ? Number(row.deal_value) : undefined,
    currency: 'BRL',
    commission_rate: row.commission_rate ? Number(row.commission_rate) : undefined,
    artist_split: row.artist_split ? Number(row.artist_split) : undefined,
    production_split: row.production_split ? Number(row.production_split) : undefined,
    status: (row.status as ShowStatus) || 'consultado',
    notes: row.notes || '',
    org_id: row.org_id,
    created_at: row.created_at || '',
    updated_at: row.updated_at || '',
  };
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

export async function createShow(showData: Partial<Show> & { artist_name?: string; city?: string; state?: string; country?: string; value?: number; contractor_name?: string; contractor_contact?: string }): Promise<Show> {
  const orgId = await getUserOrgId();
  const artistId = await resolveArtistId(showData.artist_name, showData.artist_id);

  // Monta venue_address a partir de city/state/country ou venue_address direto
  const venueAddress =
    showData.venue_address ||
    [showData.city, showData.state, showData.country].filter(Boolean).join(', ') ||
    null;

  // venue_contact como jsonb
  const venueContact =
    showData.venue_contact_name || (showData as any).contractor_name
      ? { name: showData.venue_contact_name || (showData as any).contractor_name || '', phone: showData.venue_contact_phone || (showData as any).contractor_contact || '' }
      : null;

  const dbRecord: any = {
    org_id: orgId,
    artist_id: artistId,
    title: showData.title,
    venue: showData.venue || null,
    venue_address: venueAddress,
    venue_contact: venueContact,
    show_date: showData.show_date || null,
    show_time: showData.show_time
      ? `1970-01-01T${showData.show_time}:00Z`
      : null,
    deal_value: showData.deal_value ?? showData.value ?? null,
    status: showData.status || 'consultado',
    notes: showData.notes || null,
    commission_rate: showData.commission_rate ?? null,
    artist_split: showData.artist_split ?? null,
    production_split: showData.production_split ?? null,
  };

  const { data, error } = await supabase
    .from('shows')
    .insert(dbRecord)
    .select('*, artists(name, stage_name)')
    .single();

  if (error) throw error;

  // Evento no calendário
  await createCalendarEvent(data, showData.artist_name);

  return normalizeShow(data);
}

export async function updateShow(id: string, updates: Partial<Show> & { city?: string; state?: string; country?: string; value?: number; contractor_name?: string; contractor_contact?: string }, previousStatus?: ShowStatus): Promise<Show> {
  const dbUpdates: any = {};

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.venue !== undefined) dbUpdates.venue = updates.venue;
  if (updates.show_date !== undefined) dbUpdates.show_date = updates.show_date;
  if (updates.show_time !== undefined) dbUpdates.show_time = updates.show_time ? `1970-01-01T${updates.show_time}:00Z` : null;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.commission_rate !== undefined) dbUpdates.commission_rate = updates.commission_rate;
  if (updates.artist_split !== undefined) dbUpdates.artist_split = updates.artist_split;
  if ((updates as any).value !== undefined || updates.deal_value !== undefined) {
    dbUpdates.deal_value = updates.deal_value ?? (updates as any).value;
  }

  const city = (updates as any).city;
  const state = (updates as any).state;
  const country = (updates as any).country;
  if (city || state || country) {
    dbUpdates.venue_address = [city, state, country].filter(Boolean).join(', ');
  }

  const cName = (updates as any).contractor_name || updates.venue_contact_name;
  const cPhone = (updates as any).contractor_contact || updates.venue_contact_phone;
  if (cName || cPhone) {
    dbUpdates.venue_contact = { name: cName || '', phone: cPhone || '' };
  }

  // Atualiza artist_id se veio artist_name novo
  if ((updates as any).artist_name) {
    const artistId = await resolveArtistId((updates as any).artist_name, updates.artist_id);
    if (artistId) dbUpdates.artist_id = artistId;
  }

  const { data, error } = await supabase
    .from('shows')
    .update(dbUpdates)
    .eq('id', id)
    .select('*, artists(name, stage_name)')
    .single();

  if (error) throw error;

  if (updates.show_date || updates.show_time || updates.title || updates.venue) {
    await updateCalendarEvent(data);
  }

  if (updates.status === 'fechado' && previousStatus && previousStatus !== 'fechado') {
    await createFinancialEntry(normalizeShow(data));
  }
  if (updates.status === 'pago' && previousStatus !== 'pago') {
    await supabase
      .from('financial_transactions')
      .update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] })
      .eq('reference_type', 'show')
      .eq('reference_id', id);
  }

  return normalizeShow(data);
}

export async function deleteShow(id: string): Promise<void> {
  const { error } = await supabase.from('shows').delete().eq('id', id);
  if (error) throw error;
  await supabase.from('calendar_events').delete().eq('metadata->>show_id', id);
  await supabase.from('financial_transactions').delete().eq('reference_type', 'show').eq('reference_id', id);
}

export async function listShows(filters?: {
  status?: ShowStatus;
  month?: number;
  year?: number;
  artist?: string;
  artist_id?: string;
}): Promise<Show[]> {
  let query = supabase
    .from('shows')
    .select('*, artists(name, stage_name)')
    .order('show_date', { ascending: true });

  if (filters?.status) query = query.eq('status', filters.status);

  if (filters?.artist_id) {
    query = query.eq('artist_id', filters.artist_id);
  } else if (filters?.artist) {
    // busca artist_id pelo nome e filtra
    const { data: artistData } = await supabase
      .from('artists')
      .select('id')
      .ilike('name', `%${filters.artist}%`)
      .limit(1)
      .maybeSingle();
    if (artistData?.id) query = query.eq('artist_id', artistData.id);
  }

  if (filters?.month && filters?.year) {
    const start = new Date(filters.year, filters.month - 1, 1).toISOString().split('T')[0];
    const end   = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
    query = query.gte('show_date', start).lte('show_date', end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeShow);
}

export async function getShowById(id: string): Promise<Show | null> {
  const { data, error } = await supabase
    .from('shows')
    .select('*, artists(name, stage_name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeShow(data) : null;
}

// ── Financeiro ────────────────────────────────────────────────────────────────

async function createFinancialEntry(show: Show): Promise<void> {
  if (!show.value && !show.deal_value) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const orgId = show.org_id || (await getUserOrgId().catch(() => null));
  if (!orgId) return;
  await supabase.from('financial_transactions').insert({
    organization_id: orgId,
    type: 'revenue',
    category: 'shows',
    description: `Cachê: ${show.title} — ${show.artist_name}`,
    amount: show.deal_value ?? show.value,
    currency: 'BRL',
    status: 'pending',
    due_date: show.show_date,
    reference_type: 'show',
    reference_id: show.id,
    notes: `Local: ${show.venue || ''} ${show.venue_address || ''}`.trim(),
    created_by: user.id,
  });
}

// ── Calendário ────────────────────────────────────────────────────────────────

async function createCalendarEvent(row: any, artistName?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const orgId = row.org_id || await getUserOrgId().catch(() => null);
  if (!orgId) return;
  const name = row.artists?.stage_name || row.artists?.name || artistName || '';
  await supabase.from('calendar_events').insert({
    organization_id: orgId,
    artist_id: row.artist_id || null,
    created_by: user.id,
    title: `Show: ${row.title}`,
    description: `${name} em ${row.venue || row.venue_address || ''}`,
    event_date: row.show_date ? String(row.show_date).substring(0, 10) : null,
    start_time: row.show_time ? String(row.show_time).substring(11, 16) : null,
    event_type: 'show',
    color: 'purple',
    location: `${row.venue || ''} ${row.venue_address || ''}`.trim(),
    metadata: { show_id: row.id, artist_name: name, status: row.status },
  }).then(() => {}).catch(() => {}); // não bloqueia se falhar
}

async function updateCalendarEvent(row: any): Promise<void> {
  const name = row.artists?.stage_name || row.artists?.name || '';
  await supabase
    .from('calendar_events')
    .update({
      title: `Show: ${row.title}`,
      event_date: row.show_date ? String(row.show_date).substring(0, 10) : null,
      location: `${row.venue || ''} ${row.venue_address || ''}`.trim(),
    })
    .eq('metadata->>show_id', row.id)
    .then(() => {}).catch(() => {});
}

// ── Utilitários ───────────────────────────────────────────────────────────────

export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

export function formatDate(dateString: string): string {
  const d = new Date(dateString + (dateString.length === 10 ? 'T00:00:00' : ''));
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

export function getStatusColor(status: ShowStatus): string {
  return SHOW_STATUSES.find(s => s.value === status)?.color || 'gray';
}
