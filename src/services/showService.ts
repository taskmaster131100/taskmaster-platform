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
  commission_rate?: number; // % para a produtora
  artist_split?: number; // % para o artista
  production_split?: number; // % para a produtora (calculado ou fixo)
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
  category?: string;
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

// Checklist completo para shows - organizado por fase
const SHOW_CHECKLIST = {
  // Tarefas ANTES do show
  before: [
    { title: 'Contrato assinado', days_before: 30, category: 'legal' },
    { title: 'Rider tecnico enviado', days_before: 21, category: 'production' },
    { title: 'Rider de camarim enviado', days_before: 21, category: 'production' },
    { title: 'Entrada (50%) recebida', days_before: 14, category: 'financial' },
    { title: 'Transporte confirmado', days_before: 7, category: 'logistics' },
    { title: 'Hospedagem confirmada', days_before: 7, category: 'logistics' },
    { title: 'Passagem de som agendada', days_before: 3, category: 'production' },
    { title: 'Setlist definido', days_before: 3, category: 'production' },
    { title: 'Equipe tecnica confirmada', days_before: 3, category: 'team' },
    { title: 'Materiais de divulgacao enviados', days_before: 7, category: 'marketing' },
  ],
  // Tarefas NO DIA do show
  day: [
    { title: 'Check-in no local', days_before: 0, category: 'logistics' },
    { title: 'Passagem de som realizada', days_before: 0, category: 'production' },
    { title: 'Camarim OK', days_before: 0, category: 'production' },
    { title: 'Show realizado', days_before: 0, category: 'production' },
  ],
  // Tarefas APOS o show
  after: [
    { title: 'Saldo (50%) recebido', days_after: 7, category: 'financial' },
    { title: 'Fotos/videos coletados', days_after: 3, category: 'marketing' },
    { title: 'Feedback do contratante', days_after: 7, category: 'marketing' },
    { title: 'Relatorio do show', days_after: 7, category: 'admin' },
  ]
};

// Tarefas basicas para shows consultados/propostos
const DEFAULT_SHOW_TASKS = [
  { title: 'Enviar rider tecnico', days_before: 30 },
  { title: 'Confirmar horarios de soundcheck', days_before: 7 },
  { title: 'Confirmar camarim e alimentacao', days_before: 7 },
  { title: 'Preparar setlist', days_before: 3 },
  { title: 'Conferir equipamento', days_before: 1 }
];

export async function createShow(showData: Partial<Show>): Promise<Show> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario nao autenticado');

  const { data, error } = await supabase
    .from('shows')
    .insert({
      ...showData,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;

  // Se ja esta criando como fechado, criar checklist completo
  if (data.status === 'fechado') {
    await createCompleteChecklist(data.id, data.show_date, user.id);
    await createFinancialEntry(data);
  } else {
    await createDefaultTasks(data.id, data.show_date);
  }

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

async function createCompleteChecklist(showId: string, showDate: string, userId: string): Promise<void> {
  const showDateObj = new Date(showDate);
  const tasks: any[] = [];

  // Tarefas ANTES do show
  for (const item of SHOW_CHECKLIST.before) {
    const dueDate = new Date(showDateObj);
    dueDate.setDate(dueDate.getDate() - item.days_before);
    
    tasks.push({
      show_id: showId,
      title: item.title,
      category: item.category,
      status: 'pending',
      due_date: dueDate.toISOString().split('T')[0],
      created_by: userId
    });
  }

  // Tarefas NO DIA do show
  for (const item of SHOW_CHECKLIST.day) {
    tasks.push({
      show_id: showId,
      title: item.title,
      category: item.category,
      status: 'pending',
      due_date: showDate,
      created_by: userId
    });
  }

  // Tarefas APOS o show
  for (const item of SHOW_CHECKLIST.after) {
    const dueDate = new Date(showDateObj);
    dueDate.setDate(dueDate.getDate() + (item.days_after || 0));
    
    tasks.push({
      show_id: showId,
      title: item.title,
      category: item.category,
      status: 'pending',
      due_date: dueDate.toISOString().split('T')[0],
      created_by: userId
    });
  }

  await supabase.from('show_tasks').insert(tasks);
}

async function createFinancialEntry(show: Show): Promise<void> {
  if (!show.value || show.value <= 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Criar transacao de receita no financeiro
  await supabase.from('financial_transactions').insert({
    type: 'revenue',
    category: 'shows',
    description: `Cache: ${show.title} - ${show.artist_name}`,
    amount: show.value,
    currency: show.currency || 'BRL',
    status: 'pending',
    due_date: show.show_date,
    reference_type: 'show',
    reference_id: show.id,
    notes: `Local: ${show.venue || ''}, ${show.city}`,
    created_by: user.id
  });
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

export async function updateShow(id: string, updates: Partial<Show>, previousStatus?: ShowStatus): Promise<Show> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('shows')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Atualizar evento no calendario se dados relevantes mudaram
  if (updates.show_date || updates.show_time || updates.title || updates.venue) {
    await updateCalendarEvent(data);
  }

  // Se o status mudou para 'fechado', criar checklist completo e entrada financeira
  if (updates.status === 'fechado' && previousStatus && previousStatus !== 'fechado') {
    // Remover tarefas basicas existentes
    await supabase.from('show_tasks').delete().eq('show_id', id);
    
    // Criar checklist completo
    if (user) {
      await createCompleteChecklist(id, data.show_date, user.id);
    }
    
    // Criar entrada no financeiro
    await createFinancialEntry(data);
  }

  // Se o status mudou para 'pago', atualizar entrada no financeiro
  if (updates.status === 'pago' && previousStatus !== 'pago') {
    await supabase
      .from('financial_transactions')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      })
      .eq('reference_type', 'show')
      .eq('reference_id', id);
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

  // Deletar evento do calendario
  await supabase
    .from('calendar_events')
    .delete()
    .eq('metadata->>show_id', id);

  // Deletar transacoes financeiras relacionadas
  await supabase
    .from('financial_transactions')
    .delete()
    .eq('reference_type', 'show')
    .eq('reference_id', id);
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
  if (!user) throw new Error('Usuario nao autenticado');

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
  if (!user) throw new Error('Usuario nao autenticado');

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

// Funcao para calcular lucro do show
export async function getShowProfit(showId: string): Promise<{
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
}> {
  const { data: transactions } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('reference_id', showId)
    .neq('status', 'cancelled');

  let revenue = 0;
  let expenses = 0;

  for (const t of transactions || []) {
    if (t.type === 'revenue') {
      revenue += parseFloat(t.amount);
    } else {
      expenses += parseFloat(t.amount);
    }
  }

  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return { revenue, expenses, profit, profitMargin };
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
