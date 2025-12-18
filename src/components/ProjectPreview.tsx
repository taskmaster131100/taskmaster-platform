import React, { useState } from 'react';
import { CheckCircle, XCircle, Calendar, Target, CheckSquare, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Task {
  title: string;
  description: string;
  moduleType: string;
  priority: string;
  dueDate?: string;
  selected: boolean;
}

interface Phase {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  color: string;
  tasks: Task[];
  selected: boolean;
}

interface ProjectPreviewProps {
  planning: {
    name: string;
    description: string;
    phases: any[];
  };
  fileInfo: {
    name: string;
    size: number;
    type: string;
    content: string;
  };
  onConfirm: (selectedData: any) => void;
  onCancel: () => void;
}

export default function ProjectPreview({ planning, fileInfo, onConfirm, onCancel }: ProjectPreviewProps) {
  const [phases, setPhases] = useState<Phase[]>(
    planning.phases.map(phase => ({
      ...phase,
      selected: true,
      tasks: phase.tasks.map((task: any) => ({ ...task, selected: true }))
    }))
  );
  const [saving, setSaving] = useState(false);

  const togglePhase = (phaseIndex: number) => {
    setPhases(prev => prev.map((phase, i) => {
      if (i === phaseIndex) {
        const newSelected = !phase.selected;
        return {
          ...phase,
          selected: newSelected,
          tasks: phase.tasks.map(task => ({ ...task, selected: newSelected }))
        };
      }
      return phase;
    }));
  };

  const toggleTask = (phaseIndex: number, taskIndex: number) => {
    setPhases(prev => prev.map((phase, i) => {
      if (i === phaseIndex) {
        const newTasks = phase.tasks.map((task, j) => {
          if (j === taskIndex) {
            return { ...task, selected: !task.selected };
          }
          return task;
        });
        // Update phase selection based on tasks
        const anyTaskSelected = newTasks.some(task => task.selected);
        return {
          ...phase,
          tasks: newTasks,
          selected: anyTaskSelected
        };
      }
      return phase;
    }));
  };

  const getSelectedCount = () => {
    const selectedPhases = phases.filter(p => p.selected).length;
    const selectedTasks = phases.reduce((acc, phase) =>
      acc + phase.tasks.filter(t => t.selected).length, 0
    );
    return { phases: selectedPhases, tasks: selectedTasks };
  };

  const handleConfirm = async () => {
    const { phases: phaseCount, tasks: taskCount } = getSelectedCount();

    if (phaseCount === 0) {
      toast.error('Selecione pelo menos uma fase');
      return;
    }

    setSaving(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Não autenticado');
      }

      // Criar planejamento no Supabase
      const { data: newPlanning, error: planningError } = await supabase
        .from('plannings')
        .insert({
          name: planning.name,
          description: planning.description,
          type: fileInfo.type.includes('pdf') ? 'imported_pdf' :
                fileInfo.type.includes('docx') ? 'imported_docx' :
                fileInfo.type.includes('md') ? 'imported_md' : 'imported_txt',
          status: 'draft',
          created_by: user.user.id,
          metadata: {
            original_filename: fileInfo.name,
            file_size: fileInfo.size,
            imported_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (planningError) throw planningError;

      // Salvar arquivo como anexo
      const { error: attachmentError } = await supabase
        .from('planning_attachments')
        .insert({
          planning_id: newPlanning.id,
          file_name: fileInfo.name,
          file_type: fileInfo.type.includes('pdf') ? 'pdf' :
                     fileInfo.type.includes('docx') ? 'docx' :
                     fileInfo.type.includes('md') ? 'md' : 'txt',
          file_content: fileInfo.content,
          file_size: fileInfo.size,
          uploaded_by: user.user.id,
          processed: true,
          processing_result: { planning, phases: phases.filter(p => p.selected) }
        });

      if (attachmentError) throw attachmentError;

      // Criar fases selecionadas
      const selectedPhases = phases.filter(p => p.selected);
      for (let i = 0; i < selectedPhases.length; i++) {
        const phase = selectedPhases[i];

        const { data: newPhase, error: phaseError } = await supabase
          .from('planning_phases')
          .insert({
            planning_id: newPlanning.id,
            name: phase.name,
            description: phase.description,
            order_index: i,
            start_date: phase.startDate,
            end_date: phase.endDate,
            status: 'pending',
            color: phase.color
          })
          .select()
          .single();

        if (phaseError) throw phaseError;

        // Criar tarefas selecionadas (placeholders - serão vinculadas ao TaskBoard depois)
        // Por enquanto, apenas salvar no metadata da fase
        const selectedTasks = phase.tasks.filter(t => t.selected);
        if (selectedTasks.length > 0) {
          await supabase
            .from('planning_phases')
            .update({
              metadata: {
                tasks: selectedTasks.map(task => ({
                  title: task.title,
                  description: task.description,
                  moduleType: task.moduleType,
                  priority: task.priority,
                  dueDate: task.dueDate
                }))
              }
            })
            .eq('id', newPhase.id);
        }
      }

      // Log de auditoria
      await supabase
        .from('planning_logs')
        .insert({
          planning_id: newPlanning.id,
          action: 'created_from_file',
          user_id: user.user.id,
          details: {
            filename: fileInfo.name,
            phases_count: phaseCount,
            tasks_count: taskCount,
            source: 'ai_processing'
          }
        });

      toast.success(`Planejamento criado com ${phaseCount} fases e ${taskCount} tarefas!`);

      onConfirm({
        planning: newPlanning,
        phases: selectedPhases
      });

    } catch (error) {
      console.error('Error creating planning:', error);
      toast.error('Erro ao criar planejamento. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const { phases: phaseCount, tasks: taskCount } = getSelectedCount();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{planning.name}</h2>
              <p className="text-gray-600">{planning.description}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Arquivo original:</p>
              <p className="font-medium text-gray-900">{fileInfo.name}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 flex gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">
                {phaseCount} fases selecionadas
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
              <CheckSquare className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">
                {taskCount} tarefas selecionadas
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto">
          <div className="space-y-6">
            {phases.map((phase, phaseIndex) => (
              <div
                key={phaseIndex}
                className={`border-2 rounded-lg transition-all ${
                  phase.selected ? 'border-blue-300 bg-blue-50/50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                {/* Phase Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => togglePhase(phaseIndex)}
                      className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                        phase.selected
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {phase.selected && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: phase.color }}
                        />
                        <h3 className="text-lg font-bold text-gray-900">{phase.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 {phase.startDate} → {phase.endDate}</span>
                        <span>📋 {phase.tasks.length} tarefas</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase Tasks */}
                {phase.selected && phase.tasks.length > 0 && (
                  <div className="p-4 space-y-3">
                    {phase.tasks.map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          task.selected ? 'bg-white border border-gray-200' : 'bg-gray-50 opacity-60'
                        }`}
                      >
                        <button
                          onClick={() => toggleTask(phaseIndex, taskIndex)}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            task.selected
                              ? 'bg-green-600 border-green-600'
                              : 'bg-white border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {task.selected && <CheckCircle className="w-3 h-3 text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {task.moduleType}
                            </span>
                            <span className={`px-2 py-1 rounded ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">✨ O que acontecerá ao confirmar:</p>
              <ul className="space-y-1">
                <li>• Planejamento será salvo como rascunho</li>
                <li>• Você poderá distribuir tarefas para os módulos depois</li>
                <li>• Nada será criado no TaskBoard automaticamente</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving || phaseCount === 0}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Confirmar e Criar Planejamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
