import React, { useState, useEffect } from 'react';
import { Plus, Clock, CheckCircle, AlertCircle, Archive, Loader2, Edit2, Trash2, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Task {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  workstream?: string;
  project_id?: string;
  due_date?: string;
  reporter_id?: string;
  assignee_id?: string;
  labels?: string[];
  order_index?: number;
  created_at: string;
  updated_at: string;
}

interface TaskBoardProps {
  tasks?: Task[];
  departments?: any[];
  project?: any;
  onTasksChange?: (tasks: Task[]) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks: propTasks = [],
  departments = [],
  project,
  onTasksChange
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterWorkstream, setFilterWorkstream] = useState<string>('all');

  const columns = [
    { id: 'todo', title: 'A Fazer', icon: Clock, color: 'gray' },
    { id: 'in_progress', title: 'Em Progresso', icon: AlertCircle, color: 'blue' },
    { id: 'blocked', title: 'Bloqueado', icon: AlertCircle, color: 'red' },
    { id: 'done', title: 'Concluído', icon: CheckCircle, color: 'green' }
  ];

  const workstreams = [
    { id: 'all', label: 'Todos' },
    { id: 'conteudo', label: 'Conteúdo' },
    { id: 'shows', label: 'Shows' },
    { id: 'logistica', label: 'Logística' },
    { id: 'estrategia', label: 'Estratégia' },
    { id: 'geral', label: 'Geral' }
  ];

  useEffect(() => {
    loadTasks();

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
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

      // Se há projeto em foco, mostrar apenas as tarefas desse projeto
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

  const getTasksByStatus = (status: string) => {
    let filtered = tasks.filter(task => task.status === status);

    if (filterWorkstream !== 'all') {
      filtered = filtered.filter(task => task.workstream === filterWorkstream);
    }

    return filtered;
  };

  async function handleCreateTask(taskData: any) {
    try {
      // Validações frontend
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

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      // Get user's organization
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.user.id)
        .single();

      if (!orgData?.organization_id) {
        toast.error('Você precisa estar vinculado a uma organização');
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          organization_id: orgData.organization_id,
          title: taskData.title.trim(),
          description: taskData.description?.trim() || null,
          status: 'todo',
          priority: taskData.priority || 'medium',
          workstream: taskData.workstream || 'geral',
          due_date: taskData.deadline || null,
          reporter_id: user.user.id,
          assignee_id: taskData.assigned_to || null,
          ...(project?.id ? { project_id: project.id } : {}),
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

  async function handleUpdateTask(taskId: string, updates: Partial<Task>) {
    try {
      // Enviar apenas colunas que existem no banco real
      const safeUpdates: any = {};
      if (updates.title !== undefined) safeUpdates.title = updates.title;
      if (updates.description !== undefined) safeUpdates.description = updates.description;
      if (updates.status !== undefined) safeUpdates.status = updates.status;
      if (updates.priority !== undefined) safeUpdates.priority = updates.priority;
      if (updates.workstream !== undefined) safeUpdates.workstream = updates.workstream;
      if ((updates as any).due_date !== undefined) safeUpdates.due_date = (updates as any).due_date;
      if ((updates as any).deadline !== undefined) safeUpdates.due_date = (updates as any).deadline;
      if ((updates as any).assignee_id !== undefined) safeUpdates.assignee_id = (updates as any).assignee_id;
      if ((updates as any).assigned_to !== undefined) safeUpdates.assignee_id = (updates as any).assigned_to;

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
    const newStatus = destination.droppableId;

    handleUpdateTask(draggableId, { status: newStatus });
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
          Nenhum projeto selecionado — exibindo todas as tarefas. Selecione um projeto no menu lateral para ver as tarefas do projeto.
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tarefas</h2>
          <p className="text-gray-600">
            {project?.id ? `Projeto: ${project.name || project.title} · ` : ''}{tasks.length} tarefas
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
            onClick={() => setShowCreateModal(true)}
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
                        columnTasks.map((task, index) => (
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
                                  <h4 className="font-medium text-gray-900 flex-1">{task.title}</h4>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowEditModal(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-[#FFAD85] transition-colors"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(task)}`}>
                                    {getPriorityLabel(task)}
                                  </span>
                                  {task.workstream && task.workstream !== 'geral' && (
                                    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-[#FF9B6A]">
                                      {workstreams.find(w => w.id === task.workstream)?.label || task.workstream}
                                    </span>
                                  )}
                                  {(task as any).due_date && (
                                    <span className="text-xs text-gray-500">
                                      {new Date((task as any).due_date).toLocaleDateString('pt-BR')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
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
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {/* Modal de Edição */}
      {showEditModal && selectedTask && (
        <TaskFormModal
          title="Editar Tarefa"
          task={selectedTask}
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
    </div>
  );
};

// Componente de formulário reutilizável
function TaskFormModal({
  title,
  task,
  onClose,
  onSave
}: {
  title: string;
  task?: Task;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const workstreams = [
    { id: 'conteudo', label: 'Conteúdo' },
    { id: 'shows', label: 'Shows' },
    { id: 'logistica', label: 'Logística' },
    { id: 'estrategia', label: 'Estratégia' },
    { id: 'geral', label: 'Geral' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onSave({
            title: formData.get('title'),
            description: formData.get('description'),
            workstream: formData.get('workstream'),
            deadline: formData.get('deadline'),
            metadata: {
              priority: formData.get('priority')
            }
          });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                name="title"
                type="text"
                required
                defaultValue={task?.title}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={task?.description}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Área
                </label>
                <select
                  name="workstream"
                  defaultValue={task?.workstream || 'geral'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  {workstreams.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridade
                </label>
                <select
                  name="priority"
                  defaultValue={task?.metadata?.priority || 'medium'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prazo
              </label>
              <input
                name="deadline"
                type="date"
                defaultValue={task?.deadline?.split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
            >
              {task ? 'Salvar' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskBoard;
