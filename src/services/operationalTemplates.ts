/**
 * OPERATIONAL_TEMPLATES — Templates de sub-tarefas por workstream e fase.
 *
 * Regra de negócio:
 * - A IA cria apenas a tarefa pai (nível 1)
 * - Sub-tarefas são geradas ON-DEMAND (quando usuário expande o setor)
 * - Máximo de 12 sub-tarefas por tarefa pai
 * - Nunca gerar duplicadas (verificar parent_task_id + phase + title)
 */

export interface OperationalSubTask {
  title: string;
  phase: string;
  priority: 'high' | 'medium' | 'low';
  days_from_parent: number; // prazo relativo à tarefa pai
}

export interface OperationalPhase {
  id: string;
  label: string;
  order: number;
}

export interface WorkstreamTemplate {
  phases: OperationalPhase[];
  tasks: Record<string, OperationalSubTask[]>; // chave = phase.id
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUÇÃO MUSICAL
// ─────────────────────────────────────────────────────────────────────────────
const producaoMusical: WorkstreamTemplate = {
  phases: [
    { id: 'pre_producao', label: 'Pré-Produção', order: 1 },
    { id: 'gravacao',     label: 'Gravação',      order: 2 },
    { id: 'pos_producao', label: 'Pós-Produção',  order: 3 },
  ],
  tasks: {
    pre_producao: [
      { title: 'Definir repertório',           phase: 'pre_producao', priority: 'high',   days_from_parent: 3  },
      { title: 'Definir arranjos e estrutura', phase: 'pre_producao', priority: 'high',   days_from_parent: 5  },
      { title: 'Contratar músicos',            phase: 'pre_producao', priority: 'high',   days_from_parent: 7  },
      { title: 'Agendar estúdio',              phase: 'pre_producao', priority: 'medium', days_from_parent: 7  },
    ],
    gravacao: [
      { title: 'Gravar guia (base rítmica)',   phase: 'gravacao', priority: 'high',   days_from_parent: 14 },
      { title: 'Gravar instrumentos',          phase: 'gravacao', priority: 'high',   days_from_parent: 18 },
      { title: 'Gravar vocais',                phase: 'gravacao', priority: 'high',   days_from_parent: 21 },
    ],
    pos_producao: [
      { title: 'Edição e comping',             phase: 'pos_producao', priority: 'medium', days_from_parent: 25 },
      { title: 'Mixagem',                      phase: 'pos_producao', priority: 'high',   days_from_parent: 30 },
      { title: 'Revisão da mixagem',           phase: 'pos_producao', priority: 'medium', days_from_parent: 33 },
      { title: 'Masterização',                 phase: 'pos_producao', priority: 'high',   days_from_parent: 36 },
      { title: 'Aprovação final do áudio',     phase: 'pos_producao', priority: 'high',   days_from_parent: 38 },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LANÇAMENTO
// ─────────────────────────────────────────────────────────────────────────────
const lancamento: WorkstreamTemplate = {
  phases: [
    { id: 'pre_lancamento', label: 'Pré-Lançamento', order: 1 },
    { id: 'lancamento',     label: 'Lançamento',     order: 2 },
    { id: 'divulgacao',     label: 'Divulgação',     order: 3 },
  ],
  tasks: {
    pre_lancamento: [
      { title: 'Definir data de lançamento',          phase: 'pre_lancamento', priority: 'high',   days_from_parent: 2  },
      { title: 'Registrar ISRC e metadados',          phase: 'pre_lancamento', priority: 'high',   days_from_parent: 5  },
      { title: 'Finalizar arte da capa',              phase: 'pre_lancamento', priority: 'high',   days_from_parent: 7  },
      { title: 'Enviar para distribuidora',           phase: 'pre_lancamento', priority: 'high',   days_from_parent: 10 },
      { title: 'Configurar link de pré-save',         phase: 'pre_lancamento', priority: 'medium', days_from_parent: 12 },
      { title: 'Checklist final de aprovação',        phase: 'pre_lancamento', priority: 'high',   days_from_parent: 14 },
    ],
    lancamento: [
      { title: 'Confirmar publicação nas plataformas', phase: 'lancamento', priority: 'high',   days_from_parent: 15 },
      { title: 'Monitorar links e disponibilidade',   phase: 'lancamento', priority: 'high',   days_from_parent: 15 },
      { title: 'Disparar comunicação para equipe',    phase: 'lancamento', priority: 'medium', days_from_parent: 15 },
    ],
    divulgacao: [
      { title: 'Publicar conteúdo de lançamento',    phase: 'divulgacao', priority: 'high',   days_from_parent: 16 },
      { title: 'Ativar mídia paga (ads)',             phase: 'divulgacao', priority: 'medium', days_from_parent: 16 },
      { title: 'Enviar para playlists e curadores',  phase: 'divulgacao', priority: 'high',   days_from_parent: 16 },
      { title: 'Acompanhar métricas (streams/saves)', phase: 'divulgacao', priority: 'medium', days_from_parent: 21 },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SHOWS
// ─────────────────────────────────────────────────────────────────────────────
const shows: WorkstreamTemplate = {
  phases: [
    { id: 'negociacao',  label: 'Negociação',  order: 1 },
    { id: 'execucao',    label: 'Execução',    order: 2 },
    { id: 'pos_show',    label: 'Pós-Show',    order: 3 },
  ],
  tasks: {
    negociacao: [
      { title: 'Enviar proposta comercial',   phase: 'negociacao', priority: 'high',   days_from_parent: 1  },
      { title: 'Assinar contrato',            phase: 'negociacao', priority: 'high',   days_from_parent: 5  },
      { title: 'Confirmar cachê e forma de pagamento', phase: 'negociacao', priority: 'high', days_from_parent: 5 },
    ],
    execucao: [
      { title: 'Enviar rider técnico',        phase: 'execucao', priority: 'high',   days_from_parent: 10 },
      { title: 'Confirmar logística (viagem e hospedagem)', phase: 'execucao', priority: 'high', days_from_parent: 14 },
      { title: 'Confirmar equipe técnica',    phase: 'execucao', priority: 'medium', days_from_parent: 14 },
      { title: 'Definir setlist',             phase: 'execucao', priority: 'medium', days_from_parent: 16 },
      { title: 'Passagem de som',             phase: 'execucao', priority: 'high',   days_from_parent: 0  },
    ],
    pos_show: [
      { title: 'Confirmar recebimento do saldo', phase: 'pos_show', priority: 'high',   days_from_parent: 3  },
      { title: 'Coletar fotos e vídeos',         phase: 'pos_show', priority: 'medium', days_from_parent: 3  },
      { title: 'Publicar conteúdo pós-show',     phase: 'pos_show', priority: 'medium', days_from_parent: 5  },
      { title: 'Relatório e feedback',           phase: 'pos_show', priority: 'low',    days_from_parent: 7  },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MARKETING
// ─────────────────────────────────────────────────────────────────────────────
const marketing: WorkstreamTemplate = {
  phases: [
    { id: 'planejamento', label: 'Planejamento', order: 1 },
    { id: 'execucao',     label: 'Execução',     order: 2 },
    { id: 'analise',      label: 'Análise',      order: 3 },
  ],
  tasks: {
    planejamento: [
      { title: 'Definir objetivo da campanha',  phase: 'planejamento', priority: 'high',   days_from_parent: 2  },
      { title: 'Definir público-alvo',          phase: 'planejamento', priority: 'high',   days_from_parent: 3  },
      { title: 'Definir canais e orçamento',    phase: 'planejamento', priority: 'high',   days_from_parent: 4  },
      { title: 'Aprovar plano de ação',         phase: 'planejamento', priority: 'medium', days_from_parent: 5  },
    ],
    execucao: [
      { title: 'Produzir criativos (imagem/vídeo)', phase: 'execucao', priority: 'high',   days_from_parent: 10 },
      { title: 'Configurar campanhas de mídia paga', phase: 'execucao', priority: 'high',  days_from_parent: 12 },
      { title: 'Publicar nas redes sociais',    phase: 'execucao', priority: 'high',   days_from_parent: 14 },
      { title: 'Acionar parceiros e influenciadores', phase: 'execucao', priority: 'medium', days_from_parent: 14 },
    ],
    analise: [
      { title: 'Monitorar resultados (reach, engajamento)', phase: 'analise', priority: 'medium', days_from_parent: 21 },
      { title: 'Ajustar criativos com base no desempenho', phase: 'analise', priority: 'medium', days_from_parent: 23 },
      { title: 'Relatório final da campanha',  phase: 'analise', priority: 'low',    days_from_parent: 30 },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEÚDO
// ─────────────────────────────────────────────────────────────────────────────
const conteudo: WorkstreamTemplate = {
  phases: [
    { id: 'planejamento', label: 'Planejamento', order: 1 },
    { id: 'producao',     label: 'Produção',     order: 2 },
    { id: 'publicacao',   label: 'Publicação',   order: 3 },
  ],
  tasks: {
    planejamento: [
      { title: 'Definir objetivo do conteúdo',  phase: 'planejamento', priority: 'high',   days_from_parent: 1 },
      { title: 'Escrever roteiro / briefing',   phase: 'planejamento', priority: 'high',   days_from_parent: 2 },
      { title: 'Aprovar roteiro',               phase: 'planejamento', priority: 'medium', days_from_parent: 3 },
    ],
    producao: [
      { title: 'Gravar / fotografar',           phase: 'producao', priority: 'high',   days_from_parent: 5  },
      { title: 'Editar vídeo / tratar fotos',   phase: 'producao', priority: 'high',   days_from_parent: 7  },
      { title: 'Revisar e aprovar material',    phase: 'producao', priority: 'high',   days_from_parent: 8  },
      { title: 'Criar legenda e hashtags',      phase: 'producao', priority: 'medium', days_from_parent: 9  },
    ],
    publicacao: [
      { title: 'Agendar publicação',            phase: 'publicacao', priority: 'high',   days_from_parent: 10 },
      { title: 'Publicar e monitorar',          phase: 'publicacao', priority: 'medium', days_from_parent: 11 },
      { title: 'Responder comentários (24h)',   phase: 'publicacao', priority: 'low',    days_from_parent: 12 },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTRATÉGIA
// ─────────────────────────────────────────────────────────────────────────────
const estrategia: WorkstreamTemplate = {
  phases: [
    { id: 'diagnostico', label: 'Diagnóstico', order: 1 },
    { id: 'planejamento', label: 'Planejamento', order: 2 },
    { id: 'execucao',    label: 'Execução',     order: 3 },
  ],
  tasks: {
    diagnostico: [
      { title: 'Mapear situação atual',           phase: 'diagnostico', priority: 'high',   days_from_parent: 3  },
      { title: 'Identificar oportunidades',       phase: 'diagnostico', priority: 'high',   days_from_parent: 5  },
    ],
    planejamento: [
      { title: 'Definir metas e KPIs',            phase: 'planejamento', priority: 'high',   days_from_parent: 7  },
      { title: 'Mapear parceiros e recursos',     phase: 'planejamento', priority: 'medium', days_from_parent: 10 },
      { title: 'Aprovar plano estratégico',       phase: 'planejamento', priority: 'high',   days_from_parent: 12 },
    ],
    execucao: [
      { title: 'Implementar ações prioritárias',  phase: 'execucao', priority: 'high',   days_from_parent: 14 },
      { title: 'Revisar progresso (checkpoint)',  phase: 'execucao', priority: 'medium', days_from_parent: 21 },
      { title: 'Ajustar estratégia se necessário', phase: 'execucao', priority: 'medium', days_from_parent: 30 },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCEIRO
// ─────────────────────────────────────────────────────────────────────────────
const financeiro: WorkstreamTemplate = {
  phases: [
    { id: 'orcamento',  label: 'Orçamento', order: 1 },
    { id: 'contratos',  label: 'Contratos', order: 2 },
    { id: 'pagamentos', label: 'Pagamentos', order: 3 },
  ],
  tasks: {
    orcamento: [
      { title: 'Levantar custos do projeto',    phase: 'orcamento', priority: 'high',   days_from_parent: 2  },
      { title: 'Aprovar orçamento',             phase: 'orcamento', priority: 'high',   days_from_parent: 4  },
    ],
    contratos: [
      { title: 'Redigir / revisar contratos',   phase: 'contratos', priority: 'high',   days_from_parent: 7  },
      { title: 'Assinar contratos',             phase: 'contratos', priority: 'high',   days_from_parent: 10 },
    ],
    pagamentos: [
      { title: 'Emitir notas fiscais',          phase: 'pagamentos', priority: 'medium', days_from_parent: 14 },
      { title: 'Confirmar pagamentos recebidos', phase: 'pagamentos', priority: 'high',  days_from_parent: 14 },
      { title: 'Conciliar financeiro do projeto', phase: 'pagamentos', priority: 'medium', days_from_parent: 30 },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGÍSTICA
// ─────────────────────────────────────────────────────────────────────────────
const logistica: WorkstreamTemplate = {
  phases: [
    { id: 'planejamento', label: 'Planejamento', order: 1 },
    { id: 'execucao',     label: 'Execução',     order: 2 },
  ],
  tasks: {
    planejamento: [
      { title: 'Planejar deslocamento',         phase: 'planejamento', priority: 'high',   days_from_parent: 5  },
      { title: 'Reservar hospedagem',           phase: 'planejamento', priority: 'high',   days_from_parent: 7  },
      { title: 'Confirmar equipamentos',        phase: 'planejamento', priority: 'medium', days_from_parent: 7  },
    ],
    execucao: [
      { title: 'Confirmar transporte',          phase: 'execucao', priority: 'high',   days_from_parent: 10 },
      { title: 'Verificar check-in e rotas',    phase: 'execucao', priority: 'medium', days_from_parent: 12 },
      { title: 'Check-in logístico no local',   phase: 'execucao', priority: 'high',   days_from_parent: 0  },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ÍNDICE PRINCIPAL — chave = workstream
// ─────────────────────────────────────────────────────────────────────────────
export const OPERATIONAL_TEMPLATES: Record<string, WorkstreamTemplate> = {
  producao_musical: producaoMusical,
  lancamento:       lancamento,
  shows:            shows,
  marketing:        marketing,
  conteudo:         conteudo,
  estrategia:       estrategia,
  financeiro:       financeiro,
  logistica:        logistica,
};

/**
 * Retorna as sub-tarefas de um workstream, planas (array), com phase preenchido.
 * Limite: 12 por template para evitar explosão.
 */
export function getSubTasksForWorkstream(workstream: string): OperationalSubTask[] {
  const template = OPERATIONAL_TEMPLATES[workstream];
  if (!template) return [];
  const all: OperationalSubTask[] = [];
  for (const phase of template.phases.sort((a, b) => a.order - b.order)) {
    const phaseTasks = template.tasks[phase.id] || [];
    all.push(...phaseTasks);
  }
  return all.slice(0, 12);
}

/**
 * Retorna as fases de um workstream ordenadas.
 */
export function getPhasesForWorkstream(workstream: string): OperationalPhase[] {
  const template = OPERATIONAL_TEMPLATES[workstream];
  if (!template) return [];
  return template.phases.sort((a, b) => a.order - b.order);
}
