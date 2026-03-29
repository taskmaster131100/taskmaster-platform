import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, DollarSign, Users, FileText, Download,
  Loader2, Calendar, CheckCircle, RefreshCw, Music, Mic2, Target,
  TrendingDown, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#FFAD85', '#FF9B6A', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

interface Metrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  totalArtists: number;
  totalShows: number;
  closedShows: number;
  totalRevenue: number;
  totalExpenses: number;
  totalPlannings: number;
  activePlannings: number;
  totalReleases: number;
  activeReleases: number;
  upcomingEvents: number;
}

interface ShowByStatus {
  name: string;
  value: number;
}

interface RevenueByMonth {
  mes: string;
  receita: number;
  despesa: number;
}

interface TaskByStatus {
  name: string;
  value: number;
  color: string;
}

// Templates de análise disponíveis
const ANALYSIS_TEMPLATES = [
  {
    id: 'operacao',
    label: 'Operação Geral',
    description: 'Visão consolidada: tarefas, projetos, artistas e saúde da operação',
    icon: Target,
    color: 'bg-blue-50 border-blue-200 text-blue-700'
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    description: 'Receitas, despesas, fluxo de caixa e saúde financeira do período',
    icon: DollarSign,
    color: 'bg-green-50 border-green-200 text-green-700'
  },
  {
    id: 'shows',
    label: 'Shows',
    description: 'Pipeline de shows, fechamentos, receita e comparativo de períodos',
    icon: Mic2,
    color: 'bg-orange-50 border-orange-200 text-orange-700'
  },
  {
    id: 'lancamentos',
    label: 'Lançamentos',
    description: 'Status dos lançamentos, fases, prazos e materiais pendentes',
    icon: Music,
    color: 'bg-purple-50 border-purple-200 text-purple-700'
  },
  {
    id: 'artista',
    label: 'Artista',
    description: 'Análise individual por artista: projetos, shows, finanças e operação',
    icon: Users,
    color: 'bg-pink-50 border-pink-200 text-pink-700'
  },
];

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTemplate, setActiveTemplate] = useState<string>('operacao');
  const [metrics, setMetrics] = useState<Metrics>({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    totalArtists: 0,
    totalShows: 0,
    closedShows: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalPlannings: 0,
    activePlannings: 0,
    totalReleases: 0,
    activeReleases: 0,
    upcomingEvents: 0,
  });
  const [showsByStatus, setShowsByStatus] = useState<ShowByStatus[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<TaskByStatus[]>([]);
  const [releasesList, setReleasesList] = useState<{ title: string; status: string; release_date?: string }[]>([]);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);

      const [
        tasksRes,
        artistsRes,
        showsRes,
        transactionsRes,
        planningsRes,
        releasesRes,
        eventsRes,
      ] = await Promise.all([
        supabase.from('tasks').select('status'),
        supabase.from('artists').select('id'),
        supabase.from('shows').select('status, fee'),
        supabase.from('financial_transactions').select('type, amount, transaction_date, status'),
        supabase.from('plannings').select('status'),
        supabase.from('releases').select('title, status, release_date').order('release_date', { ascending: true }),
        supabase.from('calendar_events').select('event_date').gte('event_date', new Date().toISOString().split('T')[0]),
      ]);

      const tasks = tasksRes.data || [];
      const artists = artistsRes.data || [];
      const shows = showsRes.data || [];
      const transactions = transactionsRes.data || [];
      const plannings = planningsRes.data || [];
      const releases = releasesRes.data || [];
      const upcomingEvents = eventsRes.data?.length || 0;

      // Tasks
      const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'concluido').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'em_progresso').length;

      // Shows por status
      const showStatusMap: Record<string, number> = {};
      shows.forEach(s => {
        const label = s.status || 'desconhecido';
        showStatusMap[label] = (showStatusMap[label] || 0) + 1;
      });
      const showStatusLabels: Record<string, string> = {
        consultado: 'Consultado',
        proposto: 'Proposto',
        fechado: 'Fechado',
        pago: 'Pago',
        cancelado: 'Cancelado',
      };
      const showsByStatusData: ShowByStatus[] = Object.entries(showStatusMap).map(([k, v]) => ({
        name: showStatusLabels[k] || k,
        value: v,
      }));

      // Financial
      const totalRevenue = transactions
        .filter(t => t.type === 'revenue' && t.status !== 'cancelled')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalExpenses = transactions
        .filter(t => t.type === 'expense' && t.status !== 'cancelled')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      // Revenue por mês (últimos 6 meses)
      const now = new Date();
      const months: RevenueByMonth[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toISOString().slice(0, 7); // YYYY-MM
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        const rec = transactions
          .filter(t => t.type === 'revenue' && t.transaction_date?.startsWith(key))
          .reduce((s, t) => s + Number(t.amount || 0), 0);
        const desp = transactions
          .filter(t => t.type === 'expense' && t.transaction_date?.startsWith(key))
          .reduce((s, t) => s + Number(t.amount || 0), 0);
        months.push({ mes: label, receita: rec, despesa: desp });
      }

      // Tasks por status para pie chart
      const taskStatusData: TaskByStatus[] = [
        { name: 'Concluídas', value: completedTasks, color: '#10b981' },
        { name: 'Em Progresso', value: inProgressTasks, color: '#6366f1' },
        { name: 'Pendentes', value: tasks.length - completedTasks - inProgressTasks, color: '#FFAD85' },
      ].filter(t => t.value > 0);

      setMetrics({
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        totalArtists: artists.length,
        totalShows: shows.length,
        closedShows: shows.filter(s => s.status === 'fechado' || s.status === 'pago').length,
        totalRevenue,
        totalExpenses,
        totalPlannings: plannings.length,
        activePlannings: plannings.filter(p => p.status === 'active' || p.status === 'ativo').length,
        totalReleases: releases.length,
        activeReleases: releases.filter(r => r.status !== 'lancado' && r.status !== 'cancelled').length,
        upcomingEvents,
      });
      setShowsByStatus(showsByStatusData);
      setRevenueByMonth(months);
      setTasksByStatus(taskStatusData);
      setReleasesList(releases as { title: string; status: string; release_date?: string }[]);
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

  const netBalance = metrics.totalRevenue - metrics.totalExpenses;

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  const kpiCards = [
    {
      label: 'Artistas',
      value: metrics.totalArtists,
      subtext: 'cadastrados',
      icon: Music,
      color: 'purple',
    },
    {
      label: 'Shows',
      value: metrics.totalShows,
      subtext: `${metrics.closedShows} fechados/pagos`,
      icon: Mic2,
      color: 'orange',
    },
    {
      label: 'Tarefas',
      value: metrics.totalTasks,
      subtext: `${taskCompletionRate}% concluídas`,
      icon: CheckCircle,
      color: 'green',
    },
    {
      label: 'Receita Líquida',
      value: formatCurrency(netBalance),
      subtext: netBalance >= 0 ? 'saldo positivo' : 'saldo negativo',
      icon: netBalance >= 0 ? TrendingUp : TrendingDown,
      color: netBalance >= 0 ? 'green' : 'red',
    },
    {
      label: 'Releases',
      value: metrics.totalReleases,
      subtext: `${metrics.activeReleases} em andamento`,
      icon: Target,
      color: 'blue',
    },
    {
      label: 'Próximos Eventos',
      value: metrics.upcomingEvents,
      subtext: 'na agenda',
      icon: Calendar,
      color: 'indigo',
    },
  ];

  // Filtrar KPI cards e seções por template
  const getVisibleKpiIndices = (t: string) => {
    switch(t) {
      case 'financeiro': return [3];
      case 'shows': return [1, 5, 3];
      case 'lancamentos': return [4, 0];
      case 'artista': return [0, 2, 4];
      default: return [0, 1, 2, 3, 4, 5];
    }
  };

  const showSection = (section: 'financeiro' | 'shows' | 'tarefas' | 'lancamentos') => {
    if (activeTemplate === 'operacao') return true;
    if (activeTemplate === 'financeiro') return section === 'financeiro';
    if (activeTemplate === 'shows') return section === 'shows' || section === 'financeiro';
    if (activeTemplate === 'lancamentos') return section === 'lancamentos';
    if (activeTemplate === 'artista') return section === 'tarefas';
    return true;
  };

  const visibleKpiCards = kpiCards.filter((_, i) => getVisibleKpiIndices(activeTemplate).includes(i));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFAD85] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análise & Relatórios</h2>
          <p className="text-gray-500 text-sm">Escolha o tipo de análise e o período</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Templates de Análise */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Tipo de análise</p>
        <div className="flex flex-wrap gap-2">
          {ANALYSIS_TEMPLATES.map((t) => {
            const TIcon = t.icon;
            const isActive = activeTemplate === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTemplate(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? t.color + ' shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <TIcon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
        {activeTemplate && (
          <p className="text-xs text-gray-400 mt-2">
            {ANALYSIS_TEMPLATES.find(t => t.id === activeTemplate)?.description}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {visibleKpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className={`inline-flex p-2 rounded-lg bg-${card.color}-50 mb-3`}>
                <Icon className={`w-5 h-5 text-${card.color}-600`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-400">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      {(showSection('financeiro') || showSection('tarefas')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Receita vs Despesa por mês */}
          {showSection('financeiro') && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Receita vs Despesa (6 meses)</h3>
              {revenueByMonth.some(m => m.receita > 0 || m.despesa > 0) ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueByMonth} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px] text-gray-400">
                  <DollarSign className="w-8 h-8 mb-2" />
                  <p className="text-sm">Nenhuma transação registrada</p>
                </div>
              )}
            </div>
          )}

          {/* Tarefas por status */}
          {showSection('tarefas') && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Distribuição de Tarefas</h3>
              {tasksByStatus.length > 0 ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie
                        data={tasksByStatus}
                        cx="50%" cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {tasksByStatus.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {tasksByStatus.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                          <span className="text-sm text-gray-600">{s.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Conclusão</span>
                        <span className="text-sm font-bold text-green-600">{taskCompletionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[180px] text-gray-400">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-sm">Nenhuma tarefa registrada</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Charts Row 2 */}
      {(showSection('shows') || showSection('financeiro')) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Shows por status */}
          {showSection('shows') && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Shows por Status</h3>
              {showsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={showsByStatus} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
                    <Tooltip />
                    <Bar dataKey="value" name="Shows" radius={[0, 4, 4, 0]}>
                      {showsByStatus.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                  <Mic2 className="w-8 h-8 mb-2" />
                  <p className="text-sm">Nenhum show cadastrado</p>
                </div>
              )}
            </div>
          )}

          {/* Resumo Financeiro */}
          {showSection('financeiro') && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">Total de Receitas</span>
                  </div>
                  <span className="font-bold text-green-700">{formatCurrency(metrics.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-gray-700">Total de Despesas</span>
                  </div>
                  <span className="font-bold text-red-600">{formatCurrency(metrics.totalExpenses)}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-lg ${netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                  <div className="flex items-center gap-2">
                    <DollarSign className={`w-5 h-5 ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-500'}`} />
                    <span className="text-sm text-gray-700">Saldo Líquido</span>
                  </div>
                  <span className={`font-bold text-lg ${netBalance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
                    {formatCurrency(netBalance)}
                  </span>
                </div>
                {metrics.totalRevenue === 0 && metrics.totalExpenses === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-gray-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs">Registre transações em Financeiro para ver dados aqui</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Seção dedicada: Lançamentos */}
      {showSection('lancamentos') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status dos Lançamentos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Lançamentos por Status</h3>
            {releasesList.length > 0 ? (
              <div className="space-y-2">
                {(() => {
                  const statusLabels: Record<string, string> = {
                    planning: 'Planejamento',
                    pre_production: 'Pré-produção',
                    production: 'Produção',
                    distribution: 'Distribuição',
                    active: 'Em andamento',
                    lancado: 'Lançado',
                    cancelled: 'Cancelado',
                  };
                  const statusColors: Record<string, string> = {
                    planning: 'bg-gray-100 text-gray-700',
                    pre_production: 'bg-blue-100 text-blue-700',
                    production: 'bg-indigo-100 text-indigo-700',
                    distribution: 'bg-orange-100 text-orange-700',
                    active: 'bg-yellow-100 text-yellow-700',
                    lancado: 'bg-green-100 text-green-700',
                    cancelled: 'bg-red-100 text-red-700',
                  };
                  return releasesList.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[60%]">{r.title || 'Sem título'}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {r.release_date && (
                          <span className="text-xs text-gray-400">{new Date(r.release_date).toLocaleDateString('pt-BR')}</span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {statusLabels[r.status] || r.status}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                <Music className="w-8 h-8 mb-2" />
                <p className="text-sm">Nenhum lançamento cadastrado</p>
              </div>
            )}
          </div>

          {/* Resumo de lançamentos */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Visão Geral</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-purple-600" />
                  <span className="text-sm text-gray-700">Total de lançamentos</span>
                </div>
                <span className="font-bold text-purple-700">{metrics.totalReleases}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-700">Em andamento</span>
                </div>
                <span className="font-bold text-yellow-700">{metrics.activeReleases}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">Lançados</span>
                </div>
                <span className="font-bold text-green-700">
                  {releasesList.filter(r => r.status === 'lancado').length}
                </span>
              </div>
              {metrics.totalReleases === 0 && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-gray-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs">Cadastre lançamentos no módulo Lançamentos</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resumo Executivo — só visível na visão geral */}
      {activeTemplate === 'operacao' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Resumo Executivo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="border-l-4 border-[#FFAD85] pl-4">
              <p className="text-xs text-gray-500 mb-1">Produtividade</p>
              <p className="text-xl font-bold text-gray-900">{taskCompletionRate}%</p>
              <p className="text-xs text-gray-400">taxa de conclusão</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-xs text-gray-500 mb-1">Shows Fechados</p>
              <p className="text-xl font-bold text-gray-900">{metrics.closedShows}</p>
              <p className="text-xs text-gray-400">de {metrics.totalShows} total</p>
            </div>
            <div className="border-l-4 border-indigo-500 pl-4">
              <p className="text-xs text-gray-500 mb-1">Planejamentos</p>
              <p className="text-xl font-bold text-gray-900">{metrics.activePlannings}</p>
              <p className="text-xs text-gray-400">ativos de {metrics.totalPlannings}</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <p className="text-xs text-gray-500 mb-1">Releases</p>
              <p className="text-xl font-bold text-gray-900">{metrics.activeReleases}</p>
              <p className="text-xs text-gray-400">em andamento</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
