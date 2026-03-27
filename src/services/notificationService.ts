import { supabase } from '../lib/supabase';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
  reference_type?: 'task' | 'show' | 'release' | 'payment' | 'team' | 'system';
  reference_id?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export type NotificationType = 
  | 'deadline_approaching'   // Prazo se aproximando (3 dias)
  | 'deadline_today'         // Prazo é hoje
  | 'deadline_overdue'       // Prazo passou
  | 'task_assigned'          // Tarefa atribuída
  | 'task_completed'         // Tarefa concluída
  | 'show_confirmed'         // Show confirmado
  | 'show_tomorrow'          // Show amanhã
  | 'payment_pending'        // Pagamento pendente
  | 'payment_received'       // Pagamento recebido
  | 'release_approaching'    // Lançamento se aproximando
  | 'team_update'            // Atualização da equipe
  | 'system_alert';          // Alerta do sistema

export const NOTIFICATION_CONFIG = {
  deadline_approaching: { icon: '⏰', color: 'yellow', priority: 'medium' as const },
  deadline_today: { icon: '🔔', color: 'orange', priority: 'high' as const },
  deadline_overdue: { icon: '🚨', color: 'red', priority: 'urgent' as const },
  task_assigned: { icon: '📋', color: 'blue', priority: 'medium' as const },
  task_completed: { icon: '✅', color: 'green', priority: 'low' as const },
  show_confirmed: { icon: '🎤', color: 'purple', priority: 'medium' as const },
  show_tomorrow: { icon: '🎸', color: 'purple', priority: 'high' as const },
  payment_pending: { icon: '💰', color: 'yellow', priority: 'medium' as const },
  payment_received: { icon: '💵', color: 'green', priority: 'low' as const },
  release_approaching: { icon: '🎵', color: 'purple', priority: 'high' as const },
  team_update: { icon: '👥', color: 'blue', priority: 'low' as const },
  system_alert: { icon: '⚙️', color: 'gray', priority: 'medium' as const },
};

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Cria uma nova notificação
 */
export async function createNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  referenceType?: Notification['reference_type'];
  referenceId?: string;
}): Promise<Notification> {
  const config = NOTIFICATION_CONFIG[data.type];

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      user_id: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      action_url: data.link,
      reference_type: data.referenceType,
      reference_id: data.referenceId,
      priority: config.priority,
      is_read: false
    })
    .select()
    .single();

  if (error) throw error;
  return notification;
}

/**
 * Lista notificações do usuário
 */
export async function listNotifications(filters?: {
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
}): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (filters?.unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Marca notificação como lida
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId);
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', user.id)
    .eq('is_read', false);
}

/**
 * Conta notificações não lidas
 */
export async function getUnreadCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

/**
 * Deleta notificações antigas (mais de 30 dias)
 */
export async function cleanOldNotifications(): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await supabase
    .from('notifications')
    .delete()
    .lt('created_at', thirtyDaysAgo.toISOString())
    .eq('is_read', true);
}

// ============================================
// VERIFICAÇÕES AUTOMÁTICAS DE PRAZOS
// ============================================

/**
 * Verifica tarefas com prazos próximos e cria notificações
 */
export async function checkTaskDeadlines(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  // Buscar tarefas do usuário com prazo nos próximos 3 dias
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', user.id)
    .neq('status', 'done')
    .lte('deadline', threeDaysFromNow.toISOString().split('T')[0])
    .gte('deadline', today.toISOString().split('T')[0]);

  for (const task of tasks || []) {
    const deadline = new Date(task.deadline);
    const isToday = deadline.toDateString() === today.toDateString();
    const isOverdue = deadline < today;

    let type: NotificationType;
    let title: string;
    let message: string;

    if (isOverdue) {
      type = 'deadline_overdue';
      title = 'Tarefa atrasada!';
      message = `A tarefa "${task.title}" está atrasada.`;
    } else if (isToday) {
      type = 'deadline_today';
      title = 'Prazo hoje!';
      message = `A tarefa "${task.title}" vence hoje.`;
    } else {
      type = 'deadline_approaching';
      title = 'Prazo se aproximando';
      message = `A tarefa "${task.title}" vence em ${Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} dias.`;
    }

    // Verificar se já existe notificação recente para esta tarefa
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('reference_type', 'task')
      .eq('reference_id', task.id)
      .eq('type', type)
      .gte('created_at', new Date(today.setHours(0, 0, 0, 0)).toISOString())
      .maybeSingle();

    if (!existing) {
      await createNotification({
        userId: user.id,
        type,
        title,
        message,
        link: `/tasks?id=${task.id}`,
        referenceType: 'task',
        referenceId: task.id
      });
    }
  }
}

/**
 * Verifica shows próximos e cria notificações
 */
