import { supabase } from '../lib/supabase';
import { createShowRevenue, markShowAsPaid, createShowExpenses } from './financeService';
import { notifyShowConfirmed, notifyTaskAssigned } from './notificationService';

// ============================================
// INTEGRAÇÃO: SHOWS
// ============================================

/**
 * Templates de checklist para shows
 */
const SHOW_CHECKLIST_TEMPLATES = {
  before: [
    { title: 'Contrato assinado', days_before: 30, category: 'legal' },
    { title: 'Rider técnico enviado', days_before: 21, category: 'production' },
    { title: 'Rider de camarim enviado', days_before: 21, category: 'production' },
    { title: 'Entrada (50%) recebida', days_before: 14, category: 'financial' },
    { title: 'Transporte confirmado', days_before: 7, category: 'logistics' },
    { title: 'Hospedagem confirmada', days_before: 7, category: 'logistics' },
    { title: 'Passagem de som agendada', days_before: 3, category: 'production' },
    { title: 'Setlist definido', days_before: 3, category: 'production' },
    { title: 'Equipe técnica confirmada', days_before: 3, category: 'team' },
    { title: 'Materiais de divulgação enviados', days_before: 7, category: 'marketing' },
  ],
  day: [
    { title: 'Check-in no local', days_before: 0, category: 'logistics' },
    { title: 'Passagem de som realizada', days_before: 0, category: 'production' },
    { title: 'Camarim OK', days_before: 0, category: 'production' },
    { title: 'Show realizado', days_before: 0, category: 'production' },
  ],
  after: [
    { title: 'Saldo (50%) recebido', days_after: 7, category: 'financial' },
    { title: 'Fotos/vídeos coletados', days_after: 3, category: 'marketing' },
    { title: 'Feedback do contratante', days_after: 7, category: 'marketing' },
    { title: 'Relatório do show', days_after: 7, category: 'admin' },
  ]
};

/**
 * Quando um show é fechado, executa todas as integrações
 */
