// Planning Integration Service - Integração com outros módulos do TaskMaster

import { supabase } from '../lib/supabase';

interface Task {
  id?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  moduleType: string;
  phaseId: string;
  planningId: string;
}

/**
 * Cria tarefa no TaskBoard e vincula ao planejamento
 */
export async function createTaskFromPlanning(task: Task): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // 1. Criar tarefa na tabela tasks
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        due_date: task.dueDate,
        workstream: mapModuleTypeToWorkstream(task.moduleType),
        created_by: user.user.id,
        metadata: {
          moduleType: task.moduleType,
          source: 'planning',
          planningId: task.planningId,
          phaseId: task.phaseId
        }
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return null;
    }

    // 2. Vincular tarefa à fase do planejamento
    const { error: linkError } = await supabase
      .from('planning_tasks')
      .insert({
        phase_id: task.phaseId,
        task_id: newTask.id,
        module_type: task.moduleType
      });

    if (linkError) {
      console.error('Error linking task to phase:', linkError);
    }

    // 3. Criar log de auditoria
    await createLog(task.planningId, 'task_created', {
      taskId: newTask.id,
      taskTitle: task.title,
      moduleType: task.moduleType,
      phaseId: task.phaseId
    });

    return newTask.id;
  } catch (error) {
    console.error('Error in createTaskFromPlanning:', error);
    return null;
  }
}

/**
 * Cria evento na agenda vinculado ao planejamento
 */
export async function createEventFromPlanning(
  planningId: string,
  phaseId: string,
  eventData: {
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    moduleType: string;
  }
): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Criar evento na tabela calendar_events
    const { data: newEvent, error } = await supabase
      .from('calendar_events')
      .insert({
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.startDate,
        event_type: 'planning',
        color: 'indigo',
        created_by: user.user.id,
        metadata: {
          moduleType: eventData.moduleType,
          source: 'planning',
          planningId,
          phaseId,
          endDate: eventData.endDate
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }

    await createLog(planningId, 'event_created', {
      eventId: newEvent.id,
      eventTitle: eventData.title,
      startDate: eventData.startDate
    });

    return newEvent.id;
  } catch (error) {
    console.error('Error in createEventFromPlanning:', error);
    return null;
  }
}

/**
 * Cria meta/KPI vinculada ao planejamento
 */
export async function createKPIFromPlanning(
  planningId: string,
  phaseId: string,
  kpiData: {
    name: string;
    description: string;
    targetValue: number;
    unit: string;
    dueDate?: string;
  }
): Promise<string | null> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('User not authenticated');
    }

    // Criar KPI na tabela kpis (ou similar)
    const { data: newKPI, error } = await supabase
      .from('kpis')
      .insert({
        name: kpiData.name,
        description: kpiData.description,
        target_value: kpiData.targetValue,
        current_value: 0,
        unit: kpiData.unit,
        due_date: kpiData.dueDate,
        created_by: user.user.id,
        metadata: {
          source: 'planning',
          planningId,
          phaseId
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating KPI:', error);
      return null;
    }

    await createLog(planningId, 'kpi_created', {
      kpiId: newKPI.id,
      kpiName: kpiData.name,
      targetValue: kpiData.targetValue
    });

    return newKPI.id;
  } catch (error) {
    console.error('Error in createKPIFromPlanning:', error);
    return null;
  }
}

/**
 * Distribui automaticamente todas as tarefas de um planejamento para os módulos corretos
 */
export async function distributeTasksToModules(
  planningId: string,
  phases: Array<{
    id: string;
    tasks: Array<{
      title: string;
      description: string;
      moduleType: string;
      priority: string;
      dueDate?: string;
    }>;
  }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const phase of phases) {
    for (const task of phase.tasks) {
      const taskId = await createTaskFromPlanning({
        title: task.title,
        description: task.description,
        status: 'todo',
        priority: task.priority,
        dueDate: task.dueDate,
        moduleType: task.moduleType,
        phaseId: phase.id,
        planningId
      });

      if (taskId) {
        success++;
      } else {
        failed++;
      }
    }
  }

  // Log final de distribuição
  await createLog(planningId, 'tasks_distributed', {
    totalSuccess: success,
    totalFailed: failed,
    timestamp: new Date().toISOString()
  });

  return { success, failed };
}

/**
 * Cria log de auditoria no planning_logs
 */
async function createLog(
  planningId: string,
  action: string,
  details: Record<string, any>
): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();

    await supabase.from('planning_logs').insert({
      planning_id: planningId,
      action,
      user_id: user.user?.id,
      details
    });
  } catch (error) {
    console.error('Error creating log:', error);
  }
}

/**
 * Busca todas as tarefas vinculadas a um planejamento
 */
export async function getTasksByPlanning(planningId: string) {
  try {
    const { data, error } = await supabase
      .from('planning_tasks')
      .select(`
        *,
        phase:planning_phases(id, name),
        task:tasks(*)
      `)
      .eq('planning_phases.planning_id', planningId);

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTasksByPlanning:', error);
    return [];
  }
}

/**
 * Mapeia tipo de módulo para workstream do TaskBoard
 */
function mapModuleTypeToWorkstream(moduleType: string): string {
  const mapping: Record<string, string> = {
    'content': 'conteudo',
    'conteudo': 'conteudo',
    'shows': 'shows',
    'logistics': 'logistica',
    'logistica': 'logistica',
    'strategy': 'estrategia',
    'estrategia': 'estrategia',
    'general': 'geral',
    'geral': 'geral'
  };

  return mapping[moduleType.toLowerCase()] || 'geral';
}

/**
 * Busca logs de auditoria de um planejamento
 */
export async function getPlanningLogs(planningId: string) {
  try {
    const { data, error } = await supabase
      .from('planning_logs')
      .select('*')
      .eq('planning_id', planningId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPlanningLogs:', error);
    return [];
  }
}
