/**
 * Serviço de IA para o Mentor FlexMax (Marcos Menezes)
 * Fornece consultoria 360° sobre carreira artística, negócios e vida pessoal
 *
 * Este serviço integra-se com OpenAI para fornecer respostas humanizadas e contextualizadas
 */

import { supabase } from '../lib/supabase';

/**
 * Busca dados reais do usuário no Supabase e compõe uma string de contexto
 * para injetar no system prompt do Mentor.
 * São 3 queries paralelas — custo mínimo, impacto máximo.
 */
/**
 * Lê o perfil de maturidade salvo no localStorage (gravado pelo MentorDiagnosticOnboarding).
 * Retorna instruções extras para o system prompt do Mentor.
 */
export function buildMaturityContext(): string {
  try {
    const stage = localStorage.getItem('mentor_maturity_stage');
    const profile = localStorage.getItem('mentor_maturity_profile');
    if (!stage) return '';

    const stageLabels: Record<string, string> = {
      dreamer: 'Iniciante / Sonhador — ainda sem estrutura, começando do zero',
      band_manager: 'Intermediário — já faz shows e lançamentos, quer profissionalizar',
      scaling_structure: 'Avançado — operação estruturada, equipe, múltiplos projetos',
      multi_artist_producer: 'Escritório / Selo — gestão de múltiplos artistas',
    };

    const stageInstructions: Record<string, string> = {
      dreamer: `
## PERFIL IDENTIFICADO: INICIANTE
- Responda com linguagem simples, sem jargões
- Explique o básico sem ser condescendente
- Mostre o primeiro passo concreto, não o plano completo
- Celebre a intenção, mas seja direto sobre o que falta
- Prefira "comece por aqui" a "você precisa de estratégia X"
- Máximo 2 parágrafos curtos`,
      band_manager: `
## PERFIL IDENTIFICADO: INTERMEDIÁRIO
- Assuma que a pessoa já entende o básico
- Foque em organização, gargalos e oportunidades perdidas
- Dê visão de negócio: números, margens, comparações de mercado
- Aponte o que falta para profissionalizar — seja específico
- Sugira melhorias concretas no que já existe`,
      scaling_structure: `
## PERFIL IDENTIFICADO: AVANÇADO / OPERAÇÃO ESTRUTURADA
- Trate como gestor, não como artista iniciante
- Foque em escala, performance, eficiência e saúde da operação
- Use dados e métricas quando disponíveis
- Aponte gargalos que impedem crescimento
- Sugira delegação, sistemas e processos`,
      multi_artist_producer: `
## PERFIL IDENTIFICADO: ESCRITÓRIO / SELO
- Foco em gestão de roster, não artista individual
- Visão de portfólio: quais artistas estão performando, quais estão travados
- Prioridades da operação como negócio
- Pergunte sobre equipe, estrutura e metas do negócio`,
    };

    const label = stageLabels[stage] || stage;
    const instructions = stageInstructions[stage] || '';
    return `\n## CONTEXTO DO PERFIL DO USUÁRIO\nNível de maturidade: ${label}${instructions}\n`;
  } catch {
    return '';
  }
}

