import React, { useState, useEffect } from 'react';
import {
  Plus, Clock, CheckCircle, AlertCircle, Archive,
  Loader2, Edit2, Trash2, X, FileText, User, Briefcase
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
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks: propTasks = [],
  departments = [],
  project,
  availableProjects = [],
  onTasksChange
}) => {
  const { organizationId } = useAuth();
  const { limits: planLimits } = useSubscription(organizationId || undefined);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterWorkstream, setFilterWorkstream] = useState<string>('all');
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [taskLimitModal, setTaskLimitModal] = useState(false);

  const columns = [
    { id: 'todo',        title: 'A Fazer',      icon: Clock,         color: 'gray' },
    { id: 'in_progress', title: 'Em Progresso',  icon: AlertCircle,   color: 'blue' },
    { id: 'blocked',     title: 'Bloqueado',     icon: AlertCircle,   color: 'red' },
    { id: 'done',        title: 'Concluído',     icon: CheckCircle,   color: 'green' }
  ];

  const workstreams = [
    { id: 'all',         label: 'Todos' },
    { id: 'conteudo',    label: 'Conteúdo' },
    { id: 'marketing',   label: 'Marketing' },
    { id: 'shows',       label: 'Shows' },
    { id: 'logistica',   label: 'Logística' },
    { id: 'estrategia',  label: 'Estratégia' },
    { id: 'financeiro',  label: 'Financeiro' },
    { id: 'lancamento',  label: 'Lançamento' },
    { id: 'geral',       label: 'Geral' }
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
  }, [project?.id]);

  async function loadTasks() {
    try {
      setLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (project?.id) {
        query = query.eq('project_id', project.id);
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
        .single();

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

  const getTasksByStatus = (status: string) => {
    let filtered = tasks.filter(task => task.status === status);
    if (filterWorkstream !== 'all') {
      filtered = filtered.filter(task => task.workstream === filterWorkstream);
    }
    return filtered;
  };

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
        .single();

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

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tarefas</h2>
          <p className="text-gray-600">
            {project?.id ? `Projeto: ${project.name || project.title} · ` : ''}
            {tasks.length}{planLimits.maxTasks !== -1 ? ` / ${planLimits.maxTasks}` : ''} tarefas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterWorkstream}
            onChange={(e) => setFilterWorkstream(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
          >
            {workstreams.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.label}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (planLimits.maxTasks !== -1 && tasks.length >= planLimits.maxTasks) {
                setTaskLimitModal(true);
                return;
              }
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
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
      </DragDropContext>

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
    { id: 'conteudo',   label: 'Conteúdo' },
    { id: 'marketing',  label: 'Marketing' },
    { id: 'shows',      label: 'Shows' },
    { id: 'logistica',  label: 'Logística' },
    { id: 'estrategia', label: 'Estratégia' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'lancamento', label: 'Lançamento' },
    { id: 'geral',      label: 'Geral' },
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
