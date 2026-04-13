/**
 * OPERATIONAL_TEMPLATES — Templates de sub-tarefas por workstream e fase.
 *
 * Regra de negócio:
 * - A IA cria apenas a tarefa pai (nível 1)
 * - Sub-tarefas são geradas ON-DEMAND (quando usuário expande o setor)
 * - Máximo de 12 sub-tarefas por tarefa pai
 * - Nunca gerar duplicadas (verificar parent_task_id + phase + title)
 *
 * Princípio de qualidade das sub-tarefas:
 * - Começar com verbo forte no infinitivo
 * - Incluir o entregável/resultado esperado
 * - Ser específica o suficiente para executar sem dúvidas
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
      { title: 'Selecionar e fechar repertório com o artista',               phase: 'pre_producao', priority: 'high',   days_from_parent: 3  },
      { title: 'Elaborar cifras, estrutura e arranjo faixa a faixa',         phase: 'pre_producao', priority: 'high',   days_from_parent: 5  },
      { title: 'Contratar músicos e confirmar disponibilidade nas sessões',   phase: 'pre_producao', priority: 'high',   days_from_parent: 7  },
      { title: 'Reservar estúdio e confirmar data e horário de gravação',     phase: 'pre_producao', priority: 'medium', days_from_parent: 7  },
    ],
    gravacao: [
      { title: 'Gravar base rítmica completa (bateria e percussão)',          phase: 'gravacao', priority: 'high',   days_from_parent: 14 },
      { title: 'Gravar instrumentos harmônicos (guitarra, teclado, baixo)',   phase: 'gravacao', priority: 'high',   days_from_parent: 18 },
      { title: 'Gravar vocais principais e backing vocals',                   phase: 'gravacao', priority: 'high',   days_from_parent: 21 },
    ],
    pos_producao: [
      { title: 'Selecionar takes e editar performance faixa a faixa',         phase: 'pos_producao', priority: 'medium', days_from_parent: 25 },
      { title: 'Entregar mixagem e coletar revisões do artista',              phase: 'pos_producao', priority: 'high',   days_from_parent: 30 },
      { title: 'Aprovar mixagem final e liberar para masterização',           phase: 'pos_producao', priority: 'medium', days_from_parent: 33 },
      { title: 'Enviar para masterização e validar loudness e EQ',            phase: 'pos_producao', priority: 'high',   days_from_parent: 36 },
      { title: 'Aprovar master final e arquivar WAV e MP3 originais',        phase: 'pos_producao', priority: 'high',   days_from_parent: 38 },
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
      { title: 'Definir e bloquear data de lançamento no calendário editorial', phase: 'pre_lancamento', priority: 'high',   days_from_parent: 2  },
      { title: 'Cadastrar ISRC, metadados e créditos na distribuidora',         phase: 'pre_lancamento', priority: 'high',   days_from_parent: 5  },
      { title: 'Aprovar e exportar arte da capa em todos os formatos exigidos', phase: 'pre_lancamento', priority: 'high',   days_from_parent: 7  },
      { title: 'Enviar arquivo de áudio masterizado para a distribuidora',      phase: 'pre_lancamento', priority: 'high',   days_from_parent: 10 },
      { title: 'Ativar link de pré-save e publicar na bio das redes sociais',  phase: 'pre_lancamento', priority: 'medium', days_from_parent: 12 },
      { title: 'Fazer checklist final: áudio, capa, créditos e ISRC',          phase: 'pre_lancamento', priority: 'high',   days_from_parent: 14 },
    ],
    lancamento: [
      { title: 'Confirmar publicação e links ativos em todas as plataformas',  phase: 'lancamento', priority: 'high',   days_from_parent: 15 },
      { title: 'Monitorar streams, saves e comentários nas primeiras 24h',     phase: 'lancamento', priority: 'high',   days_from_parent: 15 },
      { title: 'Avisar equipe, parceiros e imprensa sobre o lançamento',       phase: 'lancamento', priority: 'medium', days_from_parent: 15 },
    ],
    divulgacao: [
      { title: 'Publicar conteúdo de lançamento no feed e stories',           phase: 'divulgacao', priority: 'high',   days_from_parent: 16 },
      { title: 'Ativar campanha de mídia paga com criativos de lançamento',   phase: 'divulgacao', priority: 'medium', days_from_parent: 16 },
      { title: 'Enviar para playlists editoriais e curadores independentes',  phase: 'divulgacao', priority: 'high',   days_from_parent: 16 },
      { title: 'Compilar relatório de métricas: streams, saves e alcance',    phase: 'divulgacao', priority: 'medium', days_from_parent: 21 },
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
      { title: 'Elaborar e enviar proposta comercial com cachê e rider',        phase: 'negociacao', priority: 'high',   days_from_parent: 1  },
      { title: 'Revisar, assinar e arquivar contrato do show',                  phase: 'negociacao', priority: 'high',   days_from_parent: 5  },
      { title: 'Confirmar pagamento do sinal e emitir NF ou recibo',            phase: 'negociacao', priority: 'high',   days_from_parent: 5  },
    ],
    execucao: [
      { title: 'Enviar rider técnico completo ao produtor local do evento',     phase: 'execucao', priority: 'high',   days_from_parent: 10 },
      { title: 'Reservar passagens, hotel e transporte de equipamentos',        phase: 'execucao', priority: 'high',   days_from_parent: 14 },
      { title: 'Confirmar equipe: roadie, técnico de som e fotógrafo',         phase: 'execucao', priority: 'medium', days_from_parent: 14 },
      { title: 'Montar e confirmar setlist com o artista',                     phase: 'execucao', priority: 'medium', days_from_parent: 16 },
      { title: 'Realizar passagem de som e checar monitor e PA',               phase: 'execucao', priority: 'high',   days_from_parent: 0  },
    ],
    pos_show: [
      { title: 'Confirmar recebimento do saldo e atualizar financeiro',         phase: 'pos_show', priority: 'high',   days_from_parent: 3  },
      { title: 'Coletar e organizar fotos, vídeos e registros do show',        phase: 'pos_show', priority: 'medium', days_from_parent: 3  },
      { title: 'Publicar cobertura (story, reels ou post) nas redes sociais',  phase: 'pos_show', priority: 'medium', days_from_parent: 5  },
      { title: 'Registrar aprendizados e feedback da equipe em relatório',     phase: 'pos_show', priority: 'low',    days_from_parent: 7  },
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
      { title: 'Definir objetivo da campanha e KPI de sucesso',               phase: 'planejamento', priority: 'high',   days_from_parent: 2  },
      { title: 'Mapear público-alvo e criar persona da campanha',             phase: 'planejamento', priority: 'high',   days_from_parent: 3  },
      { title: 'Fechar orçamento e distribuir por canal (ads, press, social)', phase: 'planejamento', priority: 'high',   days_from_parent: 4  },
      { title: 'Aprovar plano de ação com datas e responsáveis',              phase: 'planejamento', priority: 'medium', days_from_parent: 5  },
    ],
    execucao: [
      { title: 'Produzir criativos: imagem, vídeo e copy de cada peça',      phase: 'execucao', priority: 'high',   days_from_parent: 10 },
      { title: 'Configurar e subir campanhas de mídia paga (Meta/Google)',    phase: 'execucao', priority: 'high',   days_from_parent: 12 },
      { title: 'Agendar e publicar conteúdo orgânico nas redes sociais',     phase: 'execucao', priority: 'high',   days_from_parent: 14 },
      { title: 'Acionar parceiros, veículos de imprensa e influenciadores',  phase: 'execucao', priority: 'medium', days_from_parent: 14 },
    ],
    analise: [
      { title: 'Acompanhar resultados diários: CPM, CPC e alcance',          phase: 'analise', priority: 'medium', days_from_parent: 21 },
      { title: 'Otimizar criativos pausando os de pior desempenho',          phase: 'analise', priority: 'medium', days_from_parent: 23 },
      { title: 'Compilar relatório final com aprendizados e ROI',            phase: 'analise', priority: 'low',    days_from_parent: 30 },
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
      { title: 'Definir objetivo do conteúdo e qual resultado esperar',       phase: 'planejamento', priority: 'high',   days_from_parent: 1 },
      { title: 'Escrever roteiro ou briefing visual com referências',         phase: 'planejamento', priority: 'high',   days_from_parent: 2 },
      { title: 'Aprovar roteiro com artista ou gestor antes de produzir',    phase: 'planejamento', priority: 'medium', days_from_parent: 3 },
    ],
    producao: [
      { title: 'Realizar gravação de vídeo ou sessão fotográfica',           phase: 'producao', priority: 'high',   days_from_parent: 5  },
      { title: 'Editar vídeo com cortes, trilha, efeitos e legendas',        phase: 'producao', priority: 'high',   days_from_parent: 7  },
      { title: 'Revisar e aprovar material final antes de publicar',         phase: 'producao', priority: 'high',   days_from_parent: 8  },
      { title: 'Redigir legenda, CTA e selecionar hashtags estratégicas',    phase: 'producao', priority: 'medium', days_from_parent: 9  },
    ],
    publicacao: [
      { title: 'Agendar publicação no melhor horário para o perfil',         phase: 'publicacao', priority: 'high',   days_from_parent: 10 },
      { title: 'Publicar e monitorar engajamento nas primeiras 2 horas',    phase: 'publicacao', priority: 'medium', days_from_parent: 11 },
      { title: 'Responder comentários e DMs relevantes em até 24h',         phase: 'publicacao', priority: 'low',    days_from_parent: 12 },
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
      { title: 'Mapear situação atual: streams, shows, redes e financeiro',   phase: 'diagnostico', priority: 'high',   days_from_parent: 3  },
      { title: 'Identificar 3 principais oportunidades de crescimento',       phase: 'diagnostico', priority: 'high',   days_from_parent: 5  },
    ],
    planejamento: [
      { title: 'Definir metas SMART para os próximos 90 dias',               phase: 'planejamento', priority: 'high',   days_from_parent: 7  },
      { title: 'Listar parceiros, recursos e orçamento necessários',          phase: 'planejamento', priority: 'medium', days_from_parent: 10 },
      { title: 'Aprovar plano estratégico e distribuir responsabilidades',    phase: 'planejamento', priority: 'high',   days_from_parent: 12 },
    ],
    execucao: [
      { title: 'Iniciar as 3 ações prioritárias do plano aprovado',          phase: 'execucao', priority: 'high',   days_from_parent: 14 },
      { title: 'Fazer checkpoint semanal: o que avançou e o que travou',     phase: 'execucao', priority: 'medium', days_from_parent: 21 },
      { title: 'Revisar e ajustar estratégia com base nos resultados',       phase: 'execucao', priority: 'medium', days_from_parent: 30 },
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
      { title: 'Levantar todos os custos do projeto com fornecedores',       phase: 'orcamento', priority: 'high',   days_from_parent: 2  },
      { title: 'Aprovar orçamento e definir reserva para imprevistos (10%)', phase: 'orcamento', priority: 'high',   days_from_parent: 4  },
    ],
    contratos: [
      { title: 'Redigir ou revisar todos os contratos envolvidos',           phase: 'contratos', priority: 'high',   days_from_parent: 7  },
      { title: 'Assinar contratos e guardar cópias em nuvem',               phase: 'contratos', priority: 'high',   days_from_parent: 10 },
    ],
    pagamentos: [
      { title: 'Emitir notas fiscais para todos os prestadores de serviço', phase: 'pagamentos', priority: 'medium', days_from_parent: 14 },
      { title: 'Confirmar recebimento de todos os pagamentos devidos',      phase: 'pagamentos', priority: 'high',   days_from_parent: 14 },
      { title: 'Conciliar financeiro: receitas vs custos do projeto',       phase: 'pagamentos', priority: 'medium', days_from_parent: 30 },
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
      { title: 'Planejar rota e confirmar transporte de pessoas e equip.',   phase: 'planejamento', priority: 'high',   days_from_parent: 5  },
      { title: 'Pesquisar e reservar hospedagem próxima ao local',           phase: 'planejamento', priority: 'high',   days_from_parent: 7  },
      { title: 'Listar e confirmar todos os equipamentos necessários',       phase: 'planejamento', priority: 'medium', days_from_parent: 7  },
    ],
    execucao: [
      { title: 'Confirmar passagens, veículo ou van e horários de saída',   phase: 'execucao', priority: 'high',   days_from_parent: 10 },
      { title: 'Verificar check-in do hotel e rota de acesso ao local',     phase: 'execucao', priority: 'medium', days_from_parent: 12 },
      { title: 'Fazer check-in logístico no local e organizar backstage',   phase: 'execucao', priority: 'high',   days_from_parent: 0  },
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