export async function buildUserContext(): Promise<string> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const [showsResult, releasesResult, tasksResult] = await Promise.all([
      supabase
        .from('shows')
        .select('title, show_date, city, status')
        .gte('show_date', today)
        .order('show_date', { ascending: true })
        .limit(3),
      supabase
        .from('releases')
        .select('title, release_date, status')
        .gte('release_date', today)
        .lte('release_date', in30days)
        .order('release_date', { ascending: true })
        .limit(3),
      supabase
        .from('tasks')
        .select('title, deadline, status')
        .neq('status', 'done')
        .lte('deadline', in7days)
        .order('deadline', { ascending: true })
        .limit(5)
    ]);

    const shows = showsResult.data || [];
    const releases = releasesResult.data || [];
    const tasks = tasksResult.data || [];

    const showsText = shows.length > 0
      ? shows.map(s => `"${s.title}" em ${s.city || 'local a definir'} (${s.show_date}) — ${s.status}`).join('; ')
      : 'nenhum show agendado';

    const releasesText = releases.length > 0
      ? releases.map(r => `"${r.title}" previsto para ${r.release_date} — ${r.status}`).join('; ')
      : 'nenhum lançamento nos próximos 30 dias';

    const overdueOrSoon = tasks.filter(t => t.deadline <= today);
    const tasksText = tasks.length > 0
      ? tasks.map(t => {
          const isOverdue = t.deadline < today;
          return `"${t.title}" (prazo: ${t.deadline}${isOverdue ? ' — ATRASADA' : ''})`;
        }).join('; ')
      : 'nenhuma tarefa urgente';

    const urgencyNote = overdueOrSoon.length > 0
      ? `\nATENÇÃO: ${overdueOrSoon.length} tarefa(s) com prazo hoje ou atrasada(s) — prioridade máxima.`
      : '';

    return `Próximos shows: ${showsText}
Lançamentos próximos (30 dias): ${releasesText}
Tarefas urgentes (esta semana): ${tasksText}${urgencyNote}

Com base nesse contexto, dê respostas específicas à situação real do usuário, não genéricas.`;
  } catch {
    // Se falhar, o Mentor continua funcionando sem contexto
    return '';
  }
}

export interface MentorContext {
  userRole: 'artist' | 'producer' | 'manager' | 'band';
  careerLevel: 'beginner' | 'intermediate' | 'advanced' | 'major';
  genre?: string;
  recentShows?: number;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface MentorResponse {
  message: string;
  actionSuggestions?: string[];
  relatedTopics?: string[];
  followUpQuestions?: string[];
}

/**
 * System Prompt da IA de Orientação TaskMaster
 */
export const MARCOS_MENEZES_SYSTEM_PROMPT = `Você é o Assistente de Orientação da plataforma TaskMaster — a plataforma de operações artísticas para músicos, produtores, escritórios e selos.

Você não é um chatbot genérico. Você é um orientador especializado em operações artísticas, com domínio completo de:
- Gestão de carreira musical
- Negócios e financeiro na música
- Produção musical e técnica
- Shows, turnês e booking
- Lançamentos e distribuição digital
- Marketing artístico
- Gestão de equipe e escritório

## SUA PERSONALIDADE
- Direto e prático — não enrola, vai ao ponto
- Fala como alguém que entende do negócio, não como professor
- Linguagem natural, coloquial mas profissional
- Motivador mas honesto — fala a verdade com respeito
- Celebra vitórias, por menores que sejam
- Quando o artista está no caminho errado, aponta com firmeza mas sem julgamento
- Usa expressões como "olha só", "é o seguinte", "atenção nisso", "vou ser direto"

## ESPECIALISTAS DISPONÍVEIS
Você pode atuar como diferentes especialistas conforme o contexto:
- **Gestão de Carreira**: identidade, posicionamento, crescimento, estratégia de longo prazo
- **Negócios Musicais**: cachês, splits, contratos, direitos, negociação, tributação
- **Produção Musical**: arranjos, estúdio, mix, master, setlist, material musical
- **Shows e Turnês**: logística, rider técnico, booking, segurança
- **Marketing Artístico**: branding, storytelling, conteúdo, engajamento
- **Lançamentos**: cronograma, distribuição, estratégia de lançamento
- **Financeiro**: fluxo de caixa, diversificação de renda, sustentabilidade
- **Operações de Escritório**: gestão de múltiplos artistas, equipe, processos

Identifique o contexto da conversa e adote o especialista mais adequado sem precisar anunciar isso.

## COMO VOCÊ RESPONDE

**Tamanho da resposta — depende do tipo de mensagem:**
- Saudação ou conversa casual → 1 frase, no máximo 2. Não explique, não liste.
- Pergunta simples → resposta direta em 1-2 frases. Sem enrolação.
- Pergunta de orientação ou conselho → máximo 3 parágrafos CURTOS. Não escreva blocos de texto.
- Análise ou diagnóstico → pode usar 3-5 pontos, mas curtos.

**Tom:**
- Escreva como quem manda uma mensagem no WhatsApp, não como quem redige um e-mail corporativo
- Conselhos ESPECÍFICOS e ACIONÁVEIS, nunca genéricos
- Dê números e referências concretas quando possível
- Termine com ação concreta ou próximo passo claro — mas só quando fizer sentido

**Proibido:**
- Começar resposta com "Ótimo!", "Claro!", "Com certeza!", "Entendo!", "Excelente pergunta!"
- Usar listas com bullets em respostas conversacionais simples
- Repetir o que o usuário disse antes de responder
- Escrever mais de 3 parágrafos em qualquer resposta
- Dar conselhos genéricos que servem para qualquer artista

## REDIRECIONAMENTO PARA A PLATAFORMA
Quando identificar que o assunto tem módulo específico na plataforma:
- Projeto: "Vamos criar um projeto para isso no Copilot — fica muito mais organizado"
- Arranjos/partituras: "No módulo de Produção Musical você centraliza esse material"
- Financeiro: "O módulo Financeiro te dá essa visão consolidada"
- Shows: "No módulo de Shows você organiza a logística completa"
- Lançamento: "O módulo de Lançamentos tem o checklist completo para isso"

## REGRAS
- NUNCA dê conselho jurídico ou fiscal específico — recomende um profissional
- NUNCA diga que algo é impossível — sempre mostre um caminho
- NUNCA seja condescendente
- SEMPRE respeite a autonomia do artista`;

/**
 * Categoriza o tipo de pergunta do usuário para melhor contextualização
 */
export function categorizeQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase();

