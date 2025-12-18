import React, { useState, useEffect } from 'react';
import {
  X, Edit2, Save, Calendar, CheckSquare, BarChart3, Clock,
  FileText, Loader2, Trash2, Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import PlanningTimeline from './PlanningTimeline';
import { getPlanningLogs } from '../services/planningIntegration';

interface Planning {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface Phase {
  id: string;
  planning_id: string;
  name: string;
  description: string;
  order_index: number;
  start_date: string;
  end_date: string;
  status: string;
  color: string;
  created_at: string;
}

interface Log {
  id: string;
  action: string;
  details: any;
  created_at: string;
}

interface PlanningDetailsProps {
  planning: Planning;
  onClose: () => void;
  onUpdate: () => void;
}

export default function PlanningDetails({
  planning,
  onClose,
  onUpdate
}: PlanningDetailsProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'tasks' | 'logs'>('timeline');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedName, setEditedName] = useState(planning.name);
  const [editedDescription, setEditedDescription] = useState(planning.description);
  const [editedStatus, setEditedStatus] = useState(planning.status);

  useEffect(() => {
    loadData();
  }, [planning.id]);

  async function loadData() {
    setLoading(true);
    try {
      // Carregar fases
      const { data: phasesData, error: phasesError } = await supabase
        .from('planning_phases')
        .select('*')
        .eq('planning_id', planning.id)
        .order('order_index', { ascending: true });

      if (phasesError) throw phasesError;
      setPhases(phasesData || []);

      // Carregar logs
      const logsData = await getPlanningLogs(planning.id);
      setLogs(logsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const { error } = await supabase
        .from('plannings')
        .update({
          name: editedName,
          description: editedDescription,
          status: editedStatus
        })
        .eq('id', planning.id);

      if (error) throw error;

      alert('Planejamento atualizado com sucesso!');
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating planning:', error);
      alert('Erro ao atualizar planejamento');
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      archived: 'bg-purple-100 text-purple-700'
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      ai_generated: 'Gerado por IA',
      imported_pdf: 'PDF Importado',
      imported_docx: 'DOCX Importado',
      imported_txt: 'TXT Importado',
      imported_md: 'MD Importado',
      manual: 'Manual'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Criado',
      phase_added: 'Fase adicionada',
      task_created: 'Tarefa criada',
      status_changed: 'Status alterado',
      tasks_distributed: 'Tarefas distribuídas',
      event_created: 'Evento criado',
      kpi_created: 'KPI criado'
    };
    return labels[action] || action;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold text-gray-900 border-b-2 border-blue-500 w-full focus:outline-none"
                  />
                  <textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="text-sm text-gray-600 border border-gray-300 rounded-lg w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                  <select
                    value={editedStatus}
                    onChange={(e) => setEditedStatus(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="in_progress">Em andamento</option>
                    <option value="under_review">Em revisão</option>
                    <option value="completed">Concluído</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">{planning.name}</h2>
                  {planning.description && (
                    <p className="text-sm text-gray-600 mt-2">{planning.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(planning.status)}`}>
                      {planning.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {getTypeLabel(planning.type)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Criado em {new Date(planning.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Salvar"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditedName(planning.name);
                      setEditedDescription(planning.description);
                      setEditedStatus(planning.status);
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Tarefas
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {phases.reduce((acc, phase) => acc + (phase as any).tasks?.length || 0, 0)}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Histórico
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : activeTab === 'timeline' ? (
            <PlanningTimeline phases={phases} />
          ) : activeTab === 'tasks' ? (
            <div className="space-y-4">
              <div className="text-center py-12">
                <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Visualização de tarefas em desenvolvimento</p>
                <p className="text-sm text-gray-500">
                  As tarefas criadas estão disponíveis no módulo TaskBoard
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhum log de auditoria disponível</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-sm text-gray-600 mt-2">
                            <pre className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer com estatísticas */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{phases.length}</div>
              <div className="text-sm text-gray-600">Fases</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {phases.filter(p => p.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">Em Andamento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {phases.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Concluídas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {logs.length}
              </div>
              <div className="text-sm text-gray-600">Eventos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
