import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FolderOpen, DollarSign, Calendar, Music, Rocket, Search,
  MoreVertical, TrendingUp, TrendingDown, Loader2, Sparkles,
  AlertTriangle, Info, CheckCircle2, ArrowRight, Building2, Plus,
  Clock, Mic2, Disc3, Archive, ExternalLink, Play, Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getProactiveSuggestions, Suggestion } from '../services/suggestionService';
import { checkTaskDeadlines, checkUpcomingShows, checkUpcomingReleases } from '../services/notificationService';
import VirtualAgentWidget from './VirtualAgentWidget';

interface OrganizationDashboardProps {
  onSelectArtist: (id: string) => void;
  onCreateArtist: () => void;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  projects: any[];
  departments: any[];
  users: any[];
}

export default function OrganizationDashboard({
  onSelectArtist,
  onCreateArtist,
  onSelectProject,
  onCreateProject,
  projects: initialProjects,
  departments,
  users
}: OrganizationDashboardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>(initialProjects || []);
  const [projectTaskCounts, setProjectTaskCounts] = useState<Record<string, { total: number; done: number }>>({});
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [todayData, setTodayData] = useState<{
    tasksDueToday: any[];
    showsThisWeek: any[];
    releasesThisWeek: any[];
    nextTask: any | null;
  }>({ tasksDueToday: [], showsThisWeek: [], releasesThisWeek: [], nextTask: null });
  const [startingTask, setStartingTask] = useState(false);
  const [stats, setStats] = useState([
    {
      icon: Music,
      label: 'Artistas',
      value: '0',
      subtitle: 'carregando...',
      color: 'from-cyan-500 to-cyan-600',
      iconColor: 'text-cyan-600',
      onClick: () => navigate('/artists')
    },
    {
      icon: Rocket,
      label: 'Projetos',
      value: '0',
      subtitle: 'carregando...',
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
      onClick: () => navigate('/tasks')
    },
    {
      icon: DollarSign,
      label: 'Faturamento',
      value: 'R$ 0,00',
      subtitle: 'este mês',
      trend: 'up',
      color: 'from-green-500 to-green-600',
      iconColor: 'text-green-600',
      onClick: () => navigate('/finance')
    },
    {
      icon: Calendar,
      label: 'Próximos Shows',
      value: '0',
      subtitle: 'carregando...',
      color: 'from-yellow-500 to-yellow-600',
      iconColor: 'text-yellow-600',
      onClick: () => navigate('/shows')
    }
  ]);

  useEffect(() => {
    loadDashboardData();
    // Executar verificações automáticas de notificações
    checkTaskDeadlines();
    checkUpcomingShows();
    checkUpcomingReleases();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // 1. Carregar Artistas
      const { data: artistsData } = await supabase
        .from('artists')
        .select('*')
        .neq('status', 'archived')
        .order('name');
      
      const artistsList = artistsData || [];
      setArtists(artistsList);

      // 2. Carregar Projetos: tabela projects + plannings
      // Cross-filtrar projetos de artistas arquivados usando a lista de artistas ativos acima
      const activeArtistIds = new Set(artistsList.map((a: any) => a.id));
      const [{ data: projectsData }, { data: planningsData }] = await Promise.all([
        supabase.from('projects').select('id, name, status, created_at, artist_id').neq('status', 'archived'),
        supabase.from('plannings').select('id, name, status, created_at')
      ]);
      const filteredProjects = (projectsData || []).filter((p: any) =>
        !p.artist_id || activeArtistIds.has(p.artist_id)
      );
      const combinedProjects = [...filteredProjects, ...(planningsData || [])];
      setProjects(combinedProjects);

      // Contar tarefas por projeto (1 query em lote)
      const projectIds = filteredProjects.map((p: any) => p.id);
      if (projectIds.length > 0) {
        const { data: taskRows } = await supabase
          .from('tasks')
          .select('project_id, status')
          .in('project_id', projectIds)
          .is('parent_task_id', null);
        const counts: Record<string, { total: number; done: number }> = {};
        (taskRows || []).forEach((t: any) => {
          if (!counts[t.project_id]) counts[t.project_id] = { total: 0, done: 0 };
          counts[t.project_id].total++;
          if (t.status === 'done') counts[t.project_id].done++;
        });
        setProjectTaskCounts(counts);
      }

      // 3. Carregar Shows
      const { data: showsData } = await supabase
        .from('shows')
        .select('*')
        .gte('show_date', new Date().toISOString().split('T')[0]);
      
      const showsCount = showsData?.length || 0;

      // 4. Carregar Financeiro (Faturamento do mês)
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      const { data: financeData } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('type', 'revenue')
        .eq('status', 'paid')
        .gte('transaction_date', firstDayOfMonth.toISOString().split('T')[0]);
      
      const totalRevenue = financeData?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

      // 5. Carregar Sugestões Proativas
      const proactiveSuggestions = await getProactiveSuggestions();
      setSuggestions(proactiveSuggestions);

      // 6. Carregar dados de "Hoje"
      const today = new Date().toISOString().split('T')[0];
      const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const [tasksTodayResult, showsWeekResult, releasesWeekResult, nextTaskResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, status, deadline, priority')
          .neq('status', 'done')
          .lte('deadline', today)
          .order('deadline', { ascending: true })
          .limit(5),
        supabase
          .from('shows')
          .select('id, title, show_date, city, status')
          .gte('show_date', today)
          .lte('show_date', in7days)
          .order('show_date', { ascending: true })
          .limit(3),
        supabase
          .from('releases')
          .select('id, title, release_date, status')
          .gte('release_date', today)
          .lte('release_date', in7days)
          .order('release_date', { ascending: true })
          .limit(3),
        supabase
          .from('tasks')
          .select('id, title, status, deadline, priority')
          .in('status', ['todo', 'not_started', 'pending'])
          .order('deadline', { ascending: true, nullsFirst: false })
          .limit(1),
      ]);

      const overdueTasks = tasksTodayResult.data || [];
      const primaryTask = overdueTasks[0] || nextTaskResult.data?.[0] || null;

      setTodayData({
        tasksDueToday: overdueTasks,
        showsThisWeek: showsWeekResult.data || [],
        releasesThisWeek: releasesWeekResult.data || [],
        nextTask: primaryTask,
      });

      // Atualizar Stats
      setStats([
        {
          icon: Music,
          label: 'Artistas',
          value: artistsList.length.toString(),
          subtitle: `${artistsList.length} talentos ativos`,
          color: 'from-cyan-500 to-cyan-600',
          iconColor: 'text-cyan-600',
          onClick: () => navigate('/artists')
        },
        {
          icon: Rocket,
          label: 'Projetos',
          value: combinedProjects.length.toString(),
          subtitle: `${combinedProjects.length} projeto${combinedProjects.length !== 1 ? 's' : ''} ativo${combinedProjects.length !== 1 ? 's' : ''}`,
          color: 'from-orange-500 to-orange-600',
          iconColor: 'text-orange-600',
          onClick: () => navigate('/tasks')
        },
        {
          icon: DollarSign,
          label: 'Faturamento',
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue),
          subtitle: 'receita confirmada',
          trend: 'up',
          color: 'from-green-500 to-green-600',
          iconColor: 'text-green-600',
          onClick: () => navigate('/finance')
        },
        {
          icon: Calendar,
          label: 'Próximos Shows',
          value: showsCount.toString(),
          subtitle: 'agenda futura',
          color: 'from-yellow-500 to-yellow-600',
          iconColor: 'text-yellow-600',
          onClick: () => navigate('/shows')
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setLoadError('Não foi possível carregar os dados da organização. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function startTask(taskId: string) {
    setStartingTask(true);
    try {
      await supabase.from('tasks').update({ status: 'in_progress' }).eq('id', taskId);
      setTodayData(prev => ({
        ...prev,
        tasksDueToday: prev.tasksDueToday.map(t => t.id === taskId ? { ...t, status: 'in_progress' } : t),
        nextTask: prev.nextTask?.id === taskId ? { ...prev.nextTask, status: 'in_progress' } : prev.nextTask,
      }));
    } finally {
      setStartingTask(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#FFAD85] animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando seu escritório virtual...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600 mb-6">{loadError}</p>
          <button
            onClick={() => { setLoadError(null); loadDashboardData(); }}
            className="px-6 py-3 bg-[#FFAD85] text-white rounded-xl font-semibold hover:bg-[#FF9B6A] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  const isSoloArtist = artists.length === 1;

  const hasTodayItems =
    todayData.tasksDueToday.length > 0 ||
    todayData.showsThisWeek.length > 0 ||
    todayData.releasesThisWeek.length > 0 ||
    !!todayData.nextTask;

  const todayLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long'
  });

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Virtual Agent Proactive Notifications */}
      <VirtualAgentWidget />

      {/* Seção HOJE — prioridades do dia */}
      {hasTodayItems && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              Hoje — {todayLabel}
            </span>
          </div>
          {/* Primary task — Começar agora */}
          {todayData.nextTask && (
            <div className={`flex items-center gap-4 px-5 py-4 border-b border-gray-100 ${todayData.tasksDueToday.length > 0 ? 'bg-red-50/60' : 'bg-orange-50/60'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${todayData.tasksDueToday.length > 0 ? 'bg-red-100' : 'bg-orange-100'}`}>
                <Zap className={`w-4 h-4 ${todayData.tasksDueToday.length > 0 ? 'text-red-600' : 'text-orange-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                  {todayData.tasksDueToday.length > 0 ? 'Tarefa urgente' : 'Próxima tarefa'}
                </p>
                <p className="text-sm font-semibold text-gray-800 truncate">{todayData.nextTask.title}</p>
              </div>
              {todayData.nextTask.status !== 'in_progress' ? (
                <button
                  onClick={() => startTask(todayData.nextTask.id)}
                  disabled={startingTask}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  <Play className="w-3 h-3" />
                  Começar agora
                </button>
              ) : (
                <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  Em andamento
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

            {/* Tarefas urgentes */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${todayData.tasksDueToday.length > 0 ? 'bg-red-500' : 'bg-gray-300'}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Tarefas vencendo
                </span>
                {todayData.tasksDueToday.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {todayData.tasksDueToday.length}
                  </span>
                )}
              </div>
              {todayData.tasksDueToday.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma tarefa urgente</p>
              ) : (
                <ul className="space-y-1.5">
                  {todayData.tasksDueToday.map(task => (
                    <li key={task.id}
                      onClick={() => navigate('/tasks')}
                      className="text-sm text-gray-700 hover:text-indigo-600 cursor-pointer flex items-start gap-1.5 group"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="truncate group-hover:underline">{task.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              {todayData.tasksDueToday.length > 0 && (
                <button
                  onClick={() => navigate('/tasks')}
                  className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Ver todas <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Shows desta semana */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${todayData.showsThisWeek.length > 0 ? 'bg-yellow-500' : 'bg-gray-300'}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Shows esta semana
                </span>
                {todayData.showsThisWeek.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                    {todayData.showsThisWeek.length}
                  </span>
                )}
              </div>
              {todayData.showsThisWeek.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum show esta semana</p>
              ) : (
                <ul className="space-y-1.5">
                  {todayData.showsThisWeek.map(show => (
                    <li key={show.id}
                      onClick={() => navigate('/shows')}
                      className="text-sm text-gray-700 hover:text-indigo-600 cursor-pointer flex items-start gap-1.5 group"
                    >
                      <Mic2 className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="truncate group-hover:underline">
                        {show.title} — {new Date(show.show_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {todayData.showsThisWeek.length > 0 && (
                <button
                  onClick={() => navigate('/shows')}
                  className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Ver shows <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Lançamentos esta semana */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2 h-2 rounded-full ${todayData.releasesThisWeek.length > 0 ? 'bg-purple-500' : 'bg-gray-300'}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Lançamentos esta semana
                </span>
                {todayData.releasesThisWeek.length > 0 && (
                  <span className="ml-auto text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {todayData.releasesThisWeek.length}
                  </span>
                )}
              </div>
              {todayData.releasesThisWeek.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum lançamento esta semana</p>
              ) : (
                <ul className="space-y-1.5">
                  {todayData.releasesThisWeek.map(release => (
                    <li key={release.id}
                      onClick={() => navigate('/releases')}
                      className="text-sm text-gray-700 hover:text-indigo-600 cursor-pointer flex items-start gap-1.5 group"
                    >
                      <Disc3 className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="truncate group-hover:underline">
                        {release.title} — {new Date(release.release_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {todayData.releasesThisWeek.length > 0 && (
                <button
                  onClick={() => navigate('/releases')}
                  className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  Ver lançamentos <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Welcome & Organization Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isSoloArtist ? `Olá, ${artists[0].name}` : 'Central de Comando'}
          </h1>
          <p className="text-gray-600">
            {isSoloArtist ? 'Sua carreira musical em 360°' : 'Gerencie sua produtora e artistas em 360°'}
          </p>
        </div>
        <div className="flex gap-3">
          {!isSoloArtist && (
            <button
              onClick={() => navigate('/team')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm font-medium"
            >
              <Building2 className="w-4 h-4 text-purple-600" />
              Minha Organização
            </button>
          )}
          <button
            onClick={isSoloArtist ? () => onSelectArtist(artists[0].id) : onCreateArtist}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-md transition-all shadow-sm text-sm font-medium"
          >
            {isSoloArtist ? <Music className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSoloArtist ? 'Meu Perfil Artístico' : 'Novo Artista'}
          </button>
        </div>
      </div>

      {/* Empty State — new user onboarding */}
      {artists.length === 0 && !loading && (
        <div className="mb-8 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#FFAD85] rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bem-vindo ao TaskMaster!</h2>
              <p className="text-gray-600 text-sm">Comece cadastrando seu primeiro artista para ativar todos os módulos.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={onCreateArtist}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-orange-200 hover:border-[#FFAD85] hover:shadow-md transition-all text-left"
            >
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-[#FF8C5A]" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Criar Artista</div>
                <div className="text-xs text-gray-500">Passo 1 de 3</div>
              </div>
            </button>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 opacity-60 cursor-not-allowed text-left">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <div className="font-semibold text-gray-700 text-sm">Adicionar Show</div>
                <div className="text-xs text-gray-400">Passo 2 de 3</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 opacity-60 cursor-not-allowed text-left">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Rocket className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <div className="font-semibold text-gray-700 text-sm">Planejar Lançamento</div>
                <div className="text-xs text-gray-400">Passo 3 de 3</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Stats */}
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                onClick={stat.onClick}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md hover:border-[#FFAD85] transition-all cursor-pointer touch-button"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {stat.trend && (
                    stat.trend === 'up' ?
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" /> :
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600">{stat.label}</h3>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                  {stat.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proactive Suggestions Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Sugestões do TaskMaster</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <div 
                key={suggestion.id}
                className={`p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between touch-button ${
                  suggestion.type === 'warning' ? 'border-l-4 border-l-amber-500' : 
                  suggestion.type === 'action' ? 'border-l-4 border-l-purple-500' : 
                  'border-l-4 border-l-blue-500'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {suggestion.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                    {suggestion.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                    {suggestion.type === 'action' && <Sparkles className="w-4 h-4 text-purple-500" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {suggestion.module}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{suggestion.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4">{suggestion.description}</p>
                </div>
                
                {suggestion.actionLabel && (
                  <button 
                    onClick={() => navigate(suggestion.actionPath || '/')}
                    className="flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors mt-auto touch-button"
                  >
                    {suggestion.actionLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-6 sm:p-8 rounded-xl border border-dashed border-gray-300 text-center">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900">Tudo em ordem!</h3>
              <p className="text-xs sm:text-sm text-gray-600">Não há pendências críticas ou sugestões no momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/planejamento')}
            className="bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] text-white p-5 rounded-xl shadow-sm hover:shadow-lg transition-all text-left group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-6 h-6" />
              <span className="font-bold text-sm">Criar Projeto com IA</span>
            </div>
            <p className="text-xs text-white/80">Converse com a IA e transforme sua ideia em fluxo de trabalho</p>
          </button>
          <button
            onClick={onCreateArtist}
            className="bg-white border border-gray-200 text-gray-900 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-purple-300 transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Music className="w-6 h-6 text-purple-600" />
              <span className="font-bold text-sm">Novo Artista</span>
            </div>
            <p className="text-xs text-gray-500">Cadastre um novo talento na plataforma</p>
          </button>
          <button
            onClick={() => navigate('/finance')}
            className="bg-white border border-gray-200 text-gray-900 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <span className="font-bold text-sm">Financeiro</span>
            </div>
            <p className="text-xs text-gray-500">Gerencie receitas, despesas e relatórios</p>
          </button>
          <button
            onClick={() => navigate('/marketing')}
            className="bg-white border border-gray-200 text-gray-900 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-pink-300 transition-all text-left"
          >
            <div className="flex items-center gap-3 mb-2">
              <Rocket className="w-6 h-6 text-pink-600" />
              <span className="font-bold text-sm">Marketing IA</span>
            </div>
            <p className="text-xs text-gray-500">Gere conteúdo com inteligência artificial</p>
          </button>
        </div>
      </div>

      {/* Artists Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-900">Nossos Talentos</h2>
            </div>
            <button
              onClick={onCreateArtist}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
            >
              <Music className="w-4 h-4" />
              Novo Talento
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar artistas..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Artista
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Gênero
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {artists.map((artist) => (
                <tr
                  key={artist.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onSelectArtist(artist.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {artist.stage_name?.charAt(0) || artist.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{artist.stage_name || artist.name}</div>
                        <div className="text-sm text-gray-500">{artist.genre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-700">{artist.genre}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      artist.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${artist.status === 'ativo' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                      {artist.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-700 capitalize">{artist.contract_type?.replace('_', ' ') || 'Não definido'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtist(artist.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#FF9B6A] hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {artists.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">Nenhum artista cadastrado</p>
            <p className="text-gray-400 text-sm mb-4">Comece adicionando seu primeiro talento</p>
            <button
              onClick={onCreateArtist}
              className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors text-sm font-medium"
            >
              Adicionar Artista
            </button>
          </div>
        )}
      </div>

      {/* Projects Table */}
      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Projetos</h2>
          </div>
          <button
            onClick={() => navigate('/planejamento')}
            className="px-4 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg hover:shadow-lg transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Projeto</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Artista</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tarefas</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {projects.map((project) => {
                const counts = projectTaskCounts[project.id];
                const pct = counts && counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : null;
                const artistObj = artists.find((a: any) => a.id === project.artist_id);
                const artistName = artistObj ? (artistObj.stage_name || artistObj.name) : null;
                return (
                <tr
                  key={project.id}
                  className="hover:bg-orange-50/30 transition-colors cursor-pointer"
                  onClick={() => onSelectProject(project.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(project.name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{project.name || project.title}</p>
                        {project.created_at && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            Criado em {new Date(project.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {artistName ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full">
                        {artistName}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {counts ? (
                      <div className="min-w-[80px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{counts.done}/{counts.total}</span>
                          {pct !== null && (
                            <span className={`text-xs font-bold ${pct === 100 ? 'text-green-600' : 'text-orange-500'}`}>{pct}%</span>
                          )}
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                          <div
                            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-400' : 'bg-[#FFAD85]'}`}
                            style={{ width: `${pct ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">Sem tarefas</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      project.status === 'active' || project.status === 'ativo'
                        ? 'bg-green-100 text-green-700'
                        : project.status === 'completed' || project.status === 'concluido'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        project.status === 'active' || project.status === 'ativo' ? 'bg-green-500' :
                        project.status === 'completed' || project.status === 'concluido' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></span>
                      {project.status === 'active' ? 'Ativo' :
                       project.status === 'completed' ? 'Concluído' :
                       project.status || 'Ativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectProject(project.id); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-[#FF9B6A] hover:bg-orange-50 rounded-lg transition-colors"
                        title="Abrir projeto"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Arquivar "${project.name || project.title}"? O projeto não aparecerá mais na lista, mas os dados ficam salvos.`)) return;
                          const { error } = await supabase.from('projects').update({ status: 'archived' }).eq('id', project.id);
                          if (error) { console.error(error); return; }
                          setProjects(prev => prev.filter(p => p.id !== project.id));
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Arquivar projeto"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <Rocket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">Nenhum projeto ativo</p>
            <p className="text-gray-400 text-sm mb-4">Crie seu primeiro projeto com o Copilot IA</p>
            <button
              onClick={() => navigate('/planejamento')}
              className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors text-sm font-medium"
            >
              Criar Projeto com IA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