  const categories: Record<string, string[]> = {
    career: ['carreira', 'posicionamento', 'identidade', 'diferenciação', 'mercado', 'oportunidade'],
    business: ['cachê', 'split', 'contrato', 'financeiro', 'ganhar', 'receita', 'lucro', 'margem', 'dinheiro', 'pagar', 'cobrar'],
    marketing: ['marketing', 'redes sociais', 'instagram', 'tiktok', 'youtube', 'engajamento', 'público', 'fãs', 'conteúdo', 'post', 'story', 'reels'],
    production: ['produção', 'estúdio', 'som', 'qualidade', 'equipamento', 'gravação', 'mix', 'master', 'arranjo', 'partitura', 'cifra'],
    shows: ['show', 'turnê', 'logística', 'viagem', 'palco', 'apresentação', 'venue', 'evento'],
    health: ['saúde', 'mental', 'burnout', 'cansaço', 'depressão', 'ansiedade', 'bem-estar', 'equilíbrio', 'stress'],
    creativity: ['criatividade', 'bloqueio', 'inspiração', 'música', 'composição', 'arranjo', 'evolução', 'letra'],
    networking: ['networking', 'parceria', 'colaboração', 'relacionamento', 'conexão', 'contato', 'feat'],
    technology: ['tecnologia', 'ia', 'plataforma', 'distribuição', 'streaming', 'app', 'ferramenta', 'spotify', 'deezer'],
    future: ['futuro', 'planejamento', 'aposentadoria', 'legado', 'longo prazo', 'visão', 'meta', 'objetivo'],
    project: ['projeto', 'lançamento', 'álbum', 'ep', 'single', 'clipe', 'videoclipe', 'release']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerQuestion.includes(keyword))) {
      return category;
    }
  }

  return 'general';
}

/**
 * Gera contexto adicional baseado na categoria da pergunta
 */
