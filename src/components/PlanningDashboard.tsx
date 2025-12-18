import React, { useState, useEffect } from 'react';
import {
  Plus, FileText, Sparkles, Upload, Calendar, CheckSquare,
  BarChart3, TrendingUp, Clock, Edit2, Trash2, Eye,
  Download, Filter, Search, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { generatePlanningWithAI, parsePlanningFromFile } from '../services/planningAI';
import { distributeTasksToModules } from '../services/planningIntegration';
import PlanningTimeline from './PlanningTimeline';
import PlanningDetails from './PlanningDetails';
import ProjectFileUpload from './ProjectFileUpload';
import ProjectPreview from './ProjectPreview';

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

export default function PlanningDashboard() {
  const [plannings, setPlannings] = useState<Planning[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState<Planning | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Estados do formulário de criação
  const [creationType, setCreationType] = useState<'ai' | 'file' | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Estados para Upload de Projeto
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    loadPlannings();
  }, []);

  async function loadPlannings() {
    try {
      const { data, error } = await supabase
        .from('plannings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlannings(data || []);
    } catch (error) {
      console.error('Error loading plannings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWithAI() {
    if (!aiPrompt.trim()) {
      toast.error('Por favor, descreva o objetivo do planejamento');
      return;
    }

    setGenerating(true);
    setProcessingProgress(10);

    try {
      // 1. Gerar planejamento com IA
      setProcessingProgress(30);
      const generatedPlanning = await generatePlanningWithAI(aiPrompt);

      // 2. Salvar planejamento no banco
      setProcessingProgress(50);
      const { data: user } = await supabase.auth.getUser();

      const { data: newPlanning, error: planningError } = await supabase
        .from('plannings')
        .insert({
          name: generatedPlanning.name,
          description: generatedPlanning.description,
          type: 'ai_generated',
          status: 'draft',
          created_by: user.user?.id,
          ai_prompt: aiPrompt,
          metadata: { generatedAt: new Date().toISOString() }
        })
        .select()
        .single();

      if (planningError) throw planningError;

      // 3. Criar fases
      setProcessingProgress(65);
      const phasesData = generatedPlanning.phases.map((phase, index) => ({
        planning_id: newPlanning.id,
        name: phase.name,
        description: phase.description,
        order_index: index,
        start_date: phase.startDate,
        end_date: phase.endDate,
        status: phase.status,
        color: phase.color
      }));

      const { data: createdPhases, error: phasesError } = await supabase
        .from('planning_phases')
        .insert(phasesData)
        .select();

      if (phasesError) throw phasesError;

      // 4. Distribuir tarefas para os módulos
      setProcessingProgress(80);
      const phasesWithTasks = createdPhases.map((phase, index) => ({
        id: phase.id,
        tasks: generatedPlanning.phases[index].tasks
      }));

      await distributeTasksToModules(newPlanning.id, phasesWithTasks);

      // 5. Atualizar status para 'in_progress'
      setProcessingProgress(95);
      await supabase
        .from('plannings')
        .update({ status: 'in_progress' })
        .eq('id', newPlanning.id);

      setProcessingProgress(100);

      // Sucesso!
      toast.success('Planejamento criado com sucesso! Tarefas distribuídas para os módulos.');
      setShowCreateModal(false);
      setAiPrompt('');
      setCreationType(null);
      loadPlannings();
    } catch (error) {
      console.error('Error creating planning:', error);
      toast.error('Erro ao criar planejamento. Verifique o console.');
    } finally {
      setGenerating(false);
      setProcessingProgress(0);
    }
  }

  async function handleImportFile() {
    if (!uploadedFile) {
      toast.error('Por favor, selecione um arquivo');
      return;
    }

    setGenerating(true);
    setProcessingProgress(10);

    try {
      // 1. Processar arquivo
      setProcessingProgress(30);
      const parsedPlanning = await parsePlanningFromFile(uploadedFile);

      // 2. Salvar planejamento no banco
      setProcessingProgress(60);
      const { data: user } = await supabase.auth.getUser();

      const fileType = uploadedFile.name.split('.').pop() || 'unknown';

      const { data: newPlanning, error: planningError } = await supabase
        .from('plannings')
        .insert({
          name: parsedPlanning.name,
          description: parsedPlanning.description,
          type: `imported_${fileType}`,
          status: 'under_review',
          created_by: user.user?.id,
          original_file_url: uploadedFile.name,
          metadata: {
            fileName: uploadedFile.name,
            fileSize: uploadedFile.size,
            importedAt: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (planningError) throw planningError;

      // 3. Criar fases
      setProcessingProgress(80);
      const phasesData = parsedPlanning.phases.map((phase, index) => ({
        planning_id: newPlanning.id,
        name: phase.name,
        description: phase.description,
        order_index: index,
        start_date: phase.startDate,
        end_date: phase.endDate,
        status: phase.status,
        color: phase.color
      }));

      const { data: createdPhases, error: phasesError } = await supabase
        .from('planning_phases')
        .insert(phasesData)
        .select();

      if (phasesError) throw phasesError;

      // 4. Distribuir tarefas
      const phasesWithTasks = createdPhases.map((phase, index) => ({
        id: phase.id,
        tasks: parsedPlanning.phases[index].tasks
      }));

      await distributeTasksToModules(newPlanning.id, phasesWithTasks);

      setProcessingProgress(100);

      toast.success('Arquivo importado com sucesso! Tarefas distribuídas para os módulos.');
      setShowCreateModal(false);
      setUploadedFile(null);
      setCreationType(null);
      loadPlannings();
    } catch (error) {
      console.error('Error importing file:', error);
      toast.error('Erro ao importar arquivo. Verifique o console.');
    } finally {
      setGenerating(false);
      setProcessingProgress(0);
    }
  }

  function handleViewDetails(planning: Planning) {
    setSelectedPlanning(planning);
    setShowDetailsModal(true);
  }

  async function handleDeletePlanning(id: string) {
    if (!confirm('Tem certeza que deseja excluir este planejamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('plannings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Planejamento excluído com sucesso!');
      loadPlannings();
    } catch (error) {
      console.error('Error deleting planning:', error);
      toast.error('Erro ao excluir planejamento');
    }
  }

  // Filtrar planejamentos
  const filteredPlannings = plannings.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: 'Rascunho',
      in_progress: 'Em andamento',
      under_review: 'Em revisão',
      completed: 'Concluído',
      archived: 'Arquivado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      ai_generated: 'IA',
      imported_pdf: 'PDF Importado',
      imported_docx: 'DOCX Importado',
      imported_txt: 'TXT Importado',
      imported_md: 'MD Importado',
      manual: 'Manual'
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Handler para quando upload é completado
  const handleUploadComplete = (result: any) => {
    setUploadResult(result);
    setShowUploadModal(false);
    setShowPreviewModal(true);
  };

  // Handler para quando preview é confirmado
  const handlePreviewConfirm = async (data: any) => {
    try {
      setShowPreviewModal(false);

      // Recarregar lista de planejamentos
      await loadPlannings();

      toast.success('Planejamento criado com sucesso!');

      // Limpar estado
      setUploadResult(null);
    } catch (error) {
      console.error('Error after preview confirm:', error);
      toast.error('Erro ao finalizar criação do planejamento');
    }
  };

  // Handler para cancelar upload
  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setUploadResult(null);
  };

  // Handler para cancelar preview
  const handleCancelPreview = () => {
    setShowPreviewModal(false);
    setUploadResult(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Planejamento</h1>
            <p className="text-sm text-gray-600 mt-1">
              Centro estratégico de gestão de projetos
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Upload className="w-5 h-5" />
              Anexar Projeto
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              Novo Planejamento
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar planejamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="draft">Rascunho</option>
            <option value="in_progress">Em andamento</option>
            <option value="under_review">Em revisão</option>
            <option value="completed">Concluído</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
      </div>

      {/* Lista de Planejamentos */}
      <div className="flex-1 overflow-auto p-6">
        {filteredPlannings.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {searchTerm || filterStatus !== 'all'
                ? 'Nenhum planejamento encontrado'
                : 'Nenhum planejamento criado ainda'}
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Tente ajustar os filtros'
                : 'Crie seu primeiro planejamento com IA ou importe um existente'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do Planejamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Atualização
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlannings.map((planning) => (
                  <tr key={planning.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {planning.name}
                        </div>
                        {planning.description && (
                          <div className="text-sm text-gray-500 truncate max-w-md">
                            {planning.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {getTypeLabel(planning.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(planning.status)}`}>
                        {getStatusLabel(planning.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(planning.updated_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(planning)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeletePlanning(planning.id)}
                          className="text-red-600 hover:text-red-900 transition-colors p-1"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Novo Planejamento</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreationType(null);
                  setAiPrompt('');
                  setUploadedFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {!creationType ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setCreationType('ai')}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Gerar com IA
                    </h3>
                    <p className="text-sm text-gray-600">
                      Descreva seu projeto e deixe a IA criar um planejamento completo
                    </p>
                  </button>

                  <button
                    onClick={() => setCreationType('file')}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
                  >
                    <Upload className="w-12 h-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Importar Arquivo
                    </h3>
                    <p className="text-sm text-gray-600">
                      Envie um PDF, DOCX ou TXT e o sistema extrairá o planejamento
                    </p>
                  </button>
                </div>
              ) : creationType === 'ai' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descreva seu objetivo
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Exemplo: Planejar lançamento de EP com 5 músicas, incluindo clipe principal, estratégia de marketing digital e shows de divulgação"
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {generating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Gerando planejamento...</span>
                        <span>{processingProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setCreationType(null);
                        setAiPrompt('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={generating}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleCreateWithAI}
                      disabled={generating || !aiPrompt.trim()}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Gerar Planejamento
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecione o arquivo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clique para selecionar
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        ou arraste o arquivo aqui
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PDF, DOCX, TXT ou MD (máx. 10MB)
                      </p>
                    </div>
                    {uploadedFile && (
                      <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {uploadedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(uploadedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setUploadedFile(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {generating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Processando arquivo...</span>
                        <span>{processingProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setCreationType(null);
                        setUploadedFile(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={generating}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleImportFile}
                      disabled={generating || !uploadedFile}
                      className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Importar Planejamento
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedPlanning && (
        <PlanningDetails
          planning={selectedPlanning}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPlanning(null);
          }}
          onUpdate={loadPlannings}
        />
      )}

      {/* Modal de Upload de Projeto */}
      {showUploadModal && (
        <ProjectFileUpload
          onComplete={handleUploadComplete}
          onCancel={handleCancelUpload}
        />
      )}

      {/* Modal de Preview */}
      {showPreviewModal && uploadResult && (
        <ProjectPreview
          planning={uploadResult.planning}
          fileInfo={uploadResult.file}
          onConfirm={handlePreviewConfirm}
          onCancel={handleCancelPreview}
        />
      )}
    </div>
  );
}
