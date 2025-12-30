import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Users, FileText, Download, Loader2, Calendar, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalEvents: 0,
    upcomingEvents: 0,
    totalPlannings: 0,
    activePlannings: 0
  });

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);

      // Load tasks metrics
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status');

      // Load calendar events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('event_date, event_type');

      // Load plannings
      const { data: plannings } = await supabase
        .from('plannings')
        .select('status, execution_window_start, execution_window_end');

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
      const totalEvents = events?.length || 0;

      const today = new Date().toISOString().split('T')[0];
      const upcomingEvents = events?.filter(e => e.event_date >= today).length || 0;

      const totalPlannings = plannings?.length || 0;
      const activePlannings = plannings?.filter(p => p.status === 'active').length || 0;

      setMetrics({
        totalTasks,
        completedTasks,
        totalEvents,
        upcomingEvents,
        totalPlannings,
        activePlannings
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }

  const taskCompletionRate = metrics.totalTasks > 0
    ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
    : 0;

  const planningActiveRate = metrics.totalPlannings > 0
    ? Math.round((metrics.activePlannings / metrics.totalPlannings) * 100)
    : 0;

  const metricCards = [
    {
      label: 'Tarefas Totais',
      value: metrics.totalTasks.toString(),
      subtext: `${metrics.completedTasks} concluídas`,
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Taxa de Conclusão',
      value: `${taskCompletionRate}%`,
      subtext: 'das tarefas',
      icon: CheckCircle,
      color: 'green'
    },
    {
      label: 'Eventos',
      value: metrics.totalEvents.toString(),
      subtext: `${metrics.upcomingEvents} próximos`,
      icon: Calendar,
      color: 'purple'
    },
    {
      label: 'Planejamentos',
      value: metrics.totalPlannings.toString(),
      subtext: `${metrics.activePlannings} ativos`,
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
          <p className="text-gray-600">Visualize métricas de desempenho e análises do sistema</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-xs text-gray-500 mt-1">{metric.subtext}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Distribuição de Tarefas</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">A Fazer</span>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((metrics.totalTasks - metrics.completedTasks) / metrics.totalTasks * 100) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((metrics.totalTasks - metrics.completedTasks) / metrics.totalTasks * 100) || 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Concluídas</span>
                <span className="text-sm font-medium text-gray-900">{taskCompletionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${taskCompletionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-[#FFAD85]">{metrics.totalTasks - metrics.completedTasks}</p>
                <p className="text-sm text-gray-600">Pendentes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{metrics.completedTasks}</p>
                <p className="text-sm text-gray-600">Concluídas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Events Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Visão de Eventos</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total de Eventos</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Eventos Próximos</p>
                <p className="text-2xl font-bold text-[#FFAD85]">{metrics.upcomingEvents}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#FFAD85]" />
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Planejamentos Ativos</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.activePlannings}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Resumo Executivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-[#FFAD85] pl-4">
            <p className="text-sm text-gray-600 mb-1">Produtividade</p>
            <p className="text-xl font-bold text-gray-900">{taskCompletionRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Taxa de conclusão de tarefas</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Agenda</p>
            <p className="text-xl font-bold text-gray-900">{metrics.upcomingEvents}</p>
            <p className="text-xs text-gray-500 mt-1">Eventos agendados</p>
          </div>
          <div className="border-l-4 border-orange-500 pl-4">
            <p className="text-sm text-gray-600 mb-1">Planejamento</p>
            <p className="text-xl font-bold text-gray-900">{planningActiveRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Planejamentos ativos</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={loadMetrics}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Atualizar Dados
        </button>
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Comparar Períodos
        </button>
        <button
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Configurar Alertas
        </button>
      </div>
    </div>
  );
};

export default ReportsPage;
