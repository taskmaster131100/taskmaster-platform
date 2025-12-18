import { supabase } from '../lib/supabase';

export interface Tour {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  status: TourStatus;
  total_shows: number;
  total_revenue: number;
  poster_url?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TourShow {
  id: string;
  tour_id: string;
  show_id: string;
  order_index: number;
  created_at: string;
}

export interface TourWithShows extends Tour {
  shows: any[];
}

export type TourStatus = 'planning' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export const TOUR_STATUSES: { value: TourStatus; label: string; color: string }[] = [
  { value: 'planning', label: 'Planejamento', color: 'gray' },
  { value: 'confirmed', label: 'Confirmada', color: 'blue' },
  { value: 'in_progress', label: 'Em Andamento', color: 'green' },
  { value: 'completed', label: 'Finalizada', color: 'purple' },
  { value: 'cancelled', label: 'Cancelada', color: 'red' }
];

export async function createTour(tourData: Partial<Tour>): Promise<Tour> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('tours')
    .insert({
      ...tourData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  await createTourCalendarEvent(data);

  return data;
}

async function createTourCalendarEvent(tour: Tour): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('calendar_events').insert({
    title: `Turnê: ${tour.name}`,
    description: tour.description || `Turnê de ${tour.start_date} até ${tour.end_date}`,
    event_date: tour.start_date,
    event_type: 'tour',
    color: 'indigo',
    created_by: user.id,
    metadata: {
      tour_id: tour.id,
      end_date: tour.end_date,
      status: tour.status
    }
  });
}

export async function updateTour(id: string, updates: Partial<Tour>): Promise<Tour> {
  const { data, error } = await supabase
    .from('tours')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from('calendar_events')
    .update({
      title: `Turnê: ${updates.name || data.name}`,
      description: updates.description || data.description,
      event_date: updates.start_date || data.start_date,
      metadata: {
        tour_id: data.id,
        end_date: updates.end_date || data.end_date,
        status: updates.status || data.status
      }
    })
    .eq('metadata->>tour_id', id);

  return data;
}

export async function deleteTour(id: string): Promise<void> {
  const { error } = await supabase
    .from('tours')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await supabase
    .from('calendar_events')
    .delete()
    .eq('metadata->>tour_id', id);
}

export async function listTours(filters?: {
  status?: TourStatus;
}): Promise<Tour[]> {
  let query = supabase
    .from('tours')
    .select('*')
    .order('start_date', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getTourById(id: string): Promise<TourWithShows | null> {
  const { data: tour, error: tourError } = await supabase
    .from('tours')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (tourError) throw tourError;
  if (!tour) return null;

  const { data: tourShows, error: showsError } = await supabase
    .from('tour_shows')
    .select(`
      *,
      shows (*)
    `)
    .eq('tour_id', id)
    .order('order_index', { ascending: true });

  if (showsError) throw showsError;

  const shows = tourShows?.map(ts => ts.shows) || [];

  return {
    ...tour,
    shows
  };
}

export async function addShowToTour(tourId: string, showId: string, orderIndex?: number): Promise<TourShow> {
  const currentMaxOrder = orderIndex !== undefined ? orderIndex : await getMaxOrderIndex(tourId);

  const { data, error } = await supabase
    .from('tour_shows')
    .insert({
      tour_id: tourId,
      show_id: showId,
      order_index: currentMaxOrder + 1
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

async function getMaxOrderIndex(tourId: string): Promise<number> {
  const { data } = await supabase
    .from('tour_shows')
    .select('order_index')
    .eq('tour_id', tourId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.order_index || 0;
}

export async function removeShowFromTour(tourId: string, showId: string): Promise<void> {
  const { error } = await supabase
    .from('tour_shows')
    .delete()
    .eq('tour_id', tourId)
    .eq('show_id', showId);

  if (error) throw error;
}

export async function reorderTourShows(tourId: string, showIds: string[]): Promise<void> {
  const updates = showIds.map((showId, index) => ({
    tour_id: tourId,
    show_id: showId,
    order_index: index
  }));

  for (const update of updates) {
    await supabase
      .from('tour_shows')
      .update({ order_index: update.order_index })
      .eq('tour_id', update.tour_id)
      .eq('show_id', update.show_id);
  }
}

export async function getAvailableShows(tourId?: string): Promise<any[]> {
  let query = supabase
    .from('shows')
    .select('*')
    .order('event_date', { ascending: true });

  if (tourId) {
    const { data: tourShows } = await supabase
      .from('tour_shows')
      .select('show_id')
      .eq('tour_id', tourId);

    const usedShowIds = tourShows?.map(ts => ts.show_id) || [];

    if (usedShowIds.length > 0) {
      query = query.not('id', 'in', `(${usedShowIds.join(',')})`);
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function updateTourStats(tourId: string): Promise<void> {
  await supabase.rpc('update_tour_stats', { p_tour_id: tourId });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function getStatusColor(status: TourStatus): string {
  const statusInfo = TOUR_STATUSES.find(s => s.value === status);
  return statusInfo?.color || 'gray';
}

export function calculateTourDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
