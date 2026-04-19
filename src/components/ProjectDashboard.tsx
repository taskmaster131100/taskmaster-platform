import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  User, Calendar, DollarSign, BarChart2, Tag, Layers, Plus,
  Circle, AlertCircle, Loader2, FileText, Archive, Sparkles,
  Send, Bot, X, ChevronDown, ChevronUp, Music, Link2, Unlink,
  Share2, Printer, Edit2, Save, Target, Zap, ChevronRight
} from 'lucide-react';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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
  onArchive?: () => void;
}

interface AiMessage { role: 'user' | 'assistant'; content: string; }

const WORKSTREAMS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'conteudo',          label: 'Conteúdo',          color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  { id: 'marketing',         label: 'Marketing',          color: 'text-pink-700',   bg: 'bg-pink-50 border-pink-200' },
  { id: 'shows',             label: 'Shows',              color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  { id: 'logistica',         label: 'Logística',          color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { id: 'estrategia',        label: 'Estratégia',         color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  { id: 'financeiro',        label: 'Financeiro',         color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  { id: 'lancamento',        label: 'Lançamento',         color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  { id: 'producao_musical',  label: 'Produção Musical',   color: 'text-rose-700',   bg: 'bg-rose-50 border-rose-200' },
  { id: 'geral',             label: 'Geral',              color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
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
  onArchive,
}: ProjectDashboardProps) {
  const navigate = useNavigate();
  const [artist, setArtist] = useState<{ name: string; stage_name?: string } | null>(null);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([]);
  const [songs, setSongs] = useState<{ id: string; title: string; status: string }[]>([]);

  // ── AI Chat no projeto ────────────────────────────────────────────────────
  const AI_HISTORY_KEY = `tm_proj_ai_${project?.id || 'unknown'}`;
  const loadSavedAiMessages = (): AiMessage[] => {
    try {
      const raw = localStorage.getItem(AI_HISTORY_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as AiMessage[];
      return Array.isArray(parsed) ? parsed.slice(-40) : [];
    } catch { return []; }
  };
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>(loadSavedAiMessages);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; data: any } | null>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [linkSongOpen, setLinkSongOpen] = useState(false);
  const [artistWorks, setArtistWorks] = useState<{ id: string; title: string; status: string; project_id: string | null }[]>([]);
  const [linkingWork, setLinkingWork] = useState<string | null>(null);

  // ── Visão do Projeto ───────────────────────────────────────────────────────
  const [visionOpen, setVisionOpen] = useState(true);
  const [editingVision, setEditingVision] = useState(false);
  const [savingVision, setSavingVision] = useState(false);
  const [visionData, setVisionData] = useState({ objective: '', strategy: '', project_type: '' });

  useEffect(() => {
    setVisionData({
      objective: project?.objective || '',
      strategy: project?.strategy || '',
      project_type: project?.project_type || '',
    });
    if (project?.id) {
      trackEvent('project_opened', {
        project_id: project.id,
        project_status: project.status,
        has_tasks: (tasks?.length ?? 0) > 0,
      });
    }
  }, [project?.id]);

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

  // Carrega músicas vinculadas a este projeto (tabela works com project_id)
  useEffect(() => {
    if (!project?.id) { setSongs([]); return; }
    supabase
      .from('works')
      .select('id, title, status')
      .eq('project_id', project.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setSongs(data || []));
  }, [project?.id]);

  // Persistir histórico do chat IA no localStorage
  useEffect(() => {
    if (aiMessages.length === 0) return;
    try { localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(aiMessages.slice(-40))); } catch {}
  }, [aiMessages]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()
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

  // ── Vision save ───────────────────────────────────────────────────────────
  const handleSaveVision = async () => {
    if (!project?.id) return;
    setSavingVision(true);
    const { error } = await supabase
      .from('projects')
      .update({
        objective: visionData.objective || null,
        strategy: visionData.strategy || null,
        project_type: visionData.project_type || null,
      })
      .eq('id', project.id);
    setSavingVision(false);
    if (error) { toast.error('Erro ao salvar visão.'); return; }
    project.objective = visionData.objective;
    project.strategy = visionData.strategy;
    project.project_type = visionData.project_type;
    setEditingVision(false);
    toast.success('Visão do projeto salva!');
  };

  // ── Archive ───────────────────────────────────────────────────────────────
  const handleArchive = async () => {
    if (!window.confirm(`Arquivar o projeto "${project?.name}"? Ele não aparecerá mais na lista, mas os dados ficam salvos.`)) return;
    const { error } = await supabase.from('projects').update({ status: 'archived' }).eq('id', project.id);
    if (error) { toast.error('Erro ao arquivar projeto.'); return; }
    toast.success(`Projeto "${project.name}" arquivado.`);
    onArchive?.();
  };

  // ── AI Chat helpers ────────────────────────────────────────────────────────
  const buildAiContext = () => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date + 'T23:59:59') < new Date());
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    const byWs: Record<string, Task[]> = {};
    tasks.forEach(t => { const ws = t.workstream || 'geral'; if (!byWs[ws]) byWs[ws] = []; byWs[ws].push(t); });

    let ctx = `PROJETO: "${project?.name}" | Status: ${project?.status} | Progresso: ${total > 0 ? Math.round(done / total * 100) : 0}% (${done}/${total})\n`;
    if (overdueTasks.length) ctx += `ATRASADAS (${overdueTasks.length}): ${overdueTasks.map(t => `"${t.title}"`).join(', ')}\n`;
    if (blockedTasks.length) ctx += `BLOQUEADAS (${blockedTasks.length}): ${blockedTasks.map(t => `"${t.title}"`).join(', ')}\n`;
    Object.entries(byWs).forEach(([ws, wsTasks]) => {
      const wsDone = wsTasks.filter(t => t.status === 'done').length;
      ctx += `${ws.toUpperCase()}: ${wsDone}/${wsTasks.length} — `;
      ctx += wsTasks.slice(0, 4).map(t => `[${t.status}] "${t.title}"`).join(' | ');
      if (wsTasks.length > 4) ctx += ` +${wsTasks.length - 4}`;
      ctx += '\n';
    });
    return ctx;
  };

  const handleAiSend = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg = aiInput.trim();
    trackEvent('copilot_message_sent', { context: 'project_dashboard', project_id: project?.id });
    setAiInput('');
    const history: AiMessage[] = [...aiMessages, { role: 'user', content: userMsg }];
    setAiMessages(history);
    setAiLoading(true);
    setTimeout(() => { if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight; }, 50);

    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `Você é o SISTEMA OPERACIONAL DE CARREIRA ARTÍSTICA do TaskMaster.
Gestor musical sênior com 15+ anos de indústria fonográfica brasileira. Direto, operacional e específico.
HOJE: ${today}

PROJETO: "${project?.name}"
${project?.project_type ? `Tipo: ${project.project_type}` : ''}
${project?.objective ? `Objetivo: ${project.objective}` : '⚠️ Objetivo não definido — peça ao usuário que defina.'}
${project?.strategy ? `Estratégia: ${project.strategy}` : ''}
${project?.end_date ? `Data de entrega: ${project.end_date}` : '⚠️ Sem data de entrega — necesário para backward planning.'}

SITUAÇÃO ATUAL:
${buildAiContext()}

━━━ MATRIZ DE CARREIRA — FUNDAÇÃO ━━━
Todo projeto cobre áreas relevantes de:
1. PRODUTO (música/audiovisual) | 2. LANÇAMENTO (distribuição/pré-save/pitch)
3. MARKETING (orgânico/ads/influenciadores/playlists) | 4. IMPRENSA (rádio/TV/blogs)
5. SHOWS/COMERCIAL (venda/evento próprio) | 6. FINANCEIRO (orçamento/split)
7. ESTRATÉGIA (posicionamento/branding) | 8. OPERAÇÃO (equipe/logística)

━━━ CONDUÇÃO OPERACIONAL OBRIGATÓRIA ━━━
Para "onde estou?", "o que falta?", "próximo passo?", "status", "me atualiza":

📍 **[PROJETO: ${project?.name}]**
Fase atual: [nome] — [X]% concluído

✅ Já feito: [tarefas concluídas, máx 3]
🔲 Próximo passo AGORA: **"[tarefa exata]"** — prazo: [DD/MM]
🔲 Ainda falta: "[tarefa 2]" (DD/MM), "[tarefa 3]" (DD/MM)
⚠️ Atrasado: "[tarefa]" — [N] dias
🚧 Bloqueado: "[tarefa]" — [motivo]

⏭ Próxima fase: [nome]

REGRA: NUNCA use "o projeto" sem nomear. Sempre cite tarefa pelo nome exato com prazo.

━━━ PLANEJAMENTO REVERSO — DATAS REAIS ━━━
Toda tarefa criada DEVE ter due_date (YYYY-MM-DD) calculado backward da data final:
- Lançamento: D-30 upload distribuidora, D-20 pré-save, D-7 pitch, D-0 sexta-feira
- Show vendido: D-30 prospecção, D-14 proposta, D-7 contrato, D-1 rider
- Show próprio: D-60 local, D-30 ingressos, D-14 divulgação pesada, D-1 estrutura montada

━━━ DIFERENCIAÇÃO DE SHOW (OBRIGATÓRIA) ━━━
Se mencionar show, pergunte: "É show VENDIDO ou EVENTO PRÓPRIO?"
VENDIDO: Prospecção→Negociação→Contrato→Logística→Execução→Pós-show
PRÓPRIO: Planejamento→Estrutura→Artístico→Ingressos→Execução→Pós-evento

━━━ REGRAS DE CONDUÇÃO (OBRIGATÓRIO) ━━━
❌ NUNCA: "Você pode fazer...", "Sugiro...", "Seria interessante..."
✅ SEMPRE: "Você precisa fazer isso agora:", "Próximo passo obrigatório:", "Está atrasado — faça hoje:"

Se a tarefa estiver atrasada: aponte o atraso e dê a solução imediata.
Se o projeto estiver sem data/objetivo: exija que o usuário defina antes de continuar.
Se houver tarefas bloqueadas: identifique o gargalo e resolva.

━━━ AÇÕES DISPONÍVEIS ━━━
ADICIONAR TAREFA:
[ADICIONAR_TAREFA]{"title":"Nome da Tarefa","workstream":"marketing","priority":"high","description":"Detalhes","due_date":"${today}","etapa":"Nome da Etapa","internal_notes":"Contexto operacional"}[/ADICIONAR_TAREFA]

Workstreams válidos: producao_musical, conteudo, marketing, shows, logistica, estrategia, financeiro, lancamento

PRODUÇÃO MUSICAL:
[CRIAR_PRODUCAO_MUSICAL]{"song_count":12,"songs":["Título 1"],"responsible":"","description":"","tipo":"Álbum"}[/CRIAR_PRODUCAO_MUSICAL]

REGRA: Se intenção clara → execute diretamente. Respostas curtas e operacionais. Sem enrolação.
Responda em português.`;

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10).map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: 0.7,
          max_tokens: 700
        })
      });
      const data = await res.json();
      const aiText: string = data.choices?.[0]?.message?.content || 'Sem resposta.';

      // Detectar ações na resposta da IA
      const musicProdMatch = aiText.match(/\[CRIAR_PRODUCAO_MUSICAL\]([\s\S]*?)\[\/CRIAR_PRODUCAO_MUSICAL\]/);
      const taskMatch = aiText.match(/\[ADICIONAR_TAREFA\]([\s\S]*?)\[\/ADICIONAR_TAREFA\]/);

      if (musicProdMatch) {
        try { setPendingAction({ type: 'create_music_production', data: JSON.parse(musicProdMatch[1].trim()) }); } catch {}
      } else if (taskMatch) {
        try { setPendingAction({ type: 'add_task', data: JSON.parse(taskMatch[1].trim()) }); } catch {}
      }

      const cleanText = aiText
        .replace(/\[CRIAR_PRODUCAO_MUSICAL\][\s\S]*?\[\/CRIAR_PRODUCAO_MUSICAL\]/, '')
        .replace(/\[ADICIONAR_TAREFA\][\s\S]*?\[\/ADICIONAR_TAREFA\]/, '')
        .trim();
      setAiMessages(prev => [...prev, { role: 'assistant', content: cleanText || aiText }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA. Tente novamente.' }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => { if (aiScrollRef.current) aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight; }, 50);
    }
  };

  const handleApplyAction = async () => {
    if (!pendingAction) return;
    const { data: d } = pendingAction;

    if (pendingAction.type === 'add_task') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // Prefer direct due_date from IA, fallback to days_from_start for legacy
        const dueDate = d.due_date
          ? d.due_date
          : d.days_from_start
            ? new Date(Date.now() + Number(d.days_from_start) * 86400000).toISOString().split('T')[0]
            : null;
        const { error } = await supabase.from('tasks').insert({
          title: d.title,
          description: d.description || '',
          status: 'todo',
          priority: d.priority || 'medium',
          workstream: d.workstream || 'geral',
          etapa: d.etapa || null,
          internal_notes: d.internal_notes || null,
          project_id: project.id,
          organization_id: project.organization_id,
          reporter_id: user?.id,
          ...(dueDate ? { due_date: dueDate } : {})
        });
        if (error) throw error;
        setPendingAction(null);
        setAiMessages(prev => [...prev, { role: 'assistant', content: `✅ Tarefa **"${d.title}"** adicionada ao projeto! Veja no TaskBoard.` }]);
        toast.success(`Tarefa "${d.title}" adicionada!`);
      } catch { toast.error('Erro ao adicionar tarefa.'); }
      return;
    }

    if (pendingAction.type === 'create_music_production') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const songCount: number = d.song_count || 1;
        const tipo: string = d.tipo || 'Produção';
        const responsible: string = d.responsible || '';
        const songTitles: string[] = Array.isArray(d.songs) && d.songs.length > 0
          ? d.songs
          : Array.from({ length: songCount }, (_, i) => `Música ${i + 1}`);

        // Estrutura de tarefas para produção musical
        const productionTasks = [
          { title: `Definir repertório — ${tipo} (${songCount} músicas)`, priority: 'high', days: 0 },
          { title: `Arranjos — ${tipo}`, priority: 'high', days: 14 },
          { title: `Seleção de músicos${responsible ? ` — Responsável: ${responsible}` : ''}`, priority: 'high', days: 7 },
          { title: `Agendamento de ensaios — ${tipo}`, priority: 'medium', days: 21 },
          { title: `Pré-gravação / ensaio geral`, priority: 'medium', days: 35 },
          { title: `Gravação — ${tipo}`, priority: 'high', days: 45 },
          { title: `Edição e mixagem`, priority: 'medium', days: 60 },
          { title: `Masterização`, priority: 'medium', days: 75 },
        ];

        const today = new Date();
        const taskInserts = productionTasks.map(t => ({
          title: t.title,
          description: d.description || '',
          status: 'todo',
          priority: t.priority,
          workstream: 'producao_musical',
          project_id: project.id,
          organization_id: project.organization_id,
          reporter_id: user?.id,
          due_date: new Date(today.getTime() + t.days * 86400000).toISOString().split('T')[0],
        }));

        const { error: tasksError } = await supabase.from('tasks').insert(taskInserts);
        if (tasksError) throw tasksError;

        // Criar músicas na tabela works vinculadas a este projeto
        const songInserts = songTitles.map(title => ({
          title,
          organization_id: project.organization_id,
          artist_id: project.artist_id || null,
          project_id: project.id,
          status: 'draft',
        }));

        await supabase.from('works').insert(songInserts).then(({ error }) => {
          if (error) console.warn('works insert ignorado:', error.message);
        });

        // Recarregar músicas do projeto para exibir na seção Repertório
        supabase
          .from('works')
          .select('id, title, status')
          .eq('project_id', project.id)
          .neq('status', 'archived')
          .order('created_at', { ascending: false })
          .limit(30)
          .then(({ data }) => setSongs(data || []));

        setPendingAction(null);
        const confirmMsg = `✅ **Estrutura de ${tipo} criada!**\n\n` +
          `**${productionTasks.length} tarefas** adicionadas ao workstream *Produção Musical*:\n` +
          productionTasks.map(t => `• ${t.title}`).join('\n') +
          `\n\n**${songTitles.length} músicas** no repertório:\n` +
          songTitles.slice(0, 6).map(s => `• ${s}`).join('\n') +
          (songTitles.length > 6 ? `\n• ...e mais ${songTitles.length - 6}` : '') +
          `\n\nAbra o TaskBoard para ver e gerenciar o fluxo completo.`;
        setAiMessages(prev => [...prev, { role: 'assistant', content: confirmMsg }]);
        toast.success(`${tipo}: ${productionTasks.length} tarefas e ${songTitles.length} músicas criadas!`);
      } catch (err) {
        console.error('Erro ao criar produção musical:', err);
        toast.error('Erro ao criar estrutura de produção. Tente novamente.');
      }
      return;
    }
  };

  const handleOpenLinkSong = async () => {
    if (!project?.artist_id) {
      toast.error('Projeto sem artista vinculado.');
      return;
    }
    const { data } = await supabase
      .from('works')
      .select('id, title, status, project_id')
      .eq('artist_id', project.artist_id)
      .neq('status', 'archived')
      .order('title');
    setArtistWorks(data || []);
    setLinkSongOpen(true);
  };

  const handleLinkWork = async (workId: string, link: boolean) => {
    setLinkingWork(workId);
    const { error } = await supabase
      .from('works')
      .update({ project_id: link ? project.id : null })
      .eq('id', workId);
    if (error) { toast.error('Erro ao atualizar música.'); setLinkingWork(null); return; }
    // Atualiza lista local do modal
    setArtistWorks(prev => prev.map(w => w.id === workId ? { ...w, project_id: link ? project.id : null } : w));
    // Reload das músicas do projeto
    const { data } = await supabase
      .from('works')
      .select('id, title, status')
      .eq('project_id', project.id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
      .limit(30);
    setSongs(data || []);
    setLinkingWork(null);
  };

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
            <div className="flex gap-2 flex-wrap no-print">
              <button
                onClick={() => setAiOpen(o => !o)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shrink-0 ${aiOpen ? 'bg-[#FFAD85] text-white shadow-orange-100' : 'bg-orange-50 text-[#FF9B6A] border border-orange-200 hover:bg-orange-100'}`}
              >
                <Sparkles className="w-4 h-4" />
                {aiOpen ? 'Fechar IA' : 'IA do Projeto'}
                {aiOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
              <button
                onClick={() => navigate('/planejamento', { state: { projectId: project.id, project: { id: project.id, name: project.name } } })}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all shrink-0"
                title="Abrir no Copiloto completo"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Copiloto IA</span>
              </button>
              <button
                onClick={onNavigateToTasks}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-sm shadow-purple-100 shrink-0"
              >
                <Layers className="w-4 h-4" />
                TaskBoard
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/project/${project.id}`;
                  navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!')).catch(() => toast.error('Erro ao copiar.'));
                }}
                className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-all shrink-0"
                title="Compartilhar projeto"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Compartilhar</span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-all shrink-0"
                title="Exportar PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Exportar PDF</span>
              </button>
              <button
                onClick={handleArchive}
                className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-400 rounded-xl text-sm hover:text-gray-600 hover:bg-gray-50 transition-all shrink-0"
                title="Arquivar projeto"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
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

        {/* ── ALERTA PROJETO INCOMPLETO ────────────────────────────────────── */}
        {(!project.end_date || !project.objective) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Projeto incompleto</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {!project.objective && !project.end_date
                  ? 'Defina o objetivo e a data de entrega para ativar o planejamento automático.'
                  : !project.objective
                    ? 'Defina o objetivo do projeto na seção Visão abaixo.'
                    : 'Defina a data de entrega para o backward planning funcionar.'}
              </p>
            </div>
            <button
              onClick={() => { setVisionOpen(true); setEditingVision(true); }}
              className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            >
              Completar
            </button>
          </div>
        )}

        {/* ── VISÃO DO PROJETO ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setVisionOpen(o => !o)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-gray-800 text-sm">Visão do Projeto</h3>
              {(!project.objective && !project.strategy && !project.project_type) && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Incompleto</span>
              )}
            </div>
            {visionOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {visionOpen && (
            <div className="px-5 pb-5 border-t border-gray-50">
              {editingVision ? (
                <div className="pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tipo de Projeto</label>
                    <input
                      type="text"
                      value={visionData.project_type}
                      onChange={e => setVisionData(v => ({ ...v, project_type: e.target.value }))}
                      placeholder="Ex: Lançamento de single, Show próprio, EP, Turnê..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Objetivo</label>
                    <textarea
                      rows={2}
                      value={visionData.objective}
                      onChange={e => setVisionData(v => ({ ...v, objective: e.target.value }))}
                      placeholder="O que esse projeto precisa alcançar? (Ex: lançar o single X e atingir 50k streams em 30 dias)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Estratégia Geral</label>
                    <textarea
                      rows={3}
                      value={visionData.strategy}
                      onChange={e => setVisionData(v => ({ ...v, strategy: e.target.value }))}
                      placeholder="Como vamos alcançar o objetivo? (Ex: campanha de conteúdo + tráfego pago + playlist pitch)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-300 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveVision}
                      disabled={savingVision}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {savingVision ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Salvar
                    </button>
                    <button
                      onClick={() => { setEditingVision(false); setVisionData({ objective: project.objective || '', strategy: project.strategy || '', project_type: project.project_type || '' }); }}
                      className="px-4 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo</p>
                      <p className="text-sm text-gray-700 font-medium">{project.project_type || <span className="text-gray-300 italic">Não definido</span>}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Período</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {project.start_date ? formatDate(project.start_date) : '—'} → {project.end_date ? formatDate(project.end_date) : '—'}
                      </p>
                    </div>
                    {project.budget > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Orçamento</p>
                        <p className="text-sm text-gray-700 font-medium">R$ {Number(project.budget).toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                  </div>
                  {project.objective ? (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Objetivo</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{project.objective}</p>
                    </div>
                  ) : null}
                  {project.strategy ? (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Estratégia</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{project.strategy}</p>
                    </div>
                  ) : null}
                  {!project.objective && !project.strategy && (
                    <p className="text-sm text-gray-400 italic py-2">Nenhuma visão definida ainda. Complete para ativar o planejamento automático da IA.</p>
                  )}
                  <button
                    onClick={() => setEditingVision(true)}
                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar visão
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── O QUE FAZER HOJE ─────────────────────────────────────────────── */}
        {(overdue.length > 0 || upcoming.length > 0 || inProgress > 0) && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-5 py-4"
            onClick={() => trackEvent('today_block_viewed', { project_id: project?.id, overdue_count: overdue.length, upcoming_count: upcoming.length })}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-gray-800 text-sm">O que fazer hoje</h3>
            </div>
            <div className="space-y-2">
              {upcoming.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold text-xs mt-0.5 shrink-0">🔥 Agora:</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {upcoming[0].title}
                    {upcoming[0].due_date && <span className="text-xs text-gray-500 font-normal ml-1">— {formatDate(upcoming[0].due_date)}</span>}
                  </span>
                </div>
              )}
              {overdue.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-red-500 font-bold text-xs mt-0.5 shrink-0">⚠️ Atrasado:</span>
                  <span className="text-sm text-red-700">
                    {overdue[0].title}
                    {overdue.length > 1 && <span className="text-xs text-red-500 ml-1">+{overdue.length - 1} mais</span>}
                  </span>
                </div>
              )}
              {upcoming.length > 1 && (
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-bold text-xs mt-0.5 shrink-0">⏭ Próximo:</span>
                  <span className="text-sm text-gray-700">
                    {upcoming[1].title}
                    {upcoming[1].due_date && <span className="text-xs text-gray-400 ml-1">— {formatDate(upcoming[1].due_date)}</span>}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CARDS DE STATUS ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'A Fazer',       count: todo,       icon: Circle,        color: 'text-gray-500',  bg: 'bg-white',   status: 'todo' },
            { label: 'Em Progresso',  count: inProgress, icon: Clock,         color: 'text-blue-600',  bg: 'bg-white',   status: 'in_progress' },
            { label: 'Bloqueadas',    count: blocked,    icon: AlertCircle,   color: 'text-red-500',   bg: 'bg-white',   status: 'blocked' },
            { label: 'Concluídas',    count: done,       icon: CheckCircle2,  color: 'text-green-600', bg: 'bg-white',   status: 'done' },
          ].map(({ label, count, icon: Icon, color, bg, status }) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={label}
                onClick={() => setStatusFilter(isActive ? null : status)}
                className={`${bg} rounded-xl border shadow-sm p-4 flex items-center gap-3 w-full text-left transition-all hover:shadow-md ${isActive ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <Icon className={`w-6 h-6 ${color} shrink-0`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── FILTRO POR STATUS ─────────────────────────────────────────────── */}
        {statusFilter && (() => {
          const filtered = tasks.filter(t => t.status === statusFilter);
          const labels: Record<string, string> = { todo: 'A Fazer', in_progress: 'Em Progresso', blocked: 'Bloqueadas', done: 'Concluídas' };
          return (
            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-indigo-50 bg-indigo-50/40 flex items-center justify-between">
                <h3 className="font-bold text-indigo-700 text-sm">{labels[statusFilter]} ({filtered.length})</h3>
                <button onClick={() => setStatusFilter(null)} className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                  <X className="w-3 h-3" /> Limpar filtro
                </button>
              </div>
              {filtered.length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">Nenhuma tarefa neste status.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filtered.map(task => {
                    const ws = WORKSTREAMS.find(w => w.id === task.workstream);
                    const days = daysUntil(task.due_date);
                    const urgent = days !== null && days <= 3;
                    return (
                      <div key={task.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                        <div className="mt-0.5 shrink-0">
                          {task.status === 'done' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                            : task.status === 'blocked' ? <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            : task.status === 'in_progress' ? <Clock className="w-3.5 h-3.5 text-blue-500" />
                            : <Circle className="w-3.5 h-3.5 text-gray-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {task.due_date && (
                              <span className={`text-xs font-bold ${urgent ? 'text-orange-500' : 'text-gray-400'}`}>
                                {formatDate(task.due_date)}
                              </span>
                            )}
                            {ws && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ws.bg} ${ws.color}`}>{ws.label}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

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

        {/* ── REPERTÓRIO (músicas vinculadas ao projeto) ──────────────────── */}
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-gray-800 text-sm">Repertório do Projeto</h3>
              {songs.length > 0 && (
                <span className="text-xs font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                  {songs.length} {songs.length === 1 ? 'música' : 'músicas'}
                </span>
              )}
            </div>
            {project.artist_id && (
              <button
                onClick={handleOpenLinkSong}
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-all"
              >
                <Link2 className="w-3.5 h-3.5" />
                Vincular música
              </button>
            )}
          </div>
          {songs.length === 0 ? (
            <div className="p-8 text-center">
              <Music className="w-8 h-8 text-rose-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Nenhuma música vinculada</p>
              <p className="text-xs text-gray-400 mt-1">Use o Copilot para criar um repertório ou vincule músicas existentes do artista.</p>
            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {songs.map(song => (
                <div key={song.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100">
                  <Music className="w-3 h-3 text-rose-400 shrink-0" />
                  <span className="text-sm text-gray-800 truncate font-medium">{song.title}</span>
                  {song.status && song.status !== 'draft' && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white text-rose-600 border border-rose-200 shrink-0 ml-auto">
                      {song.status === 'ready' ? 'Pronta' : song.status === 'released' ? 'Lançada' : song.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── MODAL: Vincular músicas ao projeto ──────────────────────────── */}
        {linkSongOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-rose-600" />
                  <h2 className="font-bold text-gray-800">Vincular músicas ao projeto</h2>
                </div>
                <button onClick={() => setLinkSongOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 p-4">
                {artistWorks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">Nenhuma música encontrada para este artista.</p>
                ) : (
                  <div className="space-y-2">
                    {artistWorks.map(work => {
                      const isLinked = work.project_id === project.id;
                      const isOtherProject = work.project_id && work.project_id !== project.id;
                      return (
                        <div key={work.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isLinked ? 'bg-rose-50 border-rose-200' : 'bg-gray-50 border-gray-200'}`}>
                          <Music className={`w-4 h-4 shrink-0 ${isLinked ? 'text-rose-500' : 'text-gray-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{work.title}</p>
                            {isOtherProject && (
                              <p className="text-[10px] text-amber-600">Vinculada a outro projeto</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleLinkWork(work.id, !isLinked)}
                            disabled={linkingWork === work.id}
                            className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                              isLinked
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                          >
                            {linkingWork === work.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : isLinked ? (
                              <><Unlink className="w-3 h-3" /> Desvincular</>
                            ) : (
                              <><Link2 className="w-3 h-3" /> Vincular</>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="px-5 py-3 border-t">
                <button onClick={() => setLinkSongOpen(false)} className="w-full py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-all">
                  Fechar
                </button>
              </div>
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

        {/* ── IA DO PROJETO ────────────────────────────────────────────────── */}
        {aiOpen && (
          <div className="bg-white rounded-2xl border border-orange-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#FF9B6A]" />
              <h3 className="font-bold text-gray-800 text-sm">Copiloto do Projeto</h3>
              <span className="text-xs text-gray-400 ml-1 flex-1">— "{project.name}"</span>
              {aiMessages.length > 0 && (
                <button
                  onClick={() => { setAiMessages([]); try { localStorage.removeItem(AI_HISTORY_KEY); } catch {} }}
                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors px-2 py-0.5 rounded border border-gray-200 hover:border-red-200"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Histórico */}
            <div ref={aiScrollRef} className="h-64 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/40">
              {aiMessages.length === 0 && (
                <p className="text-sm text-gray-400 text-center pt-8">
                  Pergunte sobre este projeto — tarefas atrasadas, gargalos, o que priorizar, ou peça para criar uma tarefa nova.
                </p>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#FFAD85] text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-xl rounded-bl-none px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Ação pendente */}
            {pendingAction && (
              <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 flex items-center justify-between gap-3">
                <p className="text-sm text-amber-800 font-medium">
                  {pendingAction.type === 'create_music_production'
                    ? <>Criar estrutura de <strong>{pendingAction.data.tipo || 'Produção Musical'}</strong> — {pendingAction.data.song_count || 1} músicas + tarefas operacionais</>
                    : <>Adicionar tarefa: <strong>"{pendingAction.data.title}"</strong> ({pendingAction.data.workstream})</>
                  }
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPendingAction(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                  <button onClick={handleApplyAction} className="px-3 py-1.5 text-xs bg-[#FFAD85] text-white font-bold rounded-lg hover:bg-[#FF9B6A] transition-colors">Aplicar</button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAiSend(); } }}
                placeholder="O que precisa de atenção agora? Qual tarefa adicionar?"
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent outline-none"
                disabled={aiLoading}
              />
              <button
                onClick={handleAiSend}
                disabled={aiLoading || !aiInput.trim()}
                className="p-2 bg-[#FFAD85] text-white rounded-xl hover:bg-[#FF9B6A] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
