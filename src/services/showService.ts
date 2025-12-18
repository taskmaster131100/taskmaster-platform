import { supabase } from '../lib/supabase';

export interface Show {
  id: string;
  title: string;
  artist_name: string;
  show_date: string;
  show_time?: string;
  venue?: string;
  city: string;
  state?: string;
  country: string;
  contractor_name?: string;
  contractor_contact?: string;
  value?: number;
  currency: string;
  status: ShowStatus;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ShowContract {
  id: string;
  show_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  signed_at?: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface ShowTask {
  id: string;
  show_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  due_date?: string;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  completed_at?: string;
}

export type ShowStatus = 'consultado' | 'proposto' | 'fechado' | 'pago';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export const SHOW_STATUSES: { value: ShowStatus; label: string; color: string }[] = [
  { value: 'consultado', label: 'Consultado', color: 'gray' },
  { value: 'proposto', label: 'Proposto', color: 'blue' },
  { value: 'fechado', label: 'Fechado', color: 'green' },
  { value: 'pago', label: 'Pago', color: 'purple' }
];

const DEFAULT_SHOW_TASKS = [
  { title: 'Enviar rider técnico', days_before: 30 },
  { title: 'Confirmar horários de soundcheck', days_before: 7 },
  { title: 'Confirmar camarim e alimentação', days_before: 7 },
  { title: 'Preparar setlist', days_before: 3 },
  { title: 'Conferir equipamento', days_before: 1 }
];

export async function createShow(showData: Partial<Show>): Promise<Show> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('shows')
    .insert({
      ...showData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  await createDefaultTasks(data.id, data.show_date);

  await createCalendarEvent(data);

  return data;
}

async function createDefaultTasks(showId: string, showDate: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const showDateObj = new Date(showDate);

  const tasks = DEFAULT_SHOW_TASKS.map(task => {
    const dueDate = new Date(showDateObj);
    dueDate.setDate(dueDate.getDate() - task.days_before);

    return {
      show_id: showId,
      title: task.title,
      status: 'pending' as TaskStatus,
      due_date: dueDate.toISOString().split('T')[0],
      created_by: user.id
    };
  });

  await supabase.from('show_tasks').insert(tasks);
}

async function createCalendarEvent(show: Show): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('calendar_events').insert({
    title: `Show: ${show.title}`,
    description: `${show.artist_name} em ${show.venue || show.city}`,
    event_date: show.show_date,
    start_time: show.show_time,
    event_type: 'show',
    color: 'purple',
    location: `${show.venue || ''}, ${show.city}`,
    created_by: user.id,
    metadata: {
      show_id: show.id,
      artist_name: show.artist_name,
      status: show.status
    }
  });
}

export async function updateShow(id: string, updates: Partial<Show>): Promise<Show> {
  const { data, error } = await supabase
    .from('shows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (updates.show_date || updates.show_time || updates.title || updates.venue) {
    await updateCalendarEvent(data);
  }

  return data;
}

async function updateCalendarEvent(show: Show): Promise<void> {
  await supabase
    .from('calendar_events')
    .update({
      title: `Show: ${show.title}`,
      description: `${show.artist_name} em ${show.venue || show.city}`,
      event_date: show.show_date,
      start_time: show.show_time,
      location: `${show.venue || ''}, ${show.city}`,
      metadata: {
        show_id: show.id,
        artist_name: show.artist_name,
        status: show.status
      }
    })
    .eq('metadata->>show_id', show.id);
}

export async function deleteShow(id: string): Promise<void> {
  const { error } = await supabase
    .from('shows')
    .delete()
    .eq('id', id);

  if (error) throw error;

  await supabase
    .from('calendar_events')
    .delete()
    .eq('metadata->>show_id', id);
}

export async function listShows(filters?: {
  status?: ShowStatus;
  month?: number;
  year?: number;
  artist?: string;
}): Promise<Show[]> {
  let query = supabase
    .from('shows')
    .select('*')
    .order('show_date', { ascending: true });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.month && filters?.year) {
    const startDate = new Date(filters.year, filters.month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(filters.year, filters.month, 0).toISOString().split('T')[0];
    query = query.gte('show_date', startDate).lte('show_date', endDate);
  }

  if (filters?.artist) {
    query = query.ilike('artist_name', `%${filters.artist}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getShowById(id: string): Promise<Show | null> {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function uploadContract(
  showId: string,
  file: File
): Promise<ShowContract> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `contracts/${showId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('show_contracts')
    .insert({
      show_id: showId,
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

export async function listContracts(showId: string): Promise<ShowContract[]> {
  const { data, error } = await supabase
    .from('show_contracts')
    .select('*')
    .eq('show_id', showId)
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteContract(id: string): Promise<void> {
  const contract = await supabase
    .from('show_contracts')
    .select('file_url')
    .eq('id', id)
    .single();

  if (contract.data) {
    const urlParts = contract.data.file_url.split('/files/');
    if (urlParts.length === 2) {
      await supabase.storage.from('files').remove([urlParts[1]]);
    }
  }

  const { error } = await supabase
    .from('show_contracts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createTask(taskData: Partial<ShowTask>): Promise<ShowTask> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('show_tasks')
    .insert({
      ...taskData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<ShowTask>): Promise<ShowTask> {
  if (updates.status === 'completed' && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('show_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listTasks(showId: string): Promise<ShowTask[]> {
  const { data, error } = await supabase
    .from('show_tasks')
    .select('*')
    .eq('show_id', showId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('show_tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(value);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function getStatusColor(status: ShowStatus): string {
  const statusInfo = SHOW_STATUSES.find(s => s.value === status);
  return statusInfo?.color || 'gray';
}
