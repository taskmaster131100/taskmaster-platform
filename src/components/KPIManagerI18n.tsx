import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Edit2, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface KPI {
  id: string;
  title: string;
  description: string;
  current_value: number;
  target_value: number;
  unit: string;
  category: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

const KPIManagerI18n: React.FC = () => {
  const { t } = useTranslation(['kpis', 'common']);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    current_value: 0,
    target_value: 0,
    unit: '',
    category: 'general'
  });

  useEffect(() => {
    loadKPIs();
  }, []);

  async function loadKPIs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKpis(data || []);
    } catch (error) {
      console.error('Error loading KPIs:', error);
      toast.error(t('common:messages.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingKpi) {
        const { error } = await supabase
          .from('kpis')
          .update(formData)
          .eq('id', editingKpi.id);

        if (error) throw error;
        toast.success(t('common:messages.updated_successfully'));
      } else {
        const { error } = await supabase
          .from('kpis')
          .insert([formData]);

        if (error) throw error;
        toast.success(t('common:messages.created_successfully'));
      }

      setShowModal(false);
      setEditingKpi(null);
      resetForm();
      loadKPIs();
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast.error(t('common:messages.error'));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('confirm_delete'))) return;

    try {
      const { error } = await supabase
        .from('kpis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t('common:messages.deleted_successfully'));
      loadKPIs();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast.error(t('common:messages.error'));
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      current_value: 0,
      target_value: 0,
      unit: '',
      category: 'general'
    });
  }

  function openEditModal(kpi: KPI) {
    setEditingKpi(kpi);
    setFormData({
      title: kpi.title,
      description: kpi.description,
      current_value: kpi.current_value,
      target_value: kpi.target_value,
      unit: kpi.unit,
      category: kpi.category
    });
    setShowModal(true);
  }

  function getKPIStatus(current: number, target: number): string {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'complete';
    if (percentage >= 75) return 'on_track';
    if (percentage >= 50) return 'behind';
    return 'at_risk';
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'complete': return 'green';
      case 'on_track': return 'blue';
      case 'behind': return 'yellow';
      case 'at_risk': return 'red';
      default: return 'gray';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAD85] mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common:messages.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
          <p className="text-gray-600">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingKpi(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('new_kpi')}
        </button>
      </div>

      {kpis.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('empty_state.title')}</h3>
          <p className="text-gray-600 mb-4">{t('empty_state.description')}</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('empty_state.action')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi) => {
            const status = getKPIStatus(kpi.current_value, kpi.target_value);
            const percentage = Math.min((kpi.current_value / kpi.target_value) * 100, 100);
            const color = getStatusColor(status);

            return (
              <div key={kpi.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{kpi.title}</h3>
                    <p className="text-sm text-gray-600">{kpi.description}</p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => openEditModal(kpi)}
                      className="p-1 text-gray-600 hover:text-[#FFAD85] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(kpi.id)}
                      className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {kpi.current_value.toLocaleString()} {kpi.unit}
                    </span>
                    <span className="text-sm text-gray-600">
                      {t('fields.target_value')}: {kpi.target_value.toLocaleString()} {kpi.unit}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`bg-${color}-500 h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{percentage.toFixed(0)}%</span>
                    <span className={`text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-700`}>
                      {t(`status.${status}`)}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {t(`categories.${kpi.category}`)}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingKpi ? t('edit_kpi') : t('new_kpi')}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingKpi(null);
                  resetForm();
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fields.title')}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('placeholders.title')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fields.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('placeholders.description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('fields.current_value')}
                  </label>
                  <input
                    type="number"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('fields.target_value')}
                  </label>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fields.unit')}
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder={t('placeholders.unit')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('fields.category')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  <option value="general">{t('categories.general')}</option>
                  <option value="streaming">{t('categories.streaming')}</option>
                  <option value="shows">{t('categories.shows')}</option>
                  <option value="social">{t('categories.social')}</option>
                  <option value="financial">{t('categories.financial')}</option>
                  <option value="marketing">{t('categories.marketing')}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingKpi(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common:actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
                >
                  {t('common:actions.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIManagerI18n;
