import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, Target, Edit2, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface KPI {
  id: string;
  title: string;
  description: string;
  current_value: number;
  target_value: number;
  unit: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface KPIManagerProps {
  selectedProject?: any;
}

export const KPIManager: React.FC<KPIManagerProps> = ({ selectedProject }) => {
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
      toast.error('Error loading KPIs');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      if (editingKpi) {
        // Update existing KPI
        const { error } = await supabase
          .from('kpis')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingKpi.id);

        if (error) throw error;
        toast.success('KPI updated successfully');
      } else {
        // Create new KPI
        const { error } = await supabase
          .from('kpis')
          .insert([formData]);

        if (error) throw error;
        toast.success('KPI created successfully');
      }

      setShowModal(false);
      setEditingKpi(null);
      resetForm();
      loadKPIs();
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast.error('Error saving KPI');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this KPI?')) return;

    try {
      const { error } = await supabase
        .from('kpis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('KPI deleted successfully');
      loadKPIs();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast.error('Error deleting KPI');
    }
  }

  function handleEdit(kpi: KPI) {
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

  function calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPIs</h2>
          <p className="text-gray-600 mt-1">Track your key performance indicators</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadKPIs}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingKpi(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New KPI
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      {kpis.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No KPIs yet</h3>
          <p className="text-gray-600 mb-4">Create your first KPI to start tracking performance</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create KPI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kpis.map((kpi) => {
            const progress = calculateProgress(kpi.current_value, kpi.target_value);
            const statusColor = getStatusColor(progress);
            const progressBarColor = getProgressBarColor(progress);

            return (
              <div
                key={kpi.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {/* KPI Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{kpi.title}</h3>
                    <p className="text-sm text-gray-600">{kpi.description}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(kpi)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(kpi.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Badge */}
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium mb-4 ${statusColor}`}>
                  {progress >= 100 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {progress}% Complete
                </div>

                {/* Values */}
                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {kpi.current_value}
                    </span>
                    <span className="text-sm text-gray-600">
                      / {kpi.target_value} {kpi.unit}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${progressBarColor}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {kpi.category}
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
            <h3 className="text-xl font-bold mb-4">
              {editingKpi ? 'Edit KPI' : 'New KPI'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Monthly Streams"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Brief description of this KPI"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Value *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., streams, shows, $"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="streaming">Streaming</option>
                  <option value="shows">Shows</option>
                  <option value="social">Social Media</option>
                  <option value="financial">Financial</option>
                  <option value="marketing">Marketing</option>
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
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {editingKpi ? 'Update' : 'Create'}
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