export async function onShowClosed(show: {
  id: string;
  title: string;
  artist_name: string;
  show_date: string;
  venue?: string;
  city: string;
  value?: number;
  currency?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // 1. Criar transação financeira (receita do cachê)
  if (show.value && show.value > 0) {
    await createShowRevenue(show);
  }

  // 2. Criar checklist completo do show
  await createShowChecklist(show.id, show.show_date, user.id);

  // 3. Criar evento no calendário (se não existir)
  await ensureCalendarEvent(show, user.id);

  // 4. Notificar equipe
  const teamUserIds = await getTeamUserIds();
  if (teamUserIds.length > 0) {
    await notifyShowConfirmed(show, teamUserIds);
  }
}

/**
 * Quando um show é marcado como pago
 */
export async function onShowPaid(showId: string): Promise<void> {
  await markShowAsPaid(showId);
}

/**
 * Cria checklist completo para um show
 */
async function createShowChecklist(showId: string, showDate: string, userId: string): Promise<void> {
  const showDateObj = new Date(showDate);
  const tasks = [];

  // Tarefas ANTES do show
  for (const item of SHOW_CHECKLIST_TEMPLATES.before) {
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
  for (const item of SHOW_CHECKLIST_TEMPLATES.day) {
    tasks.push({
      show_id: showId,
      title: item.title,
      category: item.category,
      status: 'pending',
      due_date: showDate,
      created_by: userId
    });
  }

  // Tarefas APÓS o show
  for (const item of SHOW_CHECKLIST_TEMPLATES.after) {
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

  // Inserir todas as tarefas
  await supabase.from('show_tasks').insert(tasks);
}

/**
 * Garante que existe evento no calendário para o show
 */
async function ensureCalendarEvent(show: {
  id: string;
  title: string;
  artist_name: string;
  show_date: string;
  venue?: string;
  city: string;
}, userId: string): Promise<void> {
  // Verificar se já existe
  const { data: existing } = await supabase
    .from('calendar_events')
    .select('id')
    .eq('metadata->>show_id', show.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from('calendar_events').insert({
      title: `Show: ${show.title}`,
      description: `${show.artist_name} em ${show.venue || show.city}`,
      event_date: show.show_date,
      event_type: 'show',
      color: 'purple',
      location: `${show.venue || ''}, ${show.city}`,
      created_by: userId,
      metadata: {
        show_id: show.id,
        artist_name: show.artist_name,
        status: 'fechado'
      }
    });
  }
}

// ============================================
// INTEGRAÇÃO: RELEASES (LANÇAMENTOS)
// ============================================

/**
 * Templates de tarefas por departamento para releases
 */
const RELEASE_TASK_TEMPLATES = {
  single: {
    production: [
      { title: 'Finalizar composição', weeks_before: 10 },
      { title: 'Definir arranjo', weeks_before: 9 },
      { title: 'Agendar estúdio', weeks_before: 8 },
      { title: 'Gravar guia', weeks_before: 7 },
      { title: 'Gravar instrumentos', weeks_before: 6 },
      { title: 'Gravar vocais', weeks_before: 5 },
    ],
    post_production: [
      { title: 'Mixagem', weeks_before: 4 },
      { title: 'Revisão da mixagem', weeks_before: 3 },
      { title: 'Masterização', weeks_before: 3 },
      { title: 'Aprovação final do áudio', weeks_before: 2 },
    ],
    artwork: [
      { title: 'Criar briefing para designer', weeks_before: 6 },
      { title: 'Enviar briefing para designer', weeks_before: 5 },
      { title: 'Revisar propostas de arte', weeks_before: 4 },
      { title: 'Aprovar arte final', weeks_before: 3 },
      { title: 'Adaptar arte para plataformas', weeks_before: 2 },
    ],
    distribution: [
      { title: 'Cadastrar na distribuidora', weeks_before: 3 },
      { title: 'Preencher metadados (ISRC, etc)', weeks_before: 3 },
      { title: 'Configurar pré-save', weeks_before: 2 },
      { title: 'Verificar disponibilidade nas plataformas', weeks_before: 0 },
    ],
    marketing: [
      { title: 'Definir estratégia de lançamento', weeks_before: 6 },
      { title: 'Criar conteúdo teaser', weeks_before: 3 },
      { title: 'Preparar release de imprensa', weeks_before: 2 },
      { title: 'Agendar posts de divulgação', weeks_before: 1 },
      { title: 'Enviar para playlists/curadores', weeks_before: 2 },
    ],
    financial: [
      { title: 'Orçar custos de produção', weeks_before: 10 },
      { title: 'Aprovar orçamento', weeks_before: 9 },
      { title: 'Pagar estúdio', weeks_before: 4 },
      { title: 'Pagar designer', weeks_before: 2 },
      { title: 'Pagar distribuição', weeks_before: 3 },
    ]
  }
};

/**
 * Quando um release é criado, gera tarefas para todos os departamentos
 */
export async function onReleaseCreated(release: {
  id: string;
  title: string;
  artist_name: string;
  release_type: 'single' | 'ep' | 'album';
  release_date: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const releaseDateObj = new Date(release.release_date);
  const template = RELEASE_TASK_TEMPLATES.single; // Por enquanto usando single para todos
  
  const allTasks = [];

  // Gerar tarefas de cada departamento
  for (const [department, tasks] of Object.entries(template)) {
    for (const task of tasks) {
      const dueDate = new Date(releaseDateObj);
      dueDate.setDate(dueDate.getDate() - (task.weeks_before * 7));

      allTasks.push({
        title: task.title,
        description: `${release.title} - ${release.artist_name}`,
        workstream: department,
        status: 'todo',
        deadline: dueDate.toISOString().split('T')[0],
        created_by: user.id,
        metadata: {
          release_id: release.id,
          release_title: release.title,
          department: department
        }
      });
    }
  }

  // Inserir todas as tarefas
  await supabase.from('tasks').insert(allTasks);

  // Criar evento de lançamento no calendário
  await supabase.from('calendar_events').insert({
    title: `Lançamento: ${release.title}`,
    description: `${release.artist_name} - ${release.release_type.toUpperCase()}`,
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

// ============================================
// INTEGRAÇÃO: TAREFAS
// ============================================

/**
 * Quando uma tarefa é atribuída a alguém
 */
export async function onTaskAssigned(task: {
  id: string;
  title: string;
  assignedTo: string;
  assignedBy: string;
}): Promise<void> {
  if (task.assignedTo && task.assignedTo !== task.assignedBy) {
    await notifyTaskAssigned(task);
  }
}

/**
 * Quando uma tarefa é concluída, verifica se há tarefas dependentes
 */
export async function onTaskCompleted(taskId: string): Promise<void> {
  // Buscar tarefas que dependem desta
  const { data: dependentTasks } = await supabase
    .from('tasks')
    .select('*')
    .contains('dependencies', [taskId])
    .eq('status', 'blocked');

  if (dependentTasks && dependentTasks.length > 0) {
    for (const task of dependentTasks) {
      // Verificar se todas as dependências foram concluídas
      const { data: dependencies } = await supabase
        .from('tasks')
        .select('status')
        .in('id', task.dependencies || []);

      const allCompleted = dependencies?.every(d => d.status === 'done');
      
      if (allCompleted) {
        await supabase
          .from('tasks')
          .update({ status: 'todo' })
          .eq('id', task.id);
      }
    }
  }
}

// ============================================
// INTEGRAÇÃO: FINANCEIRO
// ============================================

/**
 * Adiciona despesas de logística a um show
 */
export async function addShowLogistics(showId: string, expenses: {
  transport?: number;
  accommodation?: number;
  food?: number;
  crew?: number;
}): Promise<void> {
  // Buscar dados do show
  const { data: show } = await supabase
    .from('shows')
    .select('*')
    .eq('id', showId)
    .single();

  if (show) {
    await createShowExpenses({
      id: show.id,
      title: show.title,
      show_date: show.show_date
    }, expenses);
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Busca IDs de usuários da equipe
 */
async function getTeamUserIds(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Buscar organização do usuário
  const { data: orgData } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!orgData) return [user.id];

  // Buscar membros da organização
  const { data: members } = await supabase
    .from('user_organizations')
    .select('user_id')
    .eq('organization_id', orgData.organization_id);

  return members?.map(m => m.user_id) || [user.id];
}

/**
 * Calcula o resumo de um projeto
 */
export async function getProjectSummary(projectId: string): Promise<{
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  progress: number;
}> {
  const today = new Date().toISOString().split('T')[0];

  const { data: tasks } = await supabase
    .from('tasks')
    .select('status, deadline')
    .eq('metadata->>project_id', projectId);

  const summary = {
    totalTasks: tasks?.length || 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    progress: 0
  };

  for (const task of tasks || []) {
    if (task.status === 'done') {
      summary.completedTasks++;
    } else {
      summary.pendingTasks++;
      if (task.deadline && task.deadline < today) {
        summary.overdueTasks++;
      }
    }
  }

  summary.progress = summary.totalTasks > 0 
    ? Math.round((summary.completedTasks / summary.totalTasks) * 100) 
    : 0;

  return summary;
}