export function generateCategoryContext(category: string): string {
  const contexts: Record<string, string> = {
    career: `Foco em carreira artística: identidade, diferenciação, posicionamento único, público-alvo e como se destacar.`,
    business: `Foco em negócios musicais: sustentabilidade financeira, margens, custos, diversificação de renda e planejamento.`,
    marketing: `Foco em marketing: autenticidade, consistência, relacionamento com fãs, tendências e storytelling.`,
    production: `Foco em produção musical: qualidade técnica, investimento em equipamento, parcerias criativas e evolução sonora.`,
    shows: `Foco em shows e turnês: planejamento logístico, saúde da equipe, segurança e experiência do público.`,
    health: `Foco em saúde e bem-estar: saúde mental, equilíbrio vida-trabalho e sustentabilidade da carreira.`,
    creativity: `Foco em criatividade: bloqueios criativos, inspiração, evolução sonora e autenticidade artística.`,
    networking: `Foco em relacionamentos profissionais: conexões genuínas, colaborações estratégicas e valor mútuo.`,
    technology: `Foco em tecnologia: eficiência operacional, automação, dados e como a tecnologia serve a visão artística.`,
    future: `Foco em planejamento de longo prazo: visão de 5-10 anos, diversificação de renda e legado artístico.`,
    project: `Foco em gestão de projetos: organização, etapas, responsabilidades, prazos e qualidade de entrega.`,
    general: `Estou aqui para ajudar com qualquer aspecto da sua carreira artística.`
  };

  return contexts[category] || contexts.general;
}

/**
 * Gera sugestões de ações baseadas na categoria
 */
export function generateActionSuggestions(category: string): string[] {
  const suggestions: Record<string, string[]> = {
    career: [
      'Defina sua identidade artística em 3 palavras-chave',
      'Analise seus 3 maiores concorrentes diretos',
      'Crie um posicionamento único no mercado'
    ],
    business: [
      'Revise seus últimos 5 cachês e margens',
      'Use o módulo Financeiro para controlar receitas e despesas',
      'Negocie melhores termos em seus próximos shows'
    ],
    marketing: [
      'Use o módulo de Marketing para planejar conteúdo das próximas 2 semanas',
      'Analise qual tipo de conteúdo gera mais engajamento',
      'Crie uma estratégia de hashtags e tendências'
    ],
    production: [
      'Abra o módulo de Produção Musical para organizar seus arranjos',
      'Procure um produtor ou engenheiro para colaboração',
      'Estude novos arranjos ou técnicas de produção'
    ],
    shows: [
      'Planeje uma mini-turnê em 3 cidades próximas',
      'Use a Agenda para organizar datas e logística',
      'Documente o RoadMap detalhado do próximo show'
    ],
    health: [
      'Estabeleça uma rotina de exercícios e meditação',
      'Converse com um terapeuta ou coach',
      'Crie limites saudáveis entre trabalho e vida pessoal'
    ],
    creativity: [
      'Experimente um novo estilo ou gênero',
      'Colabore com outro artista para trazer perspectivas novas',
      'Use o módulo de Produção Musical para experimentar arranjos'
    ],
    networking: [
      'Identifique 5 pessoas-chave para conectar',
      'Organize um café ou reunião com potenciais parceiros',
      'Participe de eventos da indústria musical'
    ],
    technology: [
      'Explore as ferramentas do TaskMaster para otimizar sua gestão',
      'Implemente um sistema de CRM para gerenciar contatos',
      'Aprenda a usar IA para acelerar sua produção'
    ],
    future: [
      'Crie uma visão de 5 anos para sua carreira',
      'Defina metas anuais e trimestrais',
      'Diversifique suas fontes de renda'
    ],
    project: [
      'Use a Gestão de Projetos para organizar todas as etapas',
      'Defina responsáveis e prazos para cada tarefa',
      'Acompanhe o progresso no Dashboard'
    ]
  };

  return suggestions[category] || [];
}

/**
 * Gera tópicos relacionados para continuar a conversa
 */
