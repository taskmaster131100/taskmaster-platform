import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart2, Users, Zap, Target, TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface EventCount { event_name: string; count: number; }
interface UserJourney { user_id: string; events: string[]; last_seen: string; }

const EVENT_LABELS: Record<string, string> = {
  user_login: 'Login',
  user_session_start: 'Sessão iniciada',
  user_logout: 'Logout',
  artist_viewed: 'Artista visualizado',
  artist_created: 'Artista criado',
  artist_edited: 'Artista editado',
  project_created: 'Projeto criado',
  project_opened: 'Projeto aberto',
  copilot_message_sent: 'Mensagem no Copilot',
  task_completed: 'Tarefa concluída',
  task_status_changed: 'Status de tarefa alterado',
  taskboard_opened: 'TaskBoard aberto',
  today_block_viewed: 'Bloco "Hoje" visualizado',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AnalyticsPage() {
  const [eventCounts, setEventCounts] = useState<EventCount[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [userJourneys, setUserJourneys] = useState<UserJourney[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'journeys' | 'recent'>('overview');
  const [days, setDays] = useState(7);

  useEffect(() => {
    load();
  }, [days]);

  async function load() {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [countsRes, usersRes, recentRes, journeyRes] = await Promise.all([
      // Contagem por evento
      supabase
        .from('analytics_events')
        .select('event_name')
        .gte('created_at', since),
      // Usuários únicos
      supabase
        .from('analytics_events')
        .select('user_id')
        .gte('created_at', since),
      // Eventos recentes
      supabase
        .from('analytics_events')
        .select('event_name, properties, created_at, user_id, session_id')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50),
      // Jornadas: eventos por sessão
      supabase
        .from('analytics_events')
        .select('user_id, event_name, session_id, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true }),
    ]);

    // Contagem por tipo
    const countMap: Record<string, number> = {};
    (countsRes.data || []).forEach((r: any) => {
      countMap[r.event_name] = (countMap[r.event_name] || 0) + 1;
    });
    const counts = Object.entries(countMap)
      .map(([event_name, count]) => ({ event_name, count }))
      .sort((a, b) => b.count - a.count);
    setEventCounts(counts);

    // Usuários únicos
    const uniqueUsers = new Set((usersRes.data || []).map((r: any) => r.user_id).filter(Boolean));
    setTotalUsers(uniqueUsers.size);

    // Eventos recentes
    setRecentEvents(recentRes.data || []);

    // Jornadas por sessão (mostrar top 20 sessões com mais eventos)
    const sessionMap: Record<string, { user_id: string; events: string[]; last_seen: string }> = {};
    (journeyRes.data || []).forEach((r: any) => {
      const key = r.session_id || r.user_id;
      if (!sessionMap[key]) sessionMap[key] = { user_id: r.user_id, events: [], last_seen: r.created_at };
      sessionMap[key].events.push(r.event_name);
      sessionMap[key].last_seen = r.created_at;
    });
    const journeys = Object.values(sessionMap)
      .sort((a, b) => new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime())
      .slice(0, 20);
    setUserJourneys(journeys);

    setLoading(false);
  }

  const maxCount = eventCounts[0]?.count || 1;

  // Calcular métricas derivadas
  const copilotMsgs = eventCounts.find(e => e.event_name === 'copilot_message_sent')?.count || 0;
  const projectsCreated = eventCounts.find(e => e.event_name === 'project_created')?.count || 0;
  const tasksCompleted = eventCounts.find(e => e.event_name === 'task_completed')?.count || 0;
  const logins = eventCounts.find(e => e.event_name === 'user_login')?.count || 0;

  // Detectar possíveis pontos de abandono (sessões com poucos eventos)
  const abandonedSessions = userJourneys.filter(j => j.events.length <= 2).length;
  const activeSessions = userJourneys.filter(j => j.events.length >= 5).length;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-purple-600" />
              Auditoria de Uso
            </h1>
            <p className="text-sm text-gray-500 mt-1">Comportamento real dos usuários na plataforma</p>
          </div>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white"
          >
            <option value={1}>Hoje</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">Carregando dados...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Usuários ativos', value: totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Logins', value: logins, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Projetos criados', value: projectsCreated, icon: Target, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Tarefas concluídas', value: tasksCompleted, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Alertas de comportamento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`rounded-2xl border p-4 ${abandonedSessions > activeSessions ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`w-4 h-4 ${abandonedSessions > activeSessions ? 'text-red-500' : 'text-green-500'}`} />
                  <span className="text-sm font-bold text-gray-800">Abandono</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{abandonedSessions}</p>
                <p className="text-xs text-gray-500">sessões com ≤2 ações (entrou e saiu)</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold text-gray-800">Engajamento</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{activeSessions}</p>
                <p className="text-xs text-gray-500">sessões com ≥5 ações (usuário ativo)</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-bold text-gray-800">Uso da IA</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{copilotMsgs}</p>
                <p className="text-xs text-gray-500">mensagens enviadas no Copilot</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 w-fit">
              {(['overview', 'journeys', 'recent'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {t === 'overview' ? 'Eventos' : t === 'journeys' ? 'Jornadas' : 'Recentes'}
                </button>
              ))}
            </div>

            {/* Overview */}
            {tab === 'overview' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-800 text-sm">Eventos por tipo</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Quais funcionalidades são mais usadas</p>
                </div>
                <div className="p-5 space-y-3">
                  {eventCounts.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6">Nenhum evento registrado ainda.</p>
                  )}
                  {eventCounts.map(({ event_name, count }) => (
                    <div key={event_name} className="flex items-center gap-3">
                      <div className="w-44 shrink-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{EVENT_LABELS[event_name] || event_name}</p>
                      </div>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-orange-400 rounded-full transition-all"
                          style={{ width: `${Math.round((count / maxCount) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-600 w-8 text-right shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Journeys */}
            {tab === 'journeys' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-800 text-sm">Jornadas de sessão</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Sequência de ações por sessão — mostra onde o usuário para</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {userJourneys.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-6 px-5">Nenhuma jornada registrada ainda.</p>
                  )}
                  {userJourneys.map((j, i) => (
                    <div key={i} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${j.events.length >= 5 ? 'bg-green-100 text-green-700' : j.events.length <= 2 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {j.events.length} ações
                        </span>
                        <span className="text-[10px] text-gray-400">{formatDate(j.last_seen)}</span>
                        {j.events.length <= 2 && (
                          <span className="text-[10px] text-red-500 font-bold">⚠ abandono</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {j.events.map((ev, idx) => (
                          <React.Fragment key={idx}>
                            <span className="text-[10px] bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                              {EVENT_LABELS[ev] || ev}
                            </span>
                            {idx < j.events.length - 1 && (
                              <span className="text-gray-300 text-[10px]">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent */}
            {tab === 'recent' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h3 className="font-bold text-gray-800 text-sm">Eventos recentes</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentEvents.map((ev, i) => (
                    <div key={i} className="px-5 py-2.5 flex items-center gap-3">
                      <span className="text-[10px] text-gray-400 w-28 shrink-0">{formatDate(ev.created_at)}</span>
                      <span className="text-xs font-semibold text-gray-700">
                        {EVENT_LABELS[ev.event_name] || ev.event_name}
                      </span>
                      {ev.properties && Object.keys(ev.properties).length > 0 && (
                        <span className="text-[10px] text-gray-400 truncate max-w-xs">
                          {Object.entries(ev.properties).filter(([, v]) => v != null).map(([k, v]) => `${k}=${v}`).join(' · ')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
