import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Target, Edit2, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth/AuthProvider';

// DB schema: id, name, description, category, value, target, unit, period, organization_id, recorded_at, created_at
interface KPI {
  id: string;
  name: string;
  description: string | null;
  value: number;
  target: number | null;
  unit: string | null;
  category: string;
  period: string;
  organization_id: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: 'financial', label: 'Financeiro' },
  { value: 'engagement', label: 'Engajamento' },
  { value: 'productivity', label: 'Produtividade' },
  { value: 'growth', label: 'Crescimento' },
  { value: 'custom', label: 'Personalizado' },
];

const PERIODS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'daily', label: 'Diário' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

interface KPIManagerProps {
  selectedProject?: any;
}

export const KPIManager: React.FC<KPIManagerProps> = ({ selectedProject }) => {
  const { organizationId } = useAuth();
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: 0,
    target: 0,
    unit: '',
    category: 'growth',
    period: 'monthly',
  });

  useEffect(() => {
    loadKPIs();
  }, [organizationId]);

  async function loadKPIs() {
    try {
      setLoading(true);
      let query = supabase.from('kpis').select('*').order('created_at', { ascending: false });
      if (organizationId) query = query.eq('organization_id', organizationId);
      const { data, error } = await query;
      if (error) throw error;
      setKpis(data || []);
    } catch (error: any) {
      console.error('Error loading KPIs:', error);
      toast.error('Erro ao carregar KPIs');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) {
      toast.error('Organização não identificada. Recarregue a página.');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        value: formData.value,
        target: formData.target || null,
        unit: formData.unit || null,
        category: formData.category,
        period: formData.period,
        organization_id: organizationId,
      };

      if (editingKpi) {
        const { error } = await supabase.from('kpis').update(payload).eq('id', editingKpi.id);
        if (error) throw error;
        toast.success('KPI atualizado com sucesso');
      } else {
        const { error } = await supabase.from('kpis').insert([payload]);
        if (error) throw error;
        toast.success('KPI criado com sucesso');
      }

      setShowModal(false);
      setEditingKpi(null);
      resetForm();
      loadKPIs();
    } catch (error: any) {
      console.error('Error saving KPI:', error);
      toast.error(error?.message || 'Erro ao salvar KPI. Tente novamente.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar este KPI? Esta ação não pode ser desfeita.')) return;
    try {
      const { error } = await supabase.from('kpis').delete().eq('id', id);
      if (error) throw error;
      toast.success('KPI deletado');
      setKpis(prev => prev.filter(k => k.id !== id));
    } catch (error: any) {
      console.error('Error deleting KPI:', error);
      toast.error('Erro ao deletar KPI');
    }
  }

  function handleEdit(kpi: KPI) {
    setEditingKpi(kpi);
    setFormData({
      name: kpi.name,
      description: kpi.description || '',
      value: kpi.value,
      target: kpi.target ?? 0,
      unit: kpi.unit || '',
      category: kpi.category,
      period: kpi.period,
    });
    setShowModal(true);
  }

  function resetForm() {
    setFormData({ name: '', description: '', value: 0, target: 0, unit: '', category: 'growth', period: 'monthly' });
  }

  function calculateProgress(current: number, target: number | null): number {
    if (!target || target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  function getStatusColor(progress: number): string {
    if (progress >= 100) return 'text-green-600 bg-green-50';
    if (progress >= 75) return 'text-blue-600 bg-blue-50';
    if (progress >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }

  function getProgressBarColor(progress: number): string {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function getCategoryLabel(value: string): string {
    return CATEGORIES.find(c => c.value === value)?.label || value;
  }

  function getPeriodLabel(value: string): string {
    return PERIODS.find(p => p.value === value)?.label || value;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFAD85]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPIs</h2>
          <p className="text-gray-600 mt-1">Acompanhe seus indicadores-chave de desempenho</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadKPIs}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={() => { resetForm(); setEditingKpi(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 text-white bg-[#FFAD85] rounded-lg hover:bg-[#FF9B6A]"
          >
            <Plus className="w-4 h-4" />
            Novo KPI
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      {kpis.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum KPI ainda</h3>
          <p className="text-gray-600 mb-4">Crie seu primeiro KPI para começar a acompanhar o desempenho</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-white bg-[#FFAD85] rounded-lg hover:bg-[#FF9B6A]"
          >
            <Plus className="w-4 h-4" />
            Criar KPI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi) => {
            const progress = calculateProgress(kpi.value, kpi.target);
            const statusColor = getStatusColor(progress);
            const progressBarColor = getProgressBarColor(progress);

            return (
              <div key={kpi.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{kpi.name}</h3>
                    {kpi.description && <p className="text-sm text-gray-600">{kpi.description}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handleEdit(kpi)} className="p-1 text-gray-400 hover:text-[#FFAD85] rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(kpi.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {kpi.target ? (
                  <>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusColor}`}>
                      {progress >= 100 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {progress}% da meta
                    </div>
                    <div className="mb-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-3xl font-bold text-gray-900">{Number(kpi.value).toLocaleString('pt-BR')}</span>
                        <span className="text-sm text-gray-600">/ {Number(kpi.target).toLocaleString('pt-BR')} {kpi.unit || ''}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${progressBarColor}`} style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">{Number(kpi.value).toLocaleString('pt-BR')}</span>
                    {kpi.unit && <span className="text-sm text-gray-500 ml-1">{kpi.unit}</span>}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-wide">
                  <span>{getCategoryLabel(kpi.category)}</span>
                  <span>·</span>
                  <span>{getPeriodLabel(kpi.period)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingKpi ? 'Editar KPI' : 'Novo KPI'}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do KPI *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="ex: Streams Mensais"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  rows={2}
                  placeholder="Breve descrição deste KPI"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Atual *</label>
                  <input
                    type="number"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta</label>
                  <input
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="ex: streams, shows, R$, %"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  >
                    {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingKpi(null); resetForm(); }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2 text-white bg-[#FFAD85] rounded-lg hover:bg-[#FF9B6A]">
                  {editingKpi ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIManager;