export function generateRelatedTopics(category: string): string[] {
  const topics: Record<string, string[]> = {
    career: ['Posicionamento no mercado', 'Diferenciação artística', 'Público-alvo', 'Tendências'],
    business: ['Cashflow', 'Tributação', 'Diversificação de renda', 'Investimentos'],
    marketing: ['Branding', 'Storytelling', 'Comunidade', 'Parcerias'],
    production: ['Qualidade de som', 'Parcerias criativas', 'Estúdio', 'Arranjos'],
    shows: ['Segurança', 'Experiência do público', 'Equipe', 'Sustentabilidade'],
    health: ['Saúde mental', 'Equilíbrio', 'Relacionamentos', 'Sustentabilidade'],
    creativity: ['Inspiração', 'Evolução sonora', 'Colaborações', 'Experimentação'],
    networking: ['Parcerias', 'Mentoria', 'Comunidade', 'Oportunidades'],
    technology: ['Automação', 'Dados', 'Plataformas', 'IA'],
    future: ['Legado', 'Aposentadoria', 'Diversificação', 'Impacto'],
    project: ['Planejamento', 'Prazos', 'Equipe', 'Qualidade']
  };

  return topics[category] || [];
}

/**
 * Gera resposta do Marcos Menezes via OpenAI API
 */
export async function generateMentorResponse(
  userQuestion: string,
  context?: MentorContext
): Promise<MentorResponse> {
  const category = categorizeQuestion(userQuestion);

  try {
    const historyMessages = (context?.conversationHistory || []).slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    const contextInfo = context ? `\n\nContexto do artista: Nível ${context.careerLevel}, Função: ${context.userRole}${context.genre ? `, Gênero: ${context.genre}` : ''}${context.recentShows ? `, Shows recentes: ${context.recentShows}` : ''}` : '';

    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: MARCOS_MENEZES_SYSTEM_PROMPT + buildMaturityContext() + contextInfo },
          ...historyMessages,
          { role: 'user', content: userQuestion }
        ],
        temperature: 0.85,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      return generateLocalResponse(userQuestion, category);
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content || '';

    return {
      message,
      actionSuggestions: generateActionSuggestions(category),
      relatedTopics: generateRelatedTopics(category),
      followUpQuestions: [
        'Quer que eu aprofunde mais nesse assunto?',
        'Posso te ajudar com algo específico?',
        'Qual é o próximo passo que você quer dar?'
      ]
    };
  } catch (error) {
    return generateLocalResponse(userQuestion, category);
  }
}

/**
 * Fallback: Gera resposta local quando a API não está disponível
 */
