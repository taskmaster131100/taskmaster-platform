import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, Users, Megaphone, Video, Music, TrendingUp, BarChart, Map, FileText, Info, User, Settings, Plus, Clock, CheckCircle, AlertCircle, ExternalLink, Loader2, Lightbulb, Target, Eye, Zap, Shield, BookOpen, Guitar, Mic2, Package, DollarSign, Compass, Rocket, LayoutGrid, ChevronDown, ChevronRight, Layers, Filter, X } from 'lucide-react';
import AIMarketingAssistant from './AIMarketingAssistant';
import InviteManager from './InviteManager';
import { supabase } from '../lib/supabase';
import { getSubTasksForWorkstream, getPhasesForWorkstream, OPERATIONAL_TEMPLATES } from '../services/operationalTemplates';
import { toast } from 'sonner';

// ============================================================
// SectorTaskView — Telas de setor com tarefas pai + sub-tarefas
// Regra: tarefas pai mostradas como cards expandíveis;
// sub-tarefas geradas on-demand via OPERATIONAL_TEMPLATES.
// ============================================================
const SECTOR_META: Record<string, { label: string; description: string; icon: React.ComponentType<any>; color: string }> = {
  producao_musical: { label: 'Produção Musical', description: 'Gravação, mixagem, masterização, arranjo e estúdio', icon: Guitar, color: 'text-purple-600' },
  conteudo:         { label: 'Conteúdo',          description: 'Vídeo, foto, clipe, arte, design e redes sociais',   icon: Video,   color: 'text-blue-600' },
  marketing:        { label: 'Marketing',          description: 'Divulgação, press release, ads e imprensa',          icon: Megaphone, color: 'text-pink-600' },
  shows:            { label: 'Shows',              description: 'Booking, rider técnico, contratos e apresentações',  icon: Mic2,    color: 'text-green-600' },
  logistica:        { label: 'Logística',          description: 'Transporte, hospedagem, equipamentos e estrutura',   icon: Package, color: 'text-orange-600' },
  estrategia:       { label: 'Estratégia',         description: 'Posicionamento, parcerias e planejamento',           icon: Compass, color: 'text-indigo-600' },
  financeiro:       { label: 'Financeiro',         description: 'Orçamento, pagamentos, contratos e cachê',          icon: DollarSign, color: 'text-emerald-600' },
  lancamento:       { label: 'Lançamento',         description: 'Distribuição digital, playlists e pitching',        icon: Rocket,  color: 'text-red-600' },
  geral:            { label: 'Geral',              description: 'Tarefas diversas sem categorização específica',      icon: LayoutGrid, color: 'text-gray-600' },
};

interface SectorStats {
  total: number;
  todo: number;
  in_progress: number;
  done: number;
  overdue: number;
  nextStep: { title: string; project: string; due_date: string | null } | null;
}

// ────────────────────────────────────────────────────────────
// Tipos internos do SectorTaskView
// ────────────────────────────────────────────────────────────
interface ParentTask {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  project_id: string | null;
  project_name: string | null;
  subTotal?: number;
  subDone?: number;
}

interface SubTask {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  phase: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'Pendente',
  in_progress: 'Em andamento',
  done: 'Concluído',
  blocked: 'Bloqueado',
};

const STATUS_COLOR: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-gray-400',
};