export async function checkUpcomingShows(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Buscar shows de amanhã
  const { data: shows } = await supabase
    .from('shows')
    .select('*')
    .eq('status', 'fechado')
    .eq('show_date', tomorrow.toISOString().split('T')[0]);

  for (const show of shows || []) {
    // Verificar se já existe notificação
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('reference_type', 'show')
      .eq('reference_id', show.id)
      .eq('type', 'show_tomorrow')
      .gte('created_at', new Date(today.setHours(0, 0, 0, 0)).toISOString())
      .maybeSingle();

    if (!existing) {
      await createNotification({
        userId: user.id,
        type: 'show_tomorrow',
        title: 'Show amanhã!',
        message: `${show.title} - ${show.artist_name} em ${show.city}`,
        link: `/shows?id=${show.id}`,
        referenceType: 'show',
        referenceId: show.id
      });
    }
  }
}

/**
 * Verifica lançamentos próximos e cria notificações
 */
export async function checkUpcomingReleases(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  // Buscar releases nos próximos 7 dias
  const { data: releases } = await supabase
    .from('releases')
    .select('*')
    .neq('status', 'released')
    .lte('release_date', sevenDaysFromNow.toISOString().split('T')[0])
    .gte('release_date', today.toISOString().split('T')[0]);

  for (const release of releases || []) {
    const releaseDate = new Date(release.release_date);
    const daysUntil = Math.ceil((releaseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Verificar se já existe notificação recente
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('reference_type', 'release')
      .eq('reference_id', release.id)
      .eq('type', 'release_approaching')
      .gte('created_at', new Date(today.setHours(0, 0, 0, 0)).toISOString())
      .maybeSingle();

    if (!existing) {
      await createNotification({
        userId: user.id,
        type: 'release_approaching',
        title: 'Lançamento se aproximando!',
        message: `"${release.title}" de ${release.artist_name} sai em ${daysUntil} dias.`,
        link: `/releases?id=${release.id}`,
        referenceType: 'release',
        referenceId: release.id
      });
    }
  }
}

/**
 * Executa todas as verificações de prazos
 */
export async function runAllDeadlineChecks(): Promise<void> {
  await Promise.all([
    checkTaskDeadlines(),
    checkUpcomingShows(),
    checkUpcomingReleases()
  ]);
}

// ============================================
// NOTIFICAÇÕES ESPECÍFICAS
// ============================================

/**
 * Notifica quando uma tarefa é atribuída
 */
export async function notifyTaskAssigned(task: {
  id: string;
  title: string;
  assignedTo: string;
  assignedBy: string;
}): Promise<void> {
  // Buscar nome de quem atribuiu
  const { data: assigner } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('id', task.assignedBy)
    .single();

  await createNotification({
    userId: task.assignedTo,
    type: 'task_assigned',
    title: 'Nova tarefa atribuída',
    message: `${assigner?.full_name || 'Alguém'} atribuiu a tarefa "${task.title}" para você.`,
    link: `/tasks?id=${task.id}`,
    referenceType: 'task',
    referenceId: task.id
  });
}

/**
 * Notifica quando um show é confirmado
 */
export async function notifyShowConfirmed(show: {
  id: string;
  title: string;
  artist_name: string;
  show_date: string;
  city: string;
}, userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    await createNotification({
      userId,
      type: 'show_confirmed',
      title: 'Show confirmado!',
      message: `${show.title} - ${show.artist_name} em ${show.city} no dia ${formatDate(show.show_date)}`,
      link: `/shows?id=${show.id}`,
      referenceType: 'show',
      referenceId: show.id
    });
  }
}

/**
 * Notifica quando um pagamento é recebido
 */
export async function notifyPaymentReceived(data: {
  description: string;
  amount: number;
  userId: string;
}): Promise<void> {
  await createNotification({
    userId: data.userId,
    type: 'payment_received',
    title: 'Pagamento recebido!',
    message: `${data.description}: ${formatCurrency(data.amount)}`,
    link: '/finance',
    referenceType: 'payment'
  });
}

// ============================================
// UTILITÁRIOS
// ============================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function getNotificationIcon(type: NotificationType): string {
  return NOTIFICATION_CONFIG[type]?.icon || '🔔';
}

export function getNotificationColor(type: NotificationType): string {
  return NOTIFICATION_CONFIG[type]?.color || 'gray';
}

// ============================================
// NOTIFICAÇÕES EXTERNAS (Email + WhatsApp)
// ============================================

/**
 * Envia notificação via email e/ou WhatsApp (Supabase Edge Function)
 * Chamado automaticamente por createNotification quando aplicável
 */
export async function sendExternalNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  channels?: ('email' | 'whatsapp')[];
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        user_id: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        channels: data.channels || ['email', 'whatsapp'],
      },
    });
    if (error) console.warn('[Notification] Edge function error:', error.message);
  } catch (e) {
    // Notificações externas são best-effort; não quebrar o fluxo principal
    console.warn('[Notification] Failed to send external notification:', e);
  }
}

/**
 * Cria notificação in-app + envia externamente (email/WhatsApp)
 * Usar esta função para notificações importantes
 */
export async function createAndSendNotification(data: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  referenceType?: Notification['reference_type'];
  referenceId?: string;
  sendExternal?: boolean;
}): Promise<Notification> {
  const notification = await createNotification(data);

  if (data.sendExternal !== false) {
    // Fire-and-forget para não bloquear
    sendExternalNotification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    });
  }

  return notification;
}