function generateLocalResponse(userQuestion: string, category: string): MentorResponse {
  const responses: Record<string, string> = {
    career: `É o seguinte — sua identidade artística é o seu maior ativo. Não é só sobre o som, é sobre a história que você conta, a energia que você traz e o valor que você entrega pro seu público.

Vou te falar uma coisa: os artistas que mais crescem são os que sabem exatamente quem são e pra quem fazem música. Não tenta agradar todo mundo — escolhe seu nicho e domina ele.

Qual é o seu maior diferencial artístico neste momento? O que você faz que ninguém mais faz do mesmo jeito?`,

    business: `Olha só, muitos artistas deixam dinheiro na mesa por não entenderem seus números. Você precisa saber exatamente quanto entra, quanto sai, e qual é sua margem real.

Presta atenção nisso: use o módulo Financeiro da plataforma para registrar tudo — cachês, despesas, splits. Quando você tem clareza dos números, negocia melhor e toma decisões mais inteligentes.

Você tem controle claro dos seus números atualmente? Se não, vamos resolver isso agora.`,

    marketing: `Vou te falar uma coisa sobre marketing musical: o segredo não é estar em todas as plataformas, é ser consistente e autêntico onde você está. Seu público quer conhecer VOCÊ, não só sua música.

Minha recomendação: use o módulo de Marketing para planejar seu conteúdo das próximas 2 semanas. Alterne entre bastidores, música, vida pessoal e interação com fãs.

Qual tipo de conteúdo seu público mais engaja?`,

    production: `Sobre produção musical — a qualidade do seu som é um reflexo do seu profissionalismo. Não precisa ser perfeito, mas precisa ser consistente e representar sua visão artística.

Abre o módulo de Produção Musical e começa a organizar seus arranjos lá dentro. Ter tudo documentado — cifras, partituras, instrumentação — faz toda a diferença quando você vai pro estúdio.

Qual é o seu maior desafio de produção neste momento?`,

    shows: `Cada show é uma oportunidade de criar memórias, conectar com o público e gerar receita. Mas isso só funciona bem com planejamento.

Usa a Agenda da plataforma para organizar datas, e o módulo de Projetos para detalhar a logística de cada show. Rider técnico, transporte, hospedagem — tudo documentado.

Qual é o seu maior desafio com shows e turnês?`,

    health: `Presta atenção nisso — sua saúde é o alicerce de tudo. Muitos artistas negligenciam isso e acabam queimados. Sua melhor arte vem quando você está bem — mental, emocional e fisicamente.

Isso não é luxo, é necessidade profissional. Estabeleça limites, tenha uma rotina, e não tenha vergonha de pedir ajuda quando precisar.

Como você está se sentindo em relação ao seu bem-estar neste momento?`,

    creativity: `Bloqueios criativos são normais e passageiros. Todo artista passa por isso. O importante é ter estratégias para superar — pode ser colaboração, mudança de ambiente, descanso, ou experimentação.

Abre o módulo de Produção Musical e tenta escrever algo diferente do que você normalmente faz. Às vezes sair da zona de conforto destrava tudo.

O que está afetando sua criatividade neste momento?`,

    networking: `Sua rede profissional é um dos seus maiores ativos. Pessoas que acreditam em você, que podem abrir portas, que podem colaborar. Invista em relacionamentos genuínos.

Não é sobre quantidade, é sobre qualidade. Identifique 5 pessoas-chave que podem impactar sua carreira e construa relacionamento real com elas.

Quem são as pessoas-chave que você gostaria de conectar?`,

    technology: `Tecnologia é ferramenta, não é fim em si mesma. Use o que faz sentido para você e sua carreira. A plataforma TaskMaster já tem tudo que você precisa para organizar sua gestão.

Explore os módulos — Projetos, Financeiro, Marketing, Produção Musical, Agenda. Tudo integrado para você não precisar sair da plataforma.

Qual é a maior dificuldade que a tecnologia poderia resolver pra você?`,

    future: `Pensar no futuro é sábio. Muitos artistas vivem o presente sem pensar no amanhã. Mas planejamento não mata a criatividade — na verdade, liberta você para ser mais criativo porque tem segurança.

Crie uma visão de 5 anos: onde quer estar, quanto quer ganhar, que tipo de projetos quer fazer. Depois quebre isso em metas anuais e trimestrais.

Qual é sua visão para sua carreira nos próximos 5 anos?`,

    project: `Organização de projeto é fundamental. Cada lançamento, cada show, cada campanha precisa ser tratado como um projeto com etapas, responsáveis e prazos.

Usa o módulo de Gestão de Projetos para criar seu projeto, dividir em tarefas e acompanhar o progresso. Isso muda completamente a qualidade da sua entrega.

Qual projeto você está trabalhando agora?`,

    general: `É o seguinte — estou aqui para te ajudar com qualquer aspecto da sua carreira artística. Desde o lado criativo até o comercial, desde shows até saúde mental.

A plataforma TaskMaster tem tudo que você precisa: Gestão de Projetos, Produção Musical, Financeiro, Marketing, Agenda e muito mais. Tudo integrado.

O que você gostaria de explorar comigo?`
  };

  const message = responses[category] || responses.general;

  return {
    message,
    actionSuggestions: generateActionSuggestions(category),
    relatedTopics: generateRelatedTopics(category),
    followUpQuestions: [
      'Quer que eu aprofunde mais nesse assunto?',
      'Posso te ajudar com algo específico?',
      'Qual é o próximo passo que você quer dar?'
    ]
  };
}

/**
 * Valida se a pergunta é apropriada para o Marcos Menezes
 */
export function isValidQuestion(question: string): boolean {
  if (question.trim().length < 3) return false;
  const bannedWords = ['spam', 'scam', 'xxx'];
  if (bannedWords.some(word => question.toLowerCase().includes(word))) return false;
  return true;
}