// ────────────────────────────────────────────────────────────
// ParentTaskCard — tarefa pai com expand/collapse de sub-tasks
// P1: lock via useRef previne double-click; dedup por título
// P2: badges de fase (Concluída / Fase atual / Próxima fase)
// ────────────────────────────────────────────────────────────
const ParentTaskCard = ({
  task,
  workstream,
  today,
  onStatusChange,
}: {
  task: ParentTask;
  workstream: string;
  today: string;
  onStatusChange: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [generating, setGenerating] = useState(false);
  // P1: lock para evitar dupla geração por clique rápido
  const generatingRef = React.useRef(false);
  const phases = getPhasesForWorkstream(workstream);
  const isOverdue = task.status !== 'done' && task.due_date && task.due_date < today;

  const loadSubTasks = async (): Promise<SubTask[]> => {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, phase')
      .eq('parent_task_id', task.id)
      .order('due_date', { ascending: true, nullsFirst: false });
    return (data || []) as SubTask[];
  };

  const handleExpand = async () => {
    // Recolher se já expandido
    if (expanded) {
      setExpanded(false);
      return;
    }

    // P1: prevenir duplo-clique durante geração
    if (generatingRef.current) return;

    const existing = await loadSubTasks();
    if (existing.length > 0) {
      setSubTasks(existing);
      setExpanded(true);
      return;
    }

    // Gerar sub-tarefas on-demand
    const template = getSubTasksForWorkstream(workstream);
    if (template.length === 0) {
      setExpanded(true);
      return;
    }

    generatingRef.current = true;
    setGenerating(true);
    try {
      const baseDate = task.due_date
        ? new Date(String(task.due_date).slice(0, 10) + 'T12:00:00')
        : new Date();

      // P1: dedup por título normalizado (lowercase + trim + colapsar espaços)
      // Cobre variações de digitação, cópia com espaços extras, etc.
      const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
      const existingTitles = new Set(existing.map((s: SubTask) => normalize(s.title)));
      const newRows = template
        .slice(0, 12)
        .filter(st => !existingTitles.has(normalize(st.title)))
        .map(st => {
          const dueDate = new Date(baseDate);
          dueDate.setDate(dueDate.getDate() - (st.days_from_parent || 0));
          return {
            title: st.title,
            status: 'todo',
            priority: st.priority,
            phase: st.phase,
            workstream,
            parent_task_id: task.id,
            project_id: task.project_id,
            due_date: dueDate.toISOString().split('T')[0],
          };
        });

      if (newRows.length > 0) {
        const { error } = await supabase.from('tasks').insert(newRows);
        if (error) throw error;
      }

      const created = await loadSubTasks();
      setSubTasks(created);
      toast.success(`${created.length} sub-tarefas geradas`);
      window.dispatchEvent(new CustomEvent('taskmaster:task-updated'));
    } catch (e) {
      console.error('[SectorTaskView] erro ao gerar sub-tarefas:', e);
      toast.error('Erro ao gerar sub-tarefas');
    } finally {
      setGenerating(false);
      generatingRef.current = false;
    }
    setExpanded(true);
  };

  const toggleSubTaskStatus = async (st: SubTask) => {
    const next = st.status === 'done' ? 'todo' : st.status === 'todo' ? 'in_progress' : 'done';
    await supabase.from('tasks').update({ status: next }).eq('id', st.id);

    const updatedSubTasks = subTasks.map(s => s.id === st.id ? { ...s, status: next } : s);
    setSubTasks(updatedSubTasks);

    // Auto-update status da tarefa pai com base nas sub-tarefas
    const allDone = updatedSubTasks.every(s => s.status === 'done');
    const anyInProgress = updatedSubTasks.some(s => s.status === 'in_progress');
    const parentNext = allDone ? 'done' : anyInProgress ? 'in_progress' : 'todo';

    if (parentNext !== task.status) {
      await supabase.from('tasks').update({ status: parentNext }).eq('id', task.id);
      if (allDone) toast.success('Tarefa concluída automaticamente!');
    }

    window.dispatchEvent(new CustomEvent('taskmaster:task-updated'));
    // Recarregar para atualizar os counts no card colapsado (subTotal/subDone)
    onStatusChange();
  };

  // Agrupar sub-tarefas por fase
  const byPhase: Record<string, SubTask[]> = {};
  subTasks.forEach(st => {
    const key = st.phase || 'sem_fase';
    if (!byPhase[key]) byPhase[key] = [];
    byPhase[key].push(st);
  });

  const phaseOrder = phases.map(p => p.id);
  const sortedPhaseKeys = Object.keys(byPhase).sort((a, b) => {
    const ia = phaseOrder.indexOf(a);
    const ib = phaseOrder.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  const phaseLabel = (key: string) =>
    phases.find(p => p.id === key)?.label || key.replace(/_/g, ' ');

  // P2: calcular estado de cada fase (concluída / atual / próxima / futura)
  const phaseStates: Record<string, 'done' | 'current' | 'next' | 'future'> = {};
  let foundCurrent = false;
  let foundNext = false;
  sortedPhaseKeys.forEach((key, idx) => {
    const pTasks = byPhase[key];
    const allDone = pTasks.every(t => t.status === 'done');
    if (allDone) {
      phaseStates[key] = 'done';
    } else if (!foundCurrent) {
      phaseStates[key] = 'current';
      foundCurrent = true;
    } else if (!foundNext) {
      phaseStates[key] = 'next';
      foundNext = true;
    } else {
      phaseStates[key] = 'future';
    }
  });

  const PHASE_BADGE: Record<string, { label: string; cls: string }> = {
    done:    { label: 'Concluída',   cls: 'bg-green-100 text-green-700' },
    current: { label: 'Fase atual',  cls: 'bg-blue-100 text-blue-700' },
    next:    { label: 'Próxima',     cls: 'bg-indigo-100 text-indigo-600' },
    future:  { label: 'Futura',      cls: 'bg-gray-100 text-gray-400' },
  };

  return (
    <div className={`bg-white rounded-xl border ${isOverdue ? 'border-red-200' : 'border-gray-100'} shadow-sm overflow-hidden`}>
      {/* Cabeçalho da tarefa pai */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[task.status] || STATUS_COLOR.todo}`}>
              {STATUS_LABEL[task.status] || task.status}
            </span>
            {task.priority && (
              <span className={`text-[10px] font-bold uppercase ${PRIORITY_COLOR[task.priority] || ''}`}>
                {task.priority === 'high' ? '↑ Alta' : task.priority === 'medium' ? '→ Média' : '↓ Baixa'}
              </span>
            )}
            {isOverdue && (
              <span className="text-[10px] font-bold text-red-600">⚠ Atrasado</span>
            )}
          </div>
          <div className="text-sm font-semibold text-gray-800 truncate">{task.title}</div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
            {task.project_name && <span className="truncate">{task.project_name}</span>}
            {task.due_date && (
              <>
                {task.project_name && <span>·</span>}
                <span className={task.due_date < today && task.status !== 'done' ? 'text-red-500' : ''}>
                  {new Date(String(task.due_date).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </>
            )}
            {/* Indicador de progresso de sub-tarefas (quando já geradas) */}
            {task.subTotal != null && task.subTotal > 0 && (
              <>
                <span>·</span>
                <span className={task.subDone === task.subTotal ? 'text-green-500 font-medium' : 'text-gray-400'}>
                  {task.subDone}/{task.subTotal} etapas
                </span>
                <div className="w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${task.subDone === task.subTotal ? 'bg-green-400' : 'bg-indigo-400'}`}
                    style={{ width: `${Math.round(((task.subDone || 0) / task.subTotal) * 100)}%` }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <button
          onClick={handleExpand}
          disabled={generating}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex-shrink-0 mt-0.5 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          {generating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : expanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          {generating ? 'Gerando…' : expanded ? 'Recolher' : 'Expandir operação'}
        </button>
      </div>

      {/* Sub-tarefas expandidas */}
      {expanded && (
        <div className="border-t border-gray-50 bg-gray-50 px-4 py-3 space-y-4">
          {subTasks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">
              {OPERATIONAL_TEMPLATES[workstream]
                ? 'Nenhum template disponível para este setor.'
                : 'Nenhum template disponível para este setor.'}
            </p>
          ) : (
            sortedPhaseKeys.map(phaseKey => {
              const phaseTasks = byPhase[phaseKey];
              const phaseDone = phaseTasks.filter(t => t.status === 'done').length;
              const phasePct = Math.round((phaseDone / phaseTasks.length) * 100);
              const phaseState = phaseStates[phaseKey] || 'future';
              const badge = PHASE_BADGE[phaseState];
              const isCurrentPhase = phaseState === 'current';
              return (
                <div key={phaseKey}>
                  {/* Header da fase — P2: badge de estado */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Layers className={`w-3 h-3 ${isCurrentPhase ? 'text-blue-500' : 'text-indigo-300'}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrentPhase ? 'text-blue-700' : 'text-indigo-400'}`}>
                        {phaseLabel(phaseKey)}
                      </span>
                    </div>
                    {/* Badge de estado da fase */}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-gray-400 font-medium">{phaseDone}/{phaseTasks.length}</span>
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${phaseState === 'done' ? 'bg-green-400' : 'bg-indigo-400'}`}
                        style={{ width: `${phasePct}%` }}
                      />
                    </div>
                  </div>
                  {/* Sub-tarefas da fase */}
                  <div className="space-y-1.5">
                    {phaseTasks.map(st => (
                      <div
                        key={st.id}
                        className={`flex items-start gap-2.5 bg-white rounded-lg px-3 py-2 border ${
                          isCurrentPhase && st.status !== 'done' ? 'border-blue-100' : 'border-gray-100'
                        }`}
                      >
                        <button
                          onClick={() => toggleSubTaskStatus(st)}
                          className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                            st.status === 'done'
                              ? 'bg-green-500 border-green-500'
                              : st.status === 'in_progress'
                              ? 'bg-blue-400 border-blue-400'
                              : 'border-gray-300 hover:border-indigo-400'
                          }`}
                        >
                          {st.status === 'done' && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                              <path d="M1.5 5l3 3 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {st.status === 'in_progress' && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs ${st.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {st.title}
                          </span>
                          {st.due_date && (
                            <div className={`text-[10px] mt-0.5 ${
                              st.status !== 'done' && st.due_date < today
                                ? 'text-red-500 font-medium'
                                : 'text-gray-400'
                            }`}>
                              {new Date(String(st.due_date).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </div>
                          )}
                        </div>
                        {st.priority && st.priority !== 'low' && (
                          <span className={`text-[10px] font-bold flex-shrink-0 ${PRIORITY_COLOR[st.priority] || ''}`}>
                            {st.priority === 'high' ? '↑' : '→'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// SectorTaskView principal
// ────────────────────────────────────────────────────────────
interface FocusSubTask {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  phase: string | null;
  parent_title: string | null;
}

export const SectorTaskView = ({ workstream }: { workstream: string }) => {
  const meta = SECTOR_META[workstream] || SECTOR_META.geral;
  const Icon = meta.icon;
  const [stats, setStats] = useState<SectorStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [parentTasks, setParentTasks] = useState<ParentTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [focusTasks, setFocusTasks] = useState<FocusSubTask[]>([]);
  const [currentPhaseName, setCurrentPhaseName] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [activeProjects, setActiveProjects] = useState<{ id: string; name: string }[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];
  const phases = getPhasesForWorkstream(workstream);

  const loadData = async () => {
    try {
      // Tarefas pai (sem parent_task_id) do setor, com nome do projeto
      const { data: parents } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, project_id, projects(name)')
        .eq('workstream', workstream)
        .is('parent_task_id', null)
        .order('due_date', { ascending: true, nullsFirst: false });

      const mapped: ParentTask[] = (parents || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        project_id: t.project_id,
        project_name: t.projects?.name || null,
      }));

      // Buscar contagem de sub-tarefas em lote (1 query para todos os pais)
      if (mapped.length > 0) {
        const parentIds = mapped.map(t => t.id);
        const { data: subCounts } = await supabase
          .from('tasks')
          .select('parent_task_id, status')
          .in('parent_task_id', parentIds);

        if (subCounts && subCounts.length > 0) {
          const countMap: Record<string, { total: number; done: number }> = {};
          subCounts.forEach((s: any) => {
            if (!countMap[s.parent_task_id]) countMap[s.parent_task_id] = { total: 0, done: 0 };
            countMap[s.parent_task_id].total++;
            if (s.status === 'done') countMap[s.parent_task_id].done++;
          });
          mapped.forEach(t => {
            if (countMap[t.id]) {
              t.subTotal = countMap[t.id].total;
              t.subDone = countMap[t.id].done;
            }
          });
        }
      }

      setParentTasks(mapped);

      // Carregar projetos ativos para o seletor do quick-add
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'active')
        .order('name');
      const projectList = (projects || []) as { id: string; name: string }[];
      setActiveProjects(projectList);

      // Auto-selecionar projeto: se o setor já tem tarefas de um único projeto → pre-selecionar
      const projectIds = [...new Set(mapped.filter(t => t.project_id).map(t => t.project_id!))];
      if (projectIds.length === 1) {
        setNewTaskProjectId(prev => prev || projectIds[0]);
      } else if (projectList.length === 1) {
        setNewTaskProjectId(prev => prev || projectList[0].id);
      }

      // Modo Foco: sub-tarefas pendentes do setor, ordenadas por prazo
      // Query separada e lightweight (limit 6) para identificar fase atual + próximas ações
      const { data: subRaw } = await supabase
        .from('tasks')
        .select('id, title, status, due_date, phase, parent_task_id, tasks!tasks_parent_task_id_fkey(title)')
        .eq('workstream', workstream)
        .not('status', 'eq', 'done')
        .not('parent_task_id', 'is', null)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(6);

      if (subRaw && subRaw.length > 0) {
        // Identificar fase atual: fase com menor ordem que tenha pendências
        const phaseOrder = phases.map(p => p.id);
        const phaseGroups: Record<string, typeof subRaw> = {};
        subRaw.forEach(t => {
          const key = t.phase || 'sem_fase';
          if (!phaseGroups[key]) phaseGroups[key] = [];
          phaseGroups[key].push(t);
        });
        // Fase atual = primeiro grupo na ordem do template
        const sortedPhaseKeys = Object.keys(phaseGroups).sort((a, b) => {
          const ia = phaseOrder.indexOf(a);
          const ib = phaseOrder.indexOf(b);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        });
        const currentPhaseKey = sortedPhaseKeys[0];
        const phaseTasksForFocus = (phaseGroups[currentPhaseKey] || []).slice(0, 3);
        const phaseMeta = phases.find(p => p.id === currentPhaseKey);
        setCurrentPhaseName(phaseMeta?.label || currentPhaseKey.replace(/_/g, ' '));
        setFocusTasks(phaseTasksForFocus.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          due_date: t.due_date,
          phase: t.phase,
          parent_title: (t.tasks as any)?.title || null,
        })));
      } else {
        setFocusTasks([]);
        setCurrentPhaseName(null);
      }

      // Stats: todas as tarefas do setor (pai + sub)
      const { data: allTasks } = await supabase
        .from('tasks')
        .select('id, status, due_date, project_id, projects(name)')
        .eq('workstream', workstream)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (allTasks) {
        const s: SectorStats = {
          total: allTasks.length,
          todo: allTasks.filter(t => t.status === 'todo').length,
          in_progress: allTasks.filter(t => t.status === 'in_progress').length,
          done: allTasks.filter(t => t.status === 'done').length,
          overdue: allTasks.filter(t =>
            t.status !== 'done' && t.due_date && t.due_date < today
          ).length,
          nextStep: null,
        };
        const pending = (parents || []).filter((t: any) => t.status !== 'done');
        if (pending.length > 0) {
          const next = pending[0] as any;
          s.nextStep = {
            title: next.title,
            project: next.projects?.name || 'Sem projeto',
            due_date: next.due_date,
          };
        }
        setStats(s);
      }
    } catch (e) {
      console.error('[SectorTaskView] erro ao carregar dados:', e);
    } finally {
      setStatsLoading(false);
      setTasksLoading(false);
    }
  };

  const addTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) { toast.error('Informe o título da tarefa'); return; }
    // Projeto é obrigatório — regra: artista → projeto → tarefa
    if (!newTaskProjectId) {
      toast.error('Selecione um projeto antes de criar a tarefa');
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from('tasks').insert({
        title,
        status: 'todo',
        workstream,
        project_id: newTaskProjectId,
        due_date: newTaskDue || null,
        priority: 'medium',
      });
      if (error) throw error;
      setNewTaskTitle('');
      setNewTaskDue('');
      setShowAddForm(false);
      await loadData();
      window.dispatchEvent(new CustomEvent('taskmaster:task-updated'));
      toast.success('Tarefa criada!');
    } catch (e) {
      console.error('[SectorTaskView] erro ao criar tarefa:', e);
      toast.error('Erro ao criar tarefa');
    } finally {
      setAdding(false);
    }
  };

  // P3: marcar sub-tarefa do Modo Foco como concluída diretamente
  const toggleFocusTask = async (ft: FocusSubTask) => {
    const next = ft.status === 'done' ? 'todo' : ft.status === 'todo' ? 'in_progress' : 'done';
    await supabase.from('tasks').update({ status: next }).eq('id', ft.id);
    setFocusTasks(prev => prev.map(t => t.id === ft.id ? { ...t, status: next } : t));
    window.dispatchEvent(new CustomEvent('taskmaster:task-updated'));
    // Recarregar para atualizar stats e verificar mudança de fase
    await loadData();
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener('taskmaster:task-updated', handler);
    return () => window.removeEventListener('taskmaster:task-updated', handler);
  }, [workstream]);

  const progress = stats && stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  const visibleTasks = selectedProjectId
    ? parentTasks.filter(t => t.project_id === selectedProjectId)
    : parentTasks;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden">

      {/* Header + Stats Panel */}
      <div className="bg-white border-b border-gray-100 flex-shrink-0">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Icon className={`w-5 h-5 ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{meta.label}</h1>
            <p className="text-sm text-gray-500 truncate">{meta.description}</p>
          </div>
          {stats && stats.total > 0 && (
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-gray-900">{progress}%</div>
              <div className="text-xs text-gray-400">concluído</div>
            </div>
          )}
        </div>

        {/* Barra de progresso */}
        {stats && stats.total > 0 && (
          <div className="px-6 pb-1">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="px-6 py-3">
          {statsLoading ? (
            <div className="flex gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex-1 h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats && stats.total > 0 ? (
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                <div className="text-lg font-bold text-gray-700">{stats.todo}</div>
                <div className="text-[10px] text-gray-400 font-medium uppercase">Pendente</div>
              </div>
              <div className="flex-1 bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
                <div className="text-lg font-bold text-blue-600">{stats.in_progress}</div>
                <div className="text-[10px] text-blue-400 font-medium uppercase">Em andamento</div>
              </div>
              <div className="flex-1 bg-green-50 rounded-xl p-2.5 text-center border border-green-100">
                <div className="text-lg font-bold text-green-600">{stats.done}</div>
                <div className="text-[10px] text-green-400 font-medium uppercase">Concluído</div>
              </div>
              {stats.overdue > 0 && (
                <div className="flex-1 bg-red-50 rounded-xl p-2.5 text-center border border-red-100">
                  <div className="text-lg font-bold text-red-600">{stats.overdue}</div>
                  <div className="text-[10px] text-red-400 font-medium uppercase">Atrasado</div>
                </div>
              )}
            </div>
          ) : !statsLoading && (
            <p className="text-sm text-gray-400 text-center py-2">Nenhuma tarefa neste setor ainda.</p>
          )}
        </div>

        {/* Filtro por projeto */}
        {activeProjects.length > 1 && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 text-gray-600"
            >
              <option value="">Todos os projetos</option>
              {activeProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedProjectId && (
              <button
                onClick={() => setSelectedProjectId('')}
                className="text-gray-400 hover:text-gray-600 p-1 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Modo Foco — bloco fixo de próximas ações */}
        {focusTasks.length > 0 && (
          <div className="mx-4 mb-4 bg-indigo-50 border border-indigo-200 rounded-xl overflow-hidden">
            {/* Header do Modo Foco */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-indigo-100">
              <span className="text-sm">🎯</span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Próximas ações</span>
                {currentPhaseName && (
                  <span className="ml-2 text-[10px] text-indigo-400">· Fase atual: {currentPhaseName}</span>
                )}
              </div>
            </div>
            {/* Lista de ações */}
            <div className="divide-y divide-indigo-100">
              {focusTasks.map(ft => {
                const isOverdueFt = ft.status !== 'done' && ft.due_date && ft.due_date < today;
                return (
                  <div key={ft.id} className="flex items-center gap-3 px-4 py-2.5">
                    {/* Checkbox — P3: marcar diretamente */}
                    <button
                      onClick={() => toggleFocusTask(ft)}
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                        ft.status === 'done'
                          ? 'bg-green-500 border-green-500'
                          : ft.status === 'in_progress'
                          ? 'bg-blue-400 border-blue-400'
                          : 'border-indigo-300 hover:border-indigo-500 bg-white'
                      }`}
                    >
                      {ft.status === 'done' && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                          <path d="M1.5 5l3 3 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {ft.status === 'in_progress' && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </button>
                    {/* Título + contexto */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm ${ft.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
                        {ft.title}
                      </span>
                      {ft.parent_title && (
                        <div className="text-[10px] text-indigo-400 truncate mt-0.5">{ft.parent_title}</div>
                      )}
                    </div>
                    {/* Prazo */}
                    {ft.due_date && (
                      <span className={`text-[10px] font-medium flex-shrink-0 ${isOverdueFt ? 'text-red-600' : 'text-gray-400'}`}>
                        {isOverdueFt ? '⚠ ' : ''}{new Date(String(ft.due_date).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Fallback: Próximo passo (pai) quando não há sub-tarefas geradas */}
        {focusTasks.length === 0 && stats?.nextStep && (
          <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-[10px] font-bold">→</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Próximo passo</div>
              <div className="text-sm font-semibold text-gray-800 truncate">{stats.nextStep.title}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span className="truncate">{stats.nextStep.project}</span>
                {stats.nextStep.due_date && (
                  <>
                    <span>·</span>
                    <span className={stats.nextStep.due_date < today ? 'text-red-600 font-medium' : 'text-gray-400'}>
                      {stats.nextStep.due_date < today ? '⚠ ' : ''}{new Date(String(stats.nextStep.due_date).slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de tarefas pai com expand/collapse */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {tasksLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : parentTasks.length === 0 && !showAddForm ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Icon className={`w-6 h-6 ${meta.color} opacity-50`} />
            </div>
            <p className="text-sm font-medium text-gray-500">Nenhuma tarefa neste setor</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">
              Crie um projeto pelo Copilot ou adicione uma tarefa manualmente.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 px-4 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nova tarefa
            </button>
          </div>
        ) : (
          <>
            {visibleTasks.length === 0 && selectedProjectId ? (
              <div className="flex flex-col items-center justify-center h-32 text-center text-sm text-gray-400">
                <Filter className="w-5 h-5 mb-2 opacity-40" />
                Nenhuma tarefa neste setor para o projeto selecionado.
                <button onClick={() => setSelectedProjectId('')} className="mt-2 text-indigo-500 hover:underline text-xs">Limpar filtro</button>
              </div>
            ) : null}
            {visibleTasks.map(task => (
              <ParentTaskCard
                key={task.id}
                task={task}
                workstream={workstream}
                today={today}
                onStatusChange={loadData}
              />
            ))}

            {/* Formulário inline de nova tarefa */}
            {showAddForm ? (
              <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-4 space-y-3">
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Nova tarefa — {meta.label}</div>

                {/* Título */}
                <input
                  type="text"
                  placeholder="Título da tarefa…"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  autoFocus
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
                />

                {/* Projeto — obrigatório */}
                {activeProjects.length === 0 ? (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      Nenhum projeto ativo. Crie um projeto pelo Copilot antes de adicionar tarefas.
                    </p>
                  </div>
                ) : (
                  <select
                    value={newTaskProjectId}
                    onChange={e => setNewTaskProjectId(e.target.value)}
                    className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 bg-white ${
                      !newTaskProjectId
                        ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-200 text-gray-400'
                        : 'border-gray-200 focus:border-indigo-400 focus:ring-indigo-200 text-gray-700'
                    }`}
                  >
                    <option value="">Selecione o projeto *</option>
                    {activeProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}

                {/* Prazo + botões */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={newTaskDue}
                    onChange={e => setNewTaskDue(e.target.value)}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 text-gray-600"
                  />
                  <button
                    onClick={addTask}
                    disabled={adding || !newTaskTitle.trim() || !newTaskProjectId || activeProjects.length === 0}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    {adding ? 'Salvando…' : 'Criar'}
                  </button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewTaskTitle(''); setNewTaskDue(''); }}
                    className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 py-3 rounded-xl border border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-4 h-4" /> Nova tarefa
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// WhatsApp Manager - Gerenciamento de contatos e comunicação
// ============================================================
export const WhatsAppManager = (_props?: any) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', group: '' });
  const [showForm, setShowForm] = useState(false);
  const [groups] = useState(['Equipe', 'Artistas', 'Fornecedores', 'Parceiros', 'Imprensa']);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data } = await supabase.from('whatsapp_contacts').select('*').order('name');
      setContacts(data || []);
    } catch { /* fallback to empty */ }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    try {
      const { error } = await supabase.from('whatsapp_contacts').insert({
        name: newContact.name,
        phone: newContact.phone,
        group_name: newContact.group || 'Geral'
      });
      if (error) throw error;
      toast.success('Contato adicionado!');
      setNewContact({ name: '', phone: '', group: '' });
      setShowForm(false);
      loadContacts();
    } catch (err) {
      // Fallback: salvar localmente
      const local = JSON.parse(localStorage.getItem('tm_whatsapp_contacts') || '[]');
      local.push({ ...newContact, id: Date.now(), group_name: newContact.group || 'Geral' });
      localStorage.setItem('tm_whatsapp_contacts', JSON.stringify(local));
      setContacts(local);
      toast.success('Contato salvo localmente');
      setNewContact({ name: '', phone: '', group: '' });
      setShowForm(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-green-600" />
              WhatsApp Business
            </h2>
            <p className="text-gray-600 mt-1">Gerencie seus contatos e comunicação via WhatsApp</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus className="w-4 h-4" /> Novo Contato
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Adicionar Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} placeholder="Nome" className="px-4 py-2 border rounded-lg" />
              <input value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} placeholder="+55 11 99999-9999" className="px-4 py-2 border rounded-lg" />
              <select value={newContact.group} onChange={e => setNewContact({...newContact, group: e.target.value})} className="px-4 py-2 border rounded-lg">
                <option value="">Selecione grupo</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={addContact} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <div key={group} className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" /> {group}
              </h3>
              <div className="space-y-2">
                {contacts.filter(c => (c.group_name || 'Geral') === group).map(contact => (
                  <div key={contact.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.phone}</p>
                    </div>
                    <button onClick={() => openWhatsApp(contact.phone)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Abrir WhatsApp">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {contacts.filter(c => (c.group_name || 'Geral') === group).length === 0 && (
                  <p className="text-sm text-gray-400 py-2">Nenhum contato</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Google Integration - Integração com Google Calendar e Drive
// ============================================================
export const GoogleIntegration = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_google_events') || '[]');
    setEvents(stored);
  }, []);

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Preencha título e data');
      return;
    }
    const event = { ...newEvent, id: Date.now(), synced: false };
    const updated = [...events, event];
    setEvents(updated);
    localStorage.setItem('tm_google_events', JSON.stringify(updated));
    setNewEvent({ title: '', date: '', time: '', description: '' });
    setShowForm(false);
    toast.success('Evento adicionado ao calendário!');
  };

  const removeEvent = (id: number) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem('tm_google_events', JSON.stringify(updated));
    toast.success('Evento removido');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Integração Google
            </h2>
            <p className="text-gray-600 mt-1">Gerencie eventos e sincronize com Google Calendar</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Novo Evento
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Sincronização com Google Calendar será ativada em breve. Por enquanto, gerencie seus eventos aqui.
          </p>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Novo Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Título do evento" className="px-4 py-2 border rounded-lg" />
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Descrição" className="px-4 py-2 border rounded-lg" />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={addEvent} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {events.sort((a, b) => a.date.localeCompare(b.date)).map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">{new Date(event.date + 'T00:00').toLocaleDateString('pt-BR')} {event.time && `às ${event.time}`}</p>
                  {event.description && <p className="text-xs text-gray-400 mt-1">{event.description}</p>}
                </div>
              </div>
              <button onClick={() => removeEvent(event.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm">Remover</button>
            </div>
          ))}
          {events.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum evento cadastrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Meetings Manager - Gerenciamento de Reuniões
// ============================================================
export const MeetingsManager = (_props?: any) => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', participants: '', notes: '', status: 'agendada' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_meetings') || '[]');
    setMeetings(stored);
  }, []);

  const saveMeetings = (updated: any[]) => {
    setMeetings(updated);
    localStorage.setItem('tm_meetings', JSON.stringify(updated));
  };

  const addMeeting = () => {
    if (!newMeeting.title || !newMeeting.date) {
      toast.error('Preencha título e data');
      return;
    }
    const meeting = { ...newMeeting, id: Date.now() };
    saveMeetings([...meetings, meeting]);
    setNewMeeting({ title: '', date: '', time: '', participants: '', notes: '', status: 'agendada' });
    setShowForm(false);
    toast.success('Reunião agendada!');
  };

  const toggleStatus = (id: number) => {
    const updated = meetings.map(m => m.id === id ? { ...m, status: m.status === 'agendada' ? 'realizada' : 'agendada' } : m);
    saveMeetings(updated);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              Reuniões
            </h2>
            <p className="text-gray-600 mt-1">Agende e acompanhe suas reuniões</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Nova Reunião
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Agendar Reunião</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} placeholder="Título da reunião" className="px-4 py-2 border rounded-lg" />
              <input type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input value={newMeeting.participants} onChange={e => setNewMeeting({...newMeeting, participants: e.target.value})} placeholder="Participantes (separados por vírgula)" className="px-4 py-2 border rounded-lg" />
            </div>
            <textarea value={newMeeting.notes} onChange={e => setNewMeeting({...newMeeting, notes: e.target.value})} placeholder="Pauta / Notas" rows={3} className="w-full px-4 py-2 border rounded-lg mt-4" />
            <div className="mt-4 flex gap-2">
              <button onClick={addMeeting} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Agendar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.sort((a, b) => a.date.localeCompare(b.date)).map(meeting => (
            <div key={meeting.id} className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${meeting.status === 'realizada' ? 'border-green-500' : 'border-purple-500'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(meeting.date + 'T00:00').toLocaleDateString('pt-BR')} {meeting.time && `às ${meeting.time}`}
                  </p>
                  {meeting.participants && <p className="text-xs text-gray-400 mt-1">👥 {meeting.participants}</p>}
                  {meeting.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{meeting.notes}</p>}
                </div>
                <button onClick={() => toggleStatus(meeting.id)} className={`px-3 py-1 rounded-full text-xs font-medium ${meeting.status === 'realizada' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                  {meeting.status === 'realizada' ? '✓ Realizada' : '◉ Agendada'}
                </button>
              </div>
            </div>
          ))}
          {meetings.length === 0 && (
            <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma reunião agendada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Marketing Manager - Assistente de Marketing com IA
// ============================================================
export const MarketingManager = (_props?: any) => {
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const { data, error } = await supabase.from('artists').select('*').order('name');
        if (error) throw error;
        setArtists(data || []);
        // Não pre-selecionar artista: usuário escolhe explicitamente
      } catch (error) {
        console.error('Erro ao carregar artistas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadArtists();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-pink-600" />
              Marketing & Estratégia
            </h2>
            <p className="text-gray-600 mt-1">Gere conteúdos e roteiros criativos com auxílio de IA.</p>
          </div>
          {artists.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase ml-2">Artista:</span>
              <select
                value={selectedArtist?.id || ''}
                onChange={(e) => setSelectedArtist(artists.find(a => a.id === e.target.value) || null)}
                className="bg-transparent text-sm font-bold text-gray-900 focus:outline-none pr-8"
              >
                <option value="">Selecione o artista</option>
                {artists.map(artist => (<option key={artist.id} value={artist.id}>{artist.name}</option>))}
              </select>
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-pink-600" /></div>
        ) : !selectedArtist ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {artists.length === 0 ? 'Nenhum artista cadastrado' : 'Selecione um artista'}
            </h3>
            <p className="text-gray-600">
              {artists.length === 0
                ? 'Cadastre um artista para usar o assistente de marketing.'
                : 'Escolha o artista no seletor acima para gerar conteúdo de marketing.'}
            </p>
          </div>
        ) : (
          <AIMarketingAssistant artistName={selectedArtist.name} genre={selectedArtist.genre || 'Pop'} />
        )}
      </div>
    </div>
  );
};

// ============================================================
// Production Manager - Gerenciamento de Produção de Conteúdo
// ============================================================
export const ProductionManager = (_props?: any) => {
  const [productions, setProductions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newProd, setNewProd] = useState({ title: '', type: 'video', status: 'planejado', deadline: '', responsible: '', notes: '' });
  const types = [{ value: 'video', label: 'Vídeo' }, { value: 'audio', label: 'Áudio' }, { value: 'foto', label: 'Foto' }, { value: 'live', label: 'Live' }, { value: 'podcast', label: 'Podcast' }];
  const statuses = [{ value: 'planejado', label: 'Planejado', color: 'bg-blue-100 text-blue-700' }, { value: 'em_producao', label: 'Em Produção', color: 'bg-yellow-100 text-yellow-700' }, { value: 'revisao', label: 'Em Revisão', color: 'bg-purple-100 text-purple-700' }, { value: 'concluido', label: 'Concluído', color: 'bg-green-100 text-green-700' }];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_productions') || '[]');
    setProductions(stored);
  }, []);

  const save = (updated: any[]) => { setProductions(updated); localStorage.setItem('tm_productions', JSON.stringify(updated)); };

  const addProduction = () => {
    if (!newProd.title) { toast.error('Preencha o título'); return; }
    save([...productions, { ...newProd, id: Date.now() }]);
    setNewProd({ title: '', type: 'video', status: 'planejado', deadline: '', responsible: '', notes: '' });
    setShowForm(false);
    toast.success('Produção adicionada!');
  };

  const updateStatus = (id: number, status: string) => {
    save(productions.map(p => p.id === id ? { ...p, status } : p));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Video className="w-8 h-8 text-red-600" /> Produção de Conteúdo</h2>
            <p className="text-gray-600 mt-1">Gerencie a produção de vídeos, áudios e fotos</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Plus className="w-4 h-4" /> Nova Produção</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newProd.title} onChange={e => setNewProd({...newProd, title: e.target.value})} placeholder="Título da produção" className="px-4 py-2 border rounded-lg" />
              <select value={newProd.type} onChange={e => setNewProd({...newProd, type: e.target.value})} className="px-4 py-2 border rounded-lg">
                {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="date" value={newProd.deadline} onChange={e => setNewProd({...newProd, deadline: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input value={newProd.responsible} onChange={e => setNewProd({...newProd, responsible: e.target.value})} placeholder="Responsável" className="px-4 py-2 border rounded-lg" />
            </div>
            <textarea value={newProd.notes} onChange={e => setNewProd({...newProd, notes: e.target.value})} placeholder="Notas" rows={2} className="w-full px-4 py-2 border rounded-lg mt-4" />
            <div className="mt-4 flex gap-2">
              <button onClick={addProduction} className="px-4 py-2 bg-red-600 text-white rounded-lg">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statuses.map(s => (
            <div key={s.value} className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{productions.filter(p => p.status === s.value).length}</p>
              <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block mt-1 ${s.color}`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {productions.map(prod => (
            <div key={prod.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  {prod.type === 'video' ? <Video className="w-5 h-5 text-red-600" /> : <Music className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{prod.title}</p>
                  <p className="text-xs text-gray-500">{types.find(t => t.value === prod.type)?.label} {prod.deadline && `• Prazo: ${new Date(prod.deadline + 'T00:00').toLocaleDateString('pt-BR')}`} {prod.responsible && `• ${prod.responsible}`}</p>
                </div>
              </div>
              <select value={prod.status} onChange={e => updateStatus(prod.id, e.target.value)} className={`text-xs font-medium px-3 py-1 rounded-full border-0 ${statuses.find(s => s.value === prod.status)?.color}`}>
                {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          ))}
          {productions.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma produção cadastrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Pre-Production Manager
// ============================================================
export const PreProductionManager = (_props?: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', category: 'roteiro', status: 'pendente', notes: '' });
  const categories = ['roteiro', 'storyboard', 'locação', 'equipamento', 'elenco', 'orçamento'];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_preproduction') || '[]');
    setItems(stored);
  }, []);

  const save = (updated: any[]) => { setItems(updated); localStorage.setItem('tm_preproduction', JSON.stringify(updated)); };

  const addItem = () => {
    if (!newItem.title) { toast.error('Preencha o título'); return; }
    save([...items, { ...newItem, id: Date.now() }]);
    setNewItem({ title: '', category: 'roteiro', status: 'pendente', notes: '' });
    setShowForm(false);
    toast.success('Item adicionado!');
  };

  const toggleStatus = (id: number) => {
    save(items.map(i => i.id === id ? { ...i, status: i.status === 'pendente' ? 'concluido' : 'pendente' } : i));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Music className="w-8 h-8 text-orange-600" /> Pré-Produção</h2>
            <p className="text-gray-600 mt-1">Planejamento e preparação de projetos</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"><Plus className="w-4 h-4" /> Novo Item</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="Título" className="px-4 py-2 border rounded-lg" />
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="px-4 py-2 border rounded-lg">
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <textarea value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} placeholder="Notas" rows={2} className="w-full px-4 py-2 border rounded-lg mt-4" />
            <div className="mt-4 flex gap-2">
              <button onClick={addItem} className="px-4 py-2 bg-orange-600 text-white rounded-lg">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${item.status === 'concluido' ? 'opacity-60' : ''}`} onClick={() => toggleStatus(item.id)}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.status === 'concluido' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                {item.status === 'concluido' && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${item.status === 'concluido' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.title}</p>
                <p className="text-xs text-gray-500">{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
              <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum item de pré-produção</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// AI Insights - Análises e Insights com IA
// ============================================================
export const AIInsights = (_props?: any) => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('geral');

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é um consultor de negócios musicais. Gere 5 insights práticos e acionáveis em português brasileiro. Retorne apenas os insights, um por linha, numerados.' },
            { role: 'user', content: `Gere 5 insights sobre ${topic === 'geral' ? 'gestão de carreira musical' : topic} para um artista/produtor musical independente.` }
          ]
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      setInsights(text.split('\n').filter((l: string) => l.trim()));
    } catch {
      toast.error('Erro ao gerar insights. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2"><TrendingUp className="w-8 h-8 text-cyan-600" /> Insights com IA</h2>
        <p className="text-gray-600 mb-6">Análises e recomendações geradas por inteligência artificial</p>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <select value={topic} onChange={e => setTopic(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg">
              <option value="geral">Gestão de Carreira</option>
              <option value="marketing digital para músicos">Marketing Digital</option>
              <option value="monetização e receita para artistas">Monetização</option>
              <option value="produção musical e lançamentos">Produção Musical</option>
              <option value="shows e turnês">Shows e Turnês</option>
              <option value="redes sociais para artistas">Redes Sociais</option>
            </select>
            <button onClick={generateInsights} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              {loading ? 'Gerando...' : 'Gerar Insights'}
            </button>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-cyan-600" />
                </div>
                <p className="text-gray-800">{insight}</p>
              </div>
            ))}
          </div>
        )}

        {insights.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Clique em "Gerar Insights" para receber recomendações personalizadas</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Mind Map - Mapa Mental de Ideias
// ============================================================
export const MindMap = (_props?: any) => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newNode, setNewNode] = useState({ title: '', parent: '', color: '#FFAD85' });
  const colors = ['#FFAD85', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_mindmap') || '[]');
    setNodes(stored);
  }, []);

  const save = (updated: any[]) => { setNodes(updated); localStorage.setItem('tm_mindmap', JSON.stringify(updated)); };

  const addNode = () => {
    if (!newNode.title) { toast.error('Preencha o título'); return; }
    save([...nodes, { ...newNode, id: Date.now() }]);
    setNewNode({ title: '', parent: '', color: '#FFAD85' });
    setShowForm(false);
    toast.success('Ideia adicionada!');
  };

  const removeNode = (id: number) => {
    save(nodes.filter(n => n.id !== id));
  };

  const rootNodes = nodes.filter(n => !n.parent);
  const getChildren = (parentTitle: string) => nodes.filter(n => n.parent === parentTitle);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Map className="w-8 h-8 text-purple-600" /> Mapa Mental</h2>
            <p className="text-gray-600 mt-1">Organize suas ideias e conexões de projetos</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="w-4 h-4" /> Nova Ideia</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={newNode.title} onChange={e => setNewNode({...newNode, title: e.target.value})} placeholder="Título da ideia" className="px-4 py-2 border rounded-lg" />
              <select value={newNode.parent} onChange={e => setNewNode({...newNode, parent: e.target.value})} className="px-4 py-2 border rounded-lg">
                <option value="">Ideia principal (raiz)</option>
                {nodes.map(n => <option key={n.id} value={n.title}>{n.title}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Cor:</span>
                {colors.map(c => (
                  <button key={c} onClick={() => setNewNode({...newNode, color: c})} className={`w-6 h-6 rounded-full ${newNode.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={addNode} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Adicionar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-6 justify-center">
          {rootNodes.map(node => (
            <div key={node.id} className="relative">
              <div className="bg-white rounded-2xl shadow-md p-5 min-w-[200px] text-center border-t-4" style={{ borderColor: node.color }}>
                <p className="font-bold text-gray-900">{node.title}</p>
                <button onClick={() => removeNode(node.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">×</button>
              </div>
              {getChildren(node.title).length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4 pl-4">
                  {getChildren(node.title).map(child => (
                    <div key={child.id} className="relative bg-white rounded-xl shadow-sm p-3 min-w-[150px] text-center border-l-4" style={{ borderColor: child.color }}>
                      <p className="text-sm text-gray-800">{child.title}</p>
                      <button onClick={() => removeNode(child.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {nodes.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center w-full">
              <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Adicione ideias para começar seu mapa mental</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// User Management - Gerenciamento de Usuários com InviteManager
// ============================================================
export const UserManagement = (_props?: any) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#FFAD85]" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-600 mt-1">Controle quem tem acesso à sua plataforma e gerencie convites.</p>
        </div>
        <InviteManager />
      </div>
    </div>
  );
};

// ============================================================
// User Preferences - Configurações do Usuário
// ============================================================
export const UserPreferences = () => {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [generalPrefs, setGeneralPrefs] = React.useState({
    language: 'pt',
    currency: 'BRL',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [notifPrefs, setNotifPrefs] = React.useState({
    email_tasks: true,
    email_shows: true,
    email_releases: true,
    email_financial: true,
    email_team_invites: true,
    email_weekly_summary: true,
    push_tasks: false,
    push_shows: false,
    push_releases: false,
    whatsapp_enabled: false,
    whatsapp_number: '',
  });

  React.useEffect(() => {
    loadPrefs();
  }, []);

  async function loadPrefs() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Load general prefs from localStorage
      const stored = JSON.parse(localStorage.getItem('tm_preferences') || 'null');
      if (stored) {
        setGeneralPrefs(p => ({ ...p, ...stored }));
      }

      // Load notification prefs from Supabase
      const { data } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setNotifPrefs({
          email_tasks: data.email_tasks ?? true,
          email_shows: data.email_shows ?? true,
          email_releases: data.email_releases ?? true,
          email_financial: data.email_financial ?? true,
          email_team_invites: data.email_team_invites ?? true,
          email_weekly_summary: data.email_weekly_summary ?? true,
          push_tasks: data.push_tasks ?? false,
          push_shows: data.push_shows ?? false,
          push_releases: data.push_releases ?? false,
          whatsapp_enabled: data.whatsapp_enabled ?? false,
          whatsapp_number: data.whatsapp_number ?? '',
        });
      }
    } catch (e) {
      console.error('Erro ao carregar preferências:', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveNotifPrefs(updated: typeof notifPrefs) {
    setNotifPrefs(updated);
    if (!userId) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({ user_id: userId, ...updated }, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Preferências de notificação salvas!');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  function saveGeneralPrefs(updated: typeof generalPrefs) {
    setGeneralPrefs(updated);
    localStorage.setItem('tm_preferences', JSON.stringify(updated));
    toast.success('Preferências salvas!');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFAD85] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-gray-600" /> Preferências
        </h2>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Geral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                <select
                  value={generalPrefs.language}
                  onChange={e => saveGeneralPrefs({ ...generalPrefs, language: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moeda</label>
                <select
                  value={generalPrefs.currency}
                  onChange={e => saveGeneralPrefs({ ...generalPrefs, currency: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar (US$)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Notificações por Email</h3>
              {saving && <Loader2 className="w-4 h-4 text-[#FFAD85] animate-spin" />}
            </div>
            <div className="space-y-3">
              {[
                { key: 'email_tasks', label: 'Tarefas (atribuição, prazo)' },
                { key: 'email_shows', label: 'Shows (novo, confirmado)' },
                { key: 'email_releases', label: 'Releases (atualização de status)' },
                { key: 'email_financial', label: 'Financeiro (pagamentos, vencimentos)' },
                { key: 'email_team_invites', label: 'Convites de equipe' },
                { key: 'email_weekly_summary', label: 'Resumo semanal' },
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 text-sm">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(notifPrefs as any)[item.key]}
                    onChange={e => saveNotifPrefs({ ...notifPrefs, [item.key]: e.target.checked })}
                    className="w-5 h-5 accent-[#FF9B6A] rounded cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">WhatsApp</h3>
            <label className="flex items-center justify-between py-2 mb-3">
              <span className="text-gray-700 text-sm">Ativar notificações via WhatsApp</span>
              <input
                type="checkbox"
                checked={notifPrefs.whatsapp_enabled}
                onChange={e => saveNotifPrefs({ ...notifPrefs, whatsapp_enabled: e.target.checked })}
                className="w-5 h-5 accent-[#FF9B6A] rounded cursor-pointer"
              />
            </label>
            {notifPrefs.whatsapp_enabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número WhatsApp</label>
                <input
                  type="tel"
                  value={notifPrefs.whatsapp_number}
                  onChange={e => setNotifPrefs(p => ({ ...p, whatsapp_number: e.target.value }))}
                  onBlur={() => saveNotifPrefs(notifPrefs)}
                  placeholder="+55 11 99999-9999"
                  className="w-full px-4 py-2 border rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Integração via n8n/Evolution API</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// User Role Features - Funcionalidades por Perfil
// ============================================================
export const UserRoleFeatures = () => {
  const plans = [
    { name: 'Starter', price: '$49/mês', features: ['5 projetos', '3 artistas', 'Tarefas ilimitadas', 'Copilot básico', 'Relatórios mensais', 'Suporte por email'], color: 'border-blue-500', bg: 'bg-blue-50' },
    { name: 'Pro', price: '$80/mês', features: ['20 projetos', '10 artistas', 'Tarefas ilimitadas', 'Copilot avançado', 'Marketing IA', 'Relatórios semanais', 'Suporte prioritário', '5 membros de equipe'], color: 'border-[#FFAD85]', bg: 'bg-orange-50', popular: true },
    { name: 'Professional', price: '$99/mês', features: ['Projetos ilimitados', 'Artistas ilimitados', 'Todas as funcionalidades', 'Copilot premium', 'Marketing IA avançado', 'Relatórios em tempo real', 'Suporte 24/7', 'Equipe ilimitada', 'Consultoria mensal'], color: 'border-purple-500', bg: 'bg-purple-50' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2"><Target className="w-8 h-8 text-[#FFAD85]" /> Planos e Funcionalidades</h2>
        <p className="text-gray-600 mb-8">Conheça os recursos disponíveis em cada plano</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.name} className={`bg-white rounded-xl shadow-sm p-6 border-t-4 ${plan.color} relative`}>
              {plan.popular && <span className="absolute -top-3 right-4 bg-[#FFAD85] text-white text-xs px-3 py-1 rounded-full font-semibold">Popular</span>}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Presentation - Modo de Apresentação
// ============================================================
export const Presentation = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6"><Eye className="w-8 h-8 text-orange-600" /> Modo Apresentação</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] p-12 text-center text-white">
            <h1 className="text-4xl font-bold mb-4">TaskMaster</h1>
            <p className="text-xl opacity-90">Plataforma Completa de Gestão Musical Profissional</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: <Zap className="w-6 h-6" />, title: 'Gestão Inteligente', desc: 'Gerencie projetos, artistas e shows com IA integrada' },
                { icon: <Target className="w-6 h-6" />, title: 'Marketing com IA', desc: 'Gere conteúdos e estratégias automaticamente' },
                { icon: <Users className="w-6 h-6" />, title: 'Equipe Colaborativa', desc: 'Trabalhe em equipe com controle de acesso' },
                { icon: <BarChart className="w-6 h-6" />, title: 'Relatórios Completos', desc: 'Acompanhe KPIs e métricas em tempo real' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-[#FFF0E6] rounded-lg flex items-center justify-center text-[#FFAD85]">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// About - Sobre o TaskMaster
// ============================================================
export const About = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6"><Info className="w-8 h-8 text-gray-600" /> Sobre o TaskMaster</h2>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">TaskMaster</h3>
            <p className="text-gray-600 mt-1">Versão 1.0.0</p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Sobre a Plataforma</h4>
              <p className="text-gray-600">O TaskMaster é uma plataforma completa de gestão musical profissional, desenvolvida com a metodologia dos 4 Pilares de Marcos Menezes. Combinamos tecnologia de ponta com inteligência artificial para ajudar artistas, produtores e escritórios a gerenciar suas carreiras de forma eficiente.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Metodologia 4 Pilares</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: 'Conteúdo', desc: 'Gestão de ativos, música e presença digital' },
                  { title: 'Shows & Vendas', desc: 'Estratégia de booking e comercialização' },
                  { title: 'Logística', desc: 'Operação de turnê, equipe e deslocamento' },
                  { title: 'Estratégia', desc: 'Posicionamento, marketing e carreira' }
                ].map(pillar => (
                  <div key={pillar.title} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900 text-sm">{pillar.title}</p>
                    <p className="text-xs text-gray-500">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contato</h4>
              <p className="text-gray-600 text-sm">Email: <a href="mailto:contact@taskmaster.works" className="text-[#FFAD85] hover:underline">contact@taskmaster.works</a></p>
              <p className="text-gray-600 text-sm">Website: <a href="https://taskmaster.works" className="text-[#FFAD85] hover:underline">taskmaster.works</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Schedule (kept as alias for CalendarView)
// ============================================================
export const Schedule = (_props?: any) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6"><Calendar className="w-8 h-8 text-[#FFAD85]" /> Agenda</h2>
        <p className="text-gray-600">Use o menu "Agenda" na sidebar para acessar o calendário completo.</p>
      </div>
    </div>
  );
};

// ============================================================
// Validators (kept for system use)
// ============================================================
export const FunctionalityValidator = () => (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-4"><Shield className="w-8 h-8 text-green-600" /> Validador de Funcionalidades</h2>
      <p className="text-gray-600">Ferramenta de validação de funcionalidades do sistema.</p>
    </div>
  </div>
);

export const SystemValidator = () => (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-4"><Settings className="w-8 h-8 text-red-600" /> Validador de Sistema</h2>
      <p className="text-gray-600">Ferramenta de validação de integridade do sistema.</p>
    </div>
  </div>
);

// ============================================================
// Form Components (kept as-is)
// ============================================================
export const ProjectForm = ({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
      <h3 className="text-xl font-bold mb-4">Novo Projeto</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          name: formData.get('name'),
          description: formData.get('description'),
          project_type: formData.get('project_type') || 'artist_management'
        });
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
            <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]">Criar</button>
        </div>
      </form>
    </div>
  );
};

export const ArtistForm = ({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
      <h3 className="text-xl font-bold mb-4">Novo Artista</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const genre = formData.get('genre') === 'Outro' ? formData.get('genreOther') : formData.get('genre');
        onSubmit({
          name: formData.get('name'),
          artistic_name: formData.get('artisticName'),
          genre: genre || 'Pop'
        });
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Artístico</label>
            <input name="artisticName" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gênero Musical</label>
            <select name="genre" className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => {
                const select = e.target;
                const otherInput = select.parentElement?.querySelector('[name="genreOther"]') as HTMLInputElement;
                if (otherInput) {
                  otherInput.style.display = select.value === 'Outro' ? 'block' : 'none';
                  if (select.value !== 'Outro') otherInput.value = '';
                }
              }}>
              <option value="">Selecione um gênero</option>
              <option>Pop</option><option>Rock</option><option>Hip Hop</option><option>MPB</option>
              <option>Sertanejo</option><option>Samba</option><option>Pagode</option><option>Funk</option>
              <option>Eletrônica</option><option>Jazz</option><option>Blues</option><option>Reggae</option>
              <option>Country</option><option>Gospel</option><option>Forró</option><option>Bossa Nova</option>
              <option>Rap</option><option>Trap</option><option>R&B</option><option>Soul</option>
              <option>Indie</option><option>Metal</option><option>Punk</option><option>Folk</option>
              <option>Clássica</option><option>Outro</option>
            </select>
            <input name="genreOther" type="text" placeholder="Especifique o gênero..." className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2" style={{ display: 'none' }} />
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]">Criar</button>
        </div>
      </form>
    </div>
  );
};
