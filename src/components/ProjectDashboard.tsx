import React, { useEffect, useState } from 'react';
import {
  Briefcase, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  User, Calendar, DollarSign, BarChart2, Tag, Layers, Plus,
  Circle, AlertCircle, Loader2, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  status: string;
  priority?: string;
  workstream?: string;
  due_date?: string;
  project_id?: string;
  assignee_id?: string;
  labels?: string[];
}

interface OrgMember { id: string; name: string; }

interface ProjectDashboardProps {
  project?: any;
  tasks?: Task[];
  departments?: any[];
  onTaskUpdate?: (task: any) => void;
  onAddTask?: () => void;
  onNavigateToTasks?: () => void;
}

const WORKSTREAMS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'conteudo',   label: 'Conteúdo',   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  { id: 'marketing',  label: 'Marketing',  color: 'text-pink-700',   bg: 'bg-pink-50 border-pink-200' },
  { id: 'shows',      label: 'Shows',      color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { id: 'logistica',  label: 'Logística',  color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { id: 'estrategia', label: 'Estratégia', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { id: 'financeiro', label: 'Financeiro', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  { id: 'lancamento', label: 'Lançamento', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  { id: 'geral',      label: 'Geral',      color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'Ativo',      color: 'text-green-700',  bg: 'bg-green-100' },
  paused:    { label: 'Pausado',    color: 'text-yellow-700', bg: 'bg-yellow-100' },
  completed: { label: 'Concluído',  color: 'text-purple-700', bg: 'bg-purple-100' },
  archived:  { label: 'Arquivado',  color: 'text-gray-600',   bg: 'bg-gray-100' },
  planning:  { label: 'Planejando', color: 'text-blue-700',   bg: 'bg-blue-100' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high:   { label: 'Alta',  color: 'text-red-600' },
  medium: { label: 'Média', color: 'text-yellow-600' },
  low:    { label: 'Baixa', color: 'text-green-600' },
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch { return '—'; }
}

function isOverdue(due_date?: string, status?: string): boolean {
  if (!due_date || status === 'done') return false;
  return new Date(due_date + 'T23:59:59') < new Date();
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ProjectDashboard({
  project,
  tasks = [],
  onNavigateToTasks,
  onAddTask,
}: ProjectDashboardProps) {
  const [artist, setArtist] = useState<{ name: string; stage_name?: string } | null>(null);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);

  useEffect(() => {
    if (!project?.artist_id) return;
    setLoadingArtist(true);
    supabase
      .from('artists')
      .select('name, stage_name')
      .eq('id', project.artist_id)
      .maybeSingle()
      .then(({ data }) => {
        setArtist(data);
        setLoadingArtist(false);
      });
  }, [project?.artist_id]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()
        .then(({ data: orgData }) => {
          if (!orgData?.organization_id) return;
          supabase
            .from('user_organizations')
            .select('user_id')
            .eq('organization_id', orgData.organization_id)
            .then(({ data: memberRows }) => {
              if (!memberRows?.length) return;
              const ids = memberRows.map((m: any) => m.user_id);
              supabase
                .from('user_profiles')
                .select('id, full_name')
                .in('id', ids)
                .then(({ data: profiles }) => {
                  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));
                  setOrgMembers(
                    ids.map((id: string) => ({
                      id,
                      name: profileMap.get(id) || `Membro ${id.substring(0, 6)}`
                    }))
                  );
                });
            });
        });
    });
  }, []);

  const getMemberName = (id?: string) =>
    id ? (orgMembers.find(m => m.id === id)?.name || null) : null;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-400">
        <Briefcase className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-lg font-medium">Nenhum projeto selecionado</p>
        <p className="text-sm mt-1">Selecione um projeto no menu lateral</p>
      </div>
    );
  }

  // ── Métricas ──────────────────────────────────────────────────────────────
  const total      = tasks.length;
  const done       = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const blocked    = tasks.filter(t => t.status === 'blocked').length;
  const todo       = tasks.filter(t => t.status === 'todo').length;
  const progress   = total > 0 ? Math.round((done / total) * 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = tasks
    .filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date + 'T23:59:59') < new Date())
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));

  const upcoming = tasks
    .filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date + 'T00:00:00') >= today)
    .sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''))
    .slice(0, 8);

  // ── Agrupamento por workstream ────────────────────────────────────────────
  const byWorkstream: Record<string, Task[]> = {};
  tasks.forEach(t => {
    const ws = t.workstream || 'geral';
    if (!byWorkstream[ws]) byWorkstream[ws] = [];
    byWorkstream[ws].push(t);
  });

  const workstreamsWithTasks = WORKSTREAMS.filter(ws => byWorkstream[ws.id]?.length > 0);

  const statusConfig = STATUS_CONFIG[project.status] || { label: project.status, color: 'text-gray-600', bg: 'bg-gray-100' };
  const artistName = artist
    ? (artist.stage_name || artist.name)
    : loadingArtist ? null : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                {artistName && (
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {artistName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                {project.start_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Início: {formatDate(project.start_date)}
                  </span>
                )}
                {project.end_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Fim: {formatDate(project.end_date)}
                  </span>
                )}
                {project.budget > 0 && (
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Orçamento: R$ {Number(project.budget).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onNavigateToTasks}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-sm shadow-purple-100 shrink-0"
            >
              <Layers className="w-4 h-4" />
              Ver no TaskBoard
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Barra de progresso */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray-600">Progresso geral</span>
              <span className="text-sm font-bold text-purple-700">{progress}%</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-[#FFAD85] rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── CARDS DE STATUS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'A Fazer',       count: todo,       icon: Circle,        color: 'text-gray-500',  bg: 'bg-white' },
            { label: 'Em Progresso',  count: inProgress, icon: Clock,         color: 'text-blue-600',  bg: 'bg-white' },
            { label: 'Bloqueadas',    count: blocked,    icon: AlertCircle,   color: 'text-red-500',   bg: 'bg-white' },
            { label: 'Concluídas',    count: done,       icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-white' },
          ].map(({ label, count, icon: Icon, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3`}>
              <Icon className={`w-6 h-6 ${color} shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── TAREFAS ATRASADAS ──────────────────────────────────────────── */}
          {overdue.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-red-700 text-sm">
                  {overdue.length} tarefa{overdue.length > 1 ? 's' : ''} atrasada{overdue.length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {overdue.map(task => {
                  const days = daysUntil(task.due_date);
                  const ws = WORKSTREAMS.find(w => w.id === task.workstream);
                  const assigneeName = getMemberName(task.assignee_id);
                  return (
                    <div key={task.id} className="px-5 py-3 flex items-start gap-3 hover:bg-red-50/30 transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-red-500 font-bold">
                            {days !== null ? `${Math.abs(days)}d atrasada` : 'Sem prazo'}
                          </span>
                          {ws && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ws.bg} ${ws.color}`}>
                              {ws.label}
                            </span>
                          )}
                          {task.priority && PRIORITY_CONFIG[task.priority] && (
                            <span className={`text-[10px] font-bold ${PRIORITY_CONFIG[task.priority].color}`}>
                              ↑ {PRIORITY_CONFIG[task.priority].label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {task.notes && (
                          <span title="Tem observações" className="text-gray-300">
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {assigneeName && (
                          <span
                            title={assigneeName}
                            className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center"
                          >
                            {getInitials(assigneeName)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PRÓXIMAS TAREFAS ───────────────────────────────────────────── */}
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${overdue.length === 0 ? 'lg:col-span-2' : ''}`}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-gray-800 text-sm">Próximas Tarefas</h3>
              </div>
              <button
                onClick={onNavigateToTasks}
                className="text-xs text-purple-600 font-semibold hover:underline flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                {total === 0
                  ? 'Nenhuma tarefa neste projeto ainda.'
                  : 'Todas as tarefas com prazo já foram concluídas.'}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcoming.map(task => {
                  const days = daysUntil(task.due_date);
                  const ws = WORKSTREAMS.find(w => w.id === task.workstream);
                  const urgent = days !== null && days <= 3;
                  const assigneeName = getMemberName(task.assignee_id);
                  return (
                    <div key={task.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                      <div className="mt-0.5 shrink-0">
                        {task.status === 'in_progress'
                          ? <Clock className="w-3.5 h-3.5 text-blue-500" />
                          : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {task.due_date && (
                            <span className={`text-xs font-bold ${urgent ? 'text-orange-500' : 'text-gray-400'}`}>
                              {formatDate(task.due_date)}
                              {days !== null && days === 0 && ' · hoje'}
                              {days !== null && days === 1 && ' · amanhã'}
                              {days !== null && days > 1 && days <= 7 && ` · em ${days}d`}
                            </span>
                          )}
                          {ws && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ws.bg} ${ws.color}`}>
                              {ws.label}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {task.notes && (
                          <span title="Tem observações" className="text-gray-300">
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {assigneeName && (
                          <span
                            title={assigneeName}
                            className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold flex items-center justify-center"
                          >
                            {getInitials(assigneeName)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── POR WORKSTREAM ──────────────────────────────────────────────── */}
        {workstreamsWithTasks.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-gray-800 text-sm">Tarefas por Área</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {workstreamsWithTasks.map(ws => {
                const wsTasks   = byWorkstream[ws.id] || [];
                const wsDone    = wsTasks.filter(t => t.status === 'done').length;
                const wsTotal   = wsTasks.length;
                const wsBlocked = wsTasks.filter(t => t.status === 'blocked').length;
                const wsPct     = wsTotal > 0 ? Math.round((wsDone / wsTotal) * 100) : 0;
                return (
                  <div key={ws.id} className={`rounded-xl border p-4 ${ws.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-bold ${ws.color}`}>{ws.label}</span>
                      <span className={`text-xs font-bold ${ws.color}`}>{wsDone}/{wsTotal}</span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${wsPct}%`, background: 'currentColor', opacity: 0.7 }}
                      />
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {wsTasks.slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center gap-1.5">
                          {t.status === 'done'
                            ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                            : t.status === 'blocked'
                              ? <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                              : <Circle className="w-3 h-3 text-gray-300 shrink-0" />}
                          <span className={`text-xs truncate ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {t.title}
                          </span>
                          {isOverdue(t.due_date, t.status) && (
                            <AlertTriangle className="w-2.5 h-2.5 text-red-400 shrink-0" />
                          )}
                        </div>
                      ))}
                      {wsTasks.length > 5 && (
                        <p className={`text-[10px] ${ws.color} font-semibold mt-1`}>
                          +{wsTasks.length - 5} tarefas
                        </p>
                      )}
                    </div>
                    {wsBlocked > 0 && (
                      <p className="text-[10px] text-red-500 font-bold mt-2">
                        ⚠ {wsBlocked} bloqueada{wsBlocked > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ESTADO VAZIO (sem tarefas) ──────────────────────────────────── */}
        {total === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma tarefa criada ainda</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">Use o Copilot para gerar tarefas, ou crie manualmente no TaskBoard.</p>
            <button
              onClick={onNavigateToTasks}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-all"
            >
              <Plus className="w-4 h-4 inline mr-1" />
              Criar Tarefa
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
