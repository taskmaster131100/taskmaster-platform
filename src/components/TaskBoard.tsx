import React, { useState, useEffect } from 'react';
import {
  Plus, Clock, CheckCircle, AlertCircle,
  Loader2, Edit2, Trash2, X, FileText, User, Briefcase,
  LayoutGrid, List, ChevronDown, ChevronRight, CheckSquare2, Circle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { useSubscription } from '../hooks/useSubscription';
import PlanLimitModal from './PlanLimitModal';

interface Task {
  id: string;
  organization_id?: string;
  title: string;
  description?: string;
  notes?: string;
  status: string;
  priority?: string;
  workstream?: string;
  project_id?: string;
  due_date?: string;
  reporter_id?: string;
  assignee_id?: string;
  labels?: string[];
  order_index?: number;
  parent_task_id?: string | null;
  phase?: string;
  created_at?: string;
  updated_at?: string;
}

interface OrgMember {
  id: string;
  name: string;
}

interface AvailableProject { id: string; name: string; }

interface TaskBoardProps {
  tasks?: Task[];
  departments?: any[];
  project?: any;
  availableProjects?: AvailableProject[];
  onTasksChange?: (tasks: Task[]) => void;
  defaultView?: 'kanban' | 'departments';
  /** Pré-seleciona um workstream e abre na view de departamentos */
  defaultWorkstream?: string;
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks: propTasks = [],
  departments = [],
  project,
  availableProjects = [],
  onTasksChange,
  defaultView = 'kanban',
  defaultWorkstream
}) => {
  const { organizationId } = useAuth();
  const { limits: planLimits } = useSubscription(organizationId || undefined);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  // Se defaultWorkstream vier, pré-filtra e abre na view de departamentos
  const [filterWorkstream, setFilterWorkstream] = useState<string>(defaultWorkstream || 'all');
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'kanban' | 'departments'>(
    defaultWorkstream ? 'departments' : defaultView
  );
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [taskLimitModal, setTaskLimitModal] = useState(false);

  // Filtro por artista (modo global)
  const [filterArtistId, setFilterArtistId] = useState<string>('');
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  // Sub-tarefas: set de IDs de tarefas pai expandidas
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  // Mapa project_id → artist_id, construído uma vez no mount (modo global)
  const [projectArtistMap, setProjectArtistMap] = useState<Map<string, string>>(new Map());
  // Mapa project_id → project name, construído da query (não depende do prop availableProjects)
  const [projectNamesMap, setProjectNamesMap] = useState<Map<string, string>>(new Map());

  const columns = [
    { id: 'todo',        title: 'A Fazer',      icon: Clock,         color: 'gray' },
    { id: 'in_progress', title: 'Em Progresso',  icon: AlertCircle,   color: 'blue' },
    { id: 'blocked',     title: 'Bloqueado',     icon: AlertCircle,   color: 'red' },
    { id: 'done',        title: 'Concluído',     icon: CheckCircle,   color: 'green' }
  ];

  const workstreams = [
    { id: 'all',               label: 'Todos' },
    { id: 'producao_musical',  label: 'Produção Musical' },
    { id: 'conteudo',          label: 'Conteúdo' },
    { id: 'marketing',         label: 'Marketing' },
    { id: 'shows',             label: 'Shows' },
    { id: 'logistica',         label: 'Logística' },
    { id: 'estrategia',        label: 'Estratégia' },
    { id: 'financeiro',        label: 'Financeiro' },
    { id: 'lancamento',        label: 'Lançamento' },
    { id: 'geral',             label: 'Geral' }
  ];

  useEffect(() => {
    loadTasks();
    loadOrgMembers();

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [project?.id, filterProjectId, organizationId]);

  // Carrega artistas e mapa project→artist apenas no modo global
  // Não aguarda organizationId — RLS filtra pelo usuário logado; quando org resolver, re-executa
  useEffect(() => {
    if (project?.id) return; // só modo global

    async function loadArtistContext() {
      let artistsQuery = supabase.from('artists').select('id, name, stage_name').neq('status', 'archived');
      // Busca TODOS os projetos ativos para montar mapa de nomes E mapa artista
      let projectsQuery = supabase.from('projects').select('id, name, title, artist_id').neq('status', 'archived');

      if (organizationId) {
        artistsQuery = artistsQuery.eq('organization_id', organizationId);
        projectsQuery = projectsQuery.eq('organization_id', organizationId);
      }

      const [artistsResult, projectsResult] = await Promise.all([artistsQuery, projectsQuery]);

      const artistMap = new Map<string, string>();
      const namesMap = new Map<string, string>();

      (projectsResult.data || []).forEach((p: any) => {
        // Mapa de nomes: todos os projetos
        const name = p.name || p.title || 'Projeto';
        namesMap.set(p.id, name);
        // Mapa artista: só projetos com artist_id
        if (p.artist_id) artistMap.set(p.id, p.artist_id);
      });

      setProjectArtistMap(artistMap);
      setProjectNamesMap(namesMap);

      setArtists(
        (artistsResult.data || []).map((a: any) => ({
          id: a.id,
          name: a.stage_name || a.name,
        }))
      );
    }

    loadArtistContext();
  }, [project?.id, organizationId]);

  async function loadTasks() {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (project?.id) {
        query = query.eq('project_id', project.id);
      } else if (filterProjectId) {
        query = query.eq('project_id', filterProjectId);
      } else {
        // Modo global: usa organizationId do contexto; se ainda null, busca direto no banco
        let orgId = organizationId;
        if (!orgId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: orgData } = await supabase
              .from('user_organizations')
              .select('organization_id')
              .eq('user_id', user.id)
              .maybeSingle();
            orgId = orgData?.organization_id || null;
          }
        }
        if (orgId) {
          query = query.eq('organization_id', orgId);
        }
        // Se ainda sem org, RLS do Supabase filtra pelo usuário
      }

      const { data, error } = await query;
      if (error) throw error;

      setTasks(data || []);
      if (onTasksChange) onTasksChange(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgMembers() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!orgData?.organization_id) return;

      const { data: memberRows } = await supabase
        .from('user_organizations')
        .select('user_id')
        .eq('organization_id', orgData.organization_id);

      if (!memberRows?.length) return;

      const userIds = memberRows.map((m: any) => m.user_id);

      // Busca perfis — mas inclui todos os membros mesmo sem perfil
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

      setOrgMembers(
        userIds.map((id: string) => ({
          id,
          name: profileMap.get(id) || `Membro ${id.substring(0, 6)}`
        }))
      );
    } catch {
      // silently fail — assignee display degrades gracefully
    }
  }

  // IDs de projetos vinculados ao artista selecionado
  const artistProjectIds = filterArtistId
    ? [...projectArtistMap.entries()]
        .filter(([, aid]) => aid === filterArtistId)
        .map(([pid]) => pid)
    : [];

  // Mapa: parent_task_id → sub-tarefas
  const subTaskMap = new Map<string, Task[]>();
  tasks.forEach(t => {
    if (t.parent_task_id) {
      const list = subTaskMap.get(t.parent_task_id) || [];
      list.push(t);
      subTaskMap.set(t.parent_task_id, list);
    }
  });

  const getTasksByStatus = (status: string) => {
    // Mostrar apenas tarefas pai (sem parent_task_id)
    let filtered = tasks.filter(task => task.status === status && !task.parent_task_id);
    // Filtro por artista: só aplica se existirem projetos vinculados ao artista
    if (filterArtistId && artistProjectIds.length > 0) {
      filtered = filtered.filter(task =>
        task.project_id != null && artistProjectIds.includes(task.project_id)
      );
    }
    if (filterWorkstream !== 'all') {
      filtered = filtered.filter(task => task.workstream === filterWorkstream);
    }
    return filtered;
  };

  // Mapa para exibir nome do projeto no card (modo global)
  const projectNameMap = new Map<string, string>(
    (availableProjects || []).map(p => [p.id, p.name])
  );

  const getMemberName = (assigneeId?: string): string | null => {
    if (!assigneeId) return null;
    return orgMembers.find(m => m.id === assigneeId)?.name || null;
  };

  function getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  async function handleCreateTask(taskData: any) {
    try {
      if (!taskData.title || taskData.title.trim() === '') {
        toast.error('O título da tarefa é obrigatório');
        return;
      }
      if (taskData.title.length > 200) {
        toast.error('O título deve ter no máximo 200 caracteres');
        return;
      }
      if (!taskData.workstream) {
        toast.error('Selecione um workstream para a tarefa');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Você precisa estar autenticado'); return; }

      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!orgData?.organization_id) {
        toast.error('Você precisa estar vinculado a uma organização');
        return;
      }

      // project_id: usar o do prop (modo projeto) ou o selecionado no modal (modo global)
      const resolvedProjectId = project?.id || taskData.project_id || null;

      const { error } = await supabase
        .from('tasks')
        .insert({
          organization_id: orgData.organization_id,
          title: taskData.title.trim(),
          description: taskData.description?.trim() || null,
          notes: taskData.notes?.trim() || null,
          status: 'todo',
          priority: taskData.priority || 'medium',
          workstream: taskData.workstream || 'geral',
          due_date: taskData.due_date || null,
          reporter_id: user.id,
          assignee_id: taskData.assignee_id || null,
          ...(resolvedProjectId ? { project_id: resolvedProjectId } : {}),
        });

      if (error) throw error;

      setShowCreateModal(false);
      toast.success('Tarefa criada com sucesso!');
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Erro ao criar tarefa');
    }
  }

  async function handleUpdateTask(taskId: string, updates: any) {
    try {
      const safeUpdates: any = {};
      if (updates.title       !== undefined) safeUpdates.title       = updates.title;
      if (updates.description !== undefined) safeUpdates.description = updates.description;
      if (updates.notes       !== undefined) safeUpdates.notes       = updates.notes;
      if (updates.status      !== undefined) safeUpdates.status      = updates.status;
      if (updates.priority    !== undefined) safeUpdates.priority    = updates.priority;
      if (updates.workstream  !== undefined) safeUpdates.workstream  = updates.workstream;
      if (updates.due_date    !== undefined) safeUpdates.due_date    = updates.due_date;
      if (updates.assignee_id !== undefined) safeUpdates.assignee_id = updates.assignee_id;

      const { error } = await supabase
        .from('tasks')
        .update(safeUpdates)
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Tarefa atualizada!');
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Erro ao atualizar tarefa');
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Tarefa excluída!');
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Erro ao excluir tarefa');
    }
  }

  function handleDragEnd(result: any) {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    handleUpdateTask(draggableId, { status: destination.droppableId });
  }

  const getPriorityColor = (task: Task) => {
    switch (task.priority || 'medium') {
      case 'high':   return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low':    return 'bg-green-100 text-green-700';
      default:       return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityLabel = (task: Task) => {
    const p = task.priority || 'medium';
    return p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {!project?.id && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Nenhum projeto selecionado — exibindo todas as tarefas.
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tarefas</h2>
            <p className="text-gray-600">
              {project?.id ? `Projeto: ${project.name || project.title} · ` : ''}
              {tasks.length}{planLimits.maxTasks !== -1 ? ` / ${planLimits.maxTasks}` : ''} tarefas
            </p>
          </div>
          <button
            onClick={() => {
              if (planLimits.maxTasks !== -1 && tasks.length >= planLimits.maxTasks) {
                setTaskLimitModal(true);
                return;
              }
              setShowCreateModal(true);
            }}
            className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        </div>

        {/* Filtros + view toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro por artista (só em modo global, quando há artistas cadastrados) */}
          {!project?.id && artists.length > 0 && (
            <select
              value={filterArtistId}
              onChange={(e) => {
                setFilterArtistId(e.target.value);
                // Limpar filtro de projeto ao mudar artista para evitar conflito
                if (e.target.value) setFilterProjectId('');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            >
              <option value="">Todos os artistas</option>
              {artists.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}

          {/* Filtro por projeto (só em modo global) */}
          {!project?.id && availableProjects.length > 0 && (
            <select
              value={filterProjectId}
              onChange={(e) => {
                setFilterProjectId(e.target.value);
                // Limpar filtro de artista ao selecionar projeto específico
                if (e.target.value) setFilterArtistId('');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            >
              <option value="">
                {filterArtistId ? 'Projetos do artista' : 'Todos os projetos'}
              </option>
              {availableProjects
                .filter(p =>
                  // Se artista selecionado, mostra só projetos desse artista
                  !filterArtistId || projectArtistMap.get(p.id) === filterArtistId
                )
                .map(p => {
                  // Se nenhum artista selecionado, mostra o artista do projeto entre parênteses
                  const artistId = projectArtistMap.get(p.id);
                  const artistName = !filterArtistId && artistId
                    ? artists.find(a => a.id === artistId)?.name
                    : null;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name}{artistName ? ` (${artistName})` : ''}
                    </option>
                  );
                })}
            </select>
          )}

          {/* Filtro por área */}
          <select
            value={filterWorkstream}
            onChange={(e) => setFilterWorkstream(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
          >
            {workstreams.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.label}</option>
            ))}
          </select>

          {/* Toggle Kanban / Por Área */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-[#FFAD85] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Visão Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('departments')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
                viewMode === 'departments' ? 'bg-[#FFAD85] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Visão por Área"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Por Área</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Visão Por Área ─────────────────────────────────────────────────── */}
      {viewMode === 'departments' && (() => {
        const allFiltered = tasks.filter(t => {
          if (t.parent_task_id) return false;
          if (filterArtistId && !(t.project_id && projectArtistMap.get(t.project_id) === filterArtistId)) return false;
          if (filterWorkstream !== 'all' && t.workstream !== filterWorkstream) return false;
          return true;
        });
        const activeWorkstreams = workstreams.filter(ws =>
          ws.id !== 'all' && allFiltered.some(t => t.workstream === ws.id || (!t.workstream && ws.id === 'geral'))
        );
        if (allFiltered.length === 0) {
          return (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg font-medium">Nenhuma tarefa encontrada</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            {activeWorkstreams.map(ws => {
              const wsTasks = allFiltered.filter(t =>
                ws.id === 'geral' ? (!t.workstream || t.workstream === 'geral') : t.workstream === ws.id
              );
              if (wsTasks.length === 0) return null;
              return (
                <div key={ws.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{ws.label}</h3>
                    <span className="text-xs text-gray-500">{wsTasks.length} tarefa{wsTasks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {wsTasks.map(task => {
                      const assigneeName = getMemberName(task.assignee_id);
                      const statusColors: Record<string, string> = {
                        todo: 'bg-gray-100 text-gray-600',
                        in_progress: 'bg-blue-100 text-blue-700',
                        blocked: 'bg-red-100 text-red-700',
                        done: 'bg-green-100 text-green-700',
                      };
                      const statusLabels: Record<string, string> = {
                        todo: 'A Fazer',
                        in_progress: 'Em Progresso',
                        blocked: 'Bloqueado',
                        done: 'Concluído',
                      };
                      return (
                        <div key={task.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {task.due_date && (
                              <span className="text-xs text-gray-500 hidden sm:block">
                                {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                            {assigneeName && (
                              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold" title={assigneeName}>
                                {getInitials(assigneeName)}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
                              {statusLabels[task.status] || task.status}
                            </span>
                            <button
                              onClick={() => { setSelectedTask(task); setShowEditModal(true); }}
                              className="p-1 text-gray-400 hover:text-[#FFAD85] transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Aviso: artista sem projetos vinculados → mostra todas as tarefas ── */}
      {filterArtistId && !loading && artistProjectIds.length === 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          Este artista não tem projetos vinculados — exibindo todas as tarefas da organização. Para filtrar por artista, crie um projeto para este artista pelo Copilot (Planejamento IA).
        </div>
      )}
      {/* ── Aviso: artista tem projetos mas sem tarefas ──────────────────────── */}
      {filterArtistId && !loading && artistProjectIds.length > 0 && columns.every(col => getTasksByStatus(col.id).length === 0) && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          Os projetos deste artista ainda não têm tarefas cadastradas.
        </div>
      )}

      {/* ── Visão Kanban ────────────────────────────────────────────────────── */}
      {viewMode === 'kanban' && <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.id);
            const Icon = column.icon;

            return (
              <div key={column.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 text-${column.color}-600`} />
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="ml-auto text-sm text-gray-500">{columnTasks.length}</span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 min-h-[200px] ${
                        snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                      }`}
                    >
                      {columnTasks.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          Nenhuma tarefa
                        </div>
                      ) : (
                        columnTasks.map((task, index) => {
                          const assigneeName = getMemberName(task.assignee_id);
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-move ${
                                    snapshot.isDragging ? 'shadow-lg ring-2 ring-[#FFAD85]' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-gray-900 flex-1 pr-1">{task.title}</h4>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        onClick={() => {
                                          setSelectedTask(task);
                                          setShowEditModal(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-[#FFAD85] transition-colors"
                                        title="Editar"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {task.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                      {task.description}
                                    </p>
                                  )}

                                  {/* Badge de projeto (modo global) */}
                                  {!project?.id && task.project_id && (projectNamesMap.has(task.project_id) || projectNameMap.has(task.project_id)) && (
                                    <div className="mb-1.5">
                                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-medium border border-orange-100 truncate max-w-full">
                                        <Briefcase className="w-2.5 h-2.5 flex-shrink-0" />
                                        {projectNamesMap.get(task.project_id) || projectNameMap.get(task.project_id)}
                                      </span>
                                    </div>
                                  )}

                                  {/* Badges: prioridade, workstream, prazo */}
                                  <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPriorityColor(task)}`}>
                                      {getPriorityLabel(task)}
                                    </span>
                                    {task.workstream && task.workstream !== 'geral' && (
                                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                                        {workstreams.find(w => w.id === task.workstream)?.label || task.workstream}
                                      </span>
                                    )}
                                    {task.due_date && (
                                      <span className="text-xs text-gray-500">
                                        {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                  </div>

                                  {/* Sub-tarefas expandíveis */}
                                  {(() => {
                                    const subs = subTaskMap.get(task.id) || [];
                                    if (subs.length === 0) return null;
                                    const isExpanded = expandedParents.has(task.id);
                                    const doneSubs = subs.filter(s => s.status === 'done').length;
                                    return (
                                      <div className="mt-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedParents(prev => {
                                              const next = new Set(prev);
                                              if (next.has(task.id)) next.delete(task.id);
                                              else next.add(task.id);
                                              return next;
                                            });
                                          }}
                                          className="flex items-center gap-1.5 w-full text-left text-xs text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors"
                                        >
                                          {isExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                                          {doneSubs}/{subs.length} sub-tarefas
                                          <div className="flex-1 h-1 bg-indigo-200 rounded-full ml-1">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${subs.length > 0 ? (doneSubs / subs.length) * 100 : 0}%` }} />
                                          </div>
                                        </button>
                                        {isExpanded && (
                                          <div className="mt-1 space-y-1 pl-1">
                                            {subs.map(sub => (
                                              <div key={sub.id} className="flex items-center gap-1.5 text-xs text-gray-600 py-0.5">
                                                {sub.status === 'done'
                                                  ? <CheckSquare2 className="w-3 h-3 text-green-500 shrink-0" />
                                                  : <Circle className="w-3 h-3 text-gray-300 shrink-0" />
                                                }
                                                <span className={`truncate ${sub.status === 'done' ? 'line-through text-gray-400' : ''}`}>{sub.title}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Rodapé: responsável + indicador de notas */}
                                  <div className="flex items-center justify-between mt-1">
                                    {assigneeName ? (
                                      <span
                                        className="inline-flex items-center gap-1 text-xs text-gray-600 bg-white border border-gray-200 rounded-full px-2 py-0.5"
                                        title={assigneeName}
                                      >
                                        <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold">
                                          {getInitials(assigneeName)}
                                        </span>
                                        <span className="max-w-[80px] truncate">{assigneeName.split(' ')[0]}</span>
                                      </span>
                                    ) : (
                                      <span />
                                    )}
                                    {task.notes && (
                                      <span
                                        className="flex items-center gap-1 text-[10px] text-gray-400"
                                        title="Tem observações"
                                      >
                                        <FileText className="w-3 h-3" />
                                        obs
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>}

      {/* Modal de Criação */}
      {showCreateModal && (
        <TaskFormModal
          title="Nova Tarefa"
          orgMembers={orgMembers}
          availableProjects={availableProjects}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedTask && (
        <TaskFormModal
          title="Editar Tarefa"
          task={selectedTask}
          orgMembers={orgMembers}
          availableProjects={[]}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          onSave={(data) => {
            handleUpdateTask(selectedTask.id, data);
            setShowEditModal(false);
            setSelectedTask(null);
          }}
        />
      )}

      {taskLimitModal && (
        <PlanLimitModal
          resource="tarefas"
          limit={planLimits.maxTasks}
          planName={planLimits.displayName || 'Plano atual'}
          onClose={() => setTaskLimitModal(false)}
          onUpgrade={() => navigate('/profile')}
        />
      )}
    </div>
  );
};

// ── Modal de formulário ────────────────────────────────────────────────────────
function TaskFormModal({
  title,
  task,
  orgMembers,
  availableProjects = [],
  onClose,
  onSave
}: {
  title: string;
  task?: Task;
  orgMembers: OrgMember[];
  availableProjects?: AvailableProject[];
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const showProjectSelector = availableProjects.length > 0;
  const workstreams = [
    { id: 'producao_musical',  label: 'Produção Musical' },
    { id: 'conteudo',          label: 'Conteúdo' },
    { id: 'marketing',         label: 'Marketing' },
    { id: 'shows',             label: 'Shows' },
    { id: 'logistica',         label: 'Logística' },
    { id: 'estrategia',        label: 'Estratégia' },
    { id: 'financeiro',        label: 'Financeiro' },
    { id: 'lancamento',        label: 'Lançamento' },
    { id: 'geral',             label: 'Geral' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          className="px-6 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onSave({
              title:       fd.get('title'),
              description: fd.get('description'),
              notes:       fd.get('notes'),
              workstream:  fd.get('workstream'),
              priority:    fd.get('priority'),
              due_date:    fd.get('due_date') || null,
              assignee_id: fd.get('assignee_id') || null,
              project_id:  fd.get('project_id') || null,
            });
          }}
        >
          <div className="space-y-4">

            {/* Projeto — só aparece no modo global (sem projeto no contexto) */}
            {showProjectSelector && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                  Projeto
                </label>
                <select
                  name="project_id"
                  defaultValue=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
                >
                  <option value="">— Sem projeto (tarefa avulsa) —</option>
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                type="text"
                required
                defaultValue={task?.title}
                placeholder="Nome da tarefa"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                rows={2}
                defaultValue={task?.description}
                placeholder="Descreva o objetivo desta tarefa..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Área + Prioridade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Área</label>
                <select
                  name="workstream"
                  defaultValue={task?.workstream || 'geral'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
                >
                  {workstreams.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prioridade</label>
                <select
                  name="priority"
                  defaultValue={task?.priority || 'medium'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            {/* Prazo + Responsável */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prazo</label>
                <input
                  name="due_date"
                  type="date"
                  defaultValue={task?.due_date?.split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  Responsável
                </label>
                <select
                  name="assignee_id"
                  defaultValue={task?.assignee_id || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
                >
                  <option value="">— Sem responsável —</option>
                  {orgMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observações internas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-gray-500" />
                Observações internas
              </label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={task?.notes}
                placeholder="Registre o que falta, dependências, ajustes ou recados para o time..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-amber-50/40 focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm resize-none placeholder-gray-400"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Campo interno — visível apenas para a equipe.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors text-sm font-bold"
            >
              {task ? 'Salvar alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskBoard;
