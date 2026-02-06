/**
 * Serviço de IA para o Mentor FlexMax (Marcos Menezes)
 * Fornece consultoria 360° sobre carreira artística, negócios e vida pessoal
 * 
 * Este serviço integra-se com OpenAI para fornecer respostas humanizadas e contextualizadas
 */

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
 * System Prompt para o Marcos Menezes
 * Define a personalidade, expertise e abordagem do mentor
 */
export const MARCOS_MENEZES_SYSTEM_PROMPT = `Você é Marcos Menezes, um mentor e conselheiro experiente na indústria musical brasileira e internacional. Você é especialista em:

- Gestão de carreira artística (artistas solo, bandas, produtores)
- Negócios musicais (contratos, cachês, splits, direitos autorais)
- Estratégia de marketing e engajamento de público
- Logística de shows e turnês
- Saúde mental e bem-estar de artistas
- Tendências de mercado e oportunidades
- Criatividade e desenvolvimento artístico
- Relacionamentos profissionais e networking

PERSONALIDADE E TOM:
- Você é amigável, acessível e humanizado, mas profissional
- Você fala em português brasileiro de forma natural e coloquial
- Você é proativo, oferecendo insights antes de ser perguntado
- Você celebra sucessos e oferece suporte em dificuldades
- Você é honesto e direto, sem ser duro ou desanimador
- Você sempre busca entender o contexto completo antes de aconselhar

ABORDAGEM:
- Você faz perguntas para entender melhor a situação
- Você oferece múltiplas perspectivas e opções
- Você conecta diferentes áreas (ex: financeiro com criatividade)
- Você usa exemplos reais de artistas e situações
- Você fornece ações concretas e passos próximos
- Você acompanha o progresso e ajusta recomendações

TÓPICOS QUE VOCÊ COBRE:
1. CARREIRA E POSICIONAMENTO: Identidade artística, diferenciação, posicionamento no mercado
2. NEGÓCIOS: Cachês, splits, contratos, direitos, tributação
3. MARKETING: Estratégia de conteúdo, redes sociais, engajamento, branding
4. PRODUÇÃO: Qualidade de som, estúdio, equipamento, parcerias criativas
5. SHOWS E TURNÊS: Planejamento, logística, segurança, saúde da equipe
6. SAÚDE E BEM-ESTAR: Burnout, saúde mental, relacionamentos, equilíbrio
7. CRIATIVIDADE: Bloqueios criativos, inspiração, evolução artística
8. NETWORKING: Relacionamentos, parcerias, colaborações
9. TECNOLOGIA: Plataformas, ferramentas, IA, distribuição digital
10. FUTURO: Planejamento de longo prazo, aposentadoria, legado

REGRAS IMPORTANTES:
- Você NUNCA dá conselhos legais ou fiscais específicos (recomenda profissionais)
- Você NUNCA desanima ou diz que algo é impossível
- Você SEMPRE oferece esperança e caminhos alternativos
- Você SEMPRE respeita a autonomia e decisões do artista
- Você SEMPRE celebra pequenas vitórias
- Você NUNCA é condescendente ou fala "de cima para baixo"

FORMATO DE RESPOSTA:
- Responda de forma conversacional e natural
- Use parágrafos curtos e fáceis de ler
- Ofereça ações concretas quando possível
- Termine com uma pergunta para continuar a conversa
- Seja conciso mas completo (máximo 3-4 parágrafos)

Você é o Marcos Menezes. Bem-vindo à conversa!`;

/**
 * Categoriza o tipo de pergunta do usuário para melhor contextualização
 */
export function categorizeQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase();

  const categories: Record<string, string[]> = {
    career: ['carreira', 'posicionamento', 'identidade', 'diferenciação', 'mercado', 'oportunidade'],
    business: ['cachê', 'split', 'contrato', 'financeiro', 'ganhar', 'receita', 'lucro', 'margem'],
    marketing: ['marketing', 'redes sociais', 'instagram', 'tiktok', 'youtube', 'engajamento', 'público', 'fãs', 'conteúdo'],
    production: ['produção', 'estúdio', 'som', 'qualidade', 'equipamento', 'gravação', 'mix', 'master'],
    shows: ['show', 'turnê', 'logística', 'viagem', 'palco', 'apresentação', 'público', 'venue'],
    health: ['saúde', 'mental', 'burnout', 'cansaço', 'depressão', 'ansiedade', 'bem-estar', 'equilíbrio'],
    creativity: ['criatividade', 'bloqueio', 'inspiração', 'música', 'composição', 'arranjo', 'evolução'],
    networking: ['networking', 'parceria', 'colaboração', 'relacionamento', 'conexão', 'contato'],
    technology: ['tecnologia', 'ia', 'plataforma', 'distribuição', 'streaming', 'app', 'ferramenta'],
    future: ['futuro', 'planejamento', 'aposentadoria', 'legado', 'longo prazo', 'visão']
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
    career: `Você está falando sobre carreira artística. Considere: identidade artística, diferenciação no mercado, 
    posicionamento único, público-alvo, e como se destacar em um mercado competitivo.`,
    
    business: `Você está falando sobre negócios musicais. Considere: sustentabilidade financeira, 
    margens de lucro, custos operacionais, diversificação de renda, e planejamento financeiro.`,
    
    marketing: `Você está falando sobre marketing e engajamento. Considere: autenticidade, consistência, 
    relacionamento com fãs, tendências de plataformas, e storytelling.`,
    
    production: `Você está falando sobre produção musical. Considere: qualidade técnica, investimento em equipamento, 
    parcerias criativas, e evolução sonora.`,
    
    shows: `Você está falando sobre shows e turnês. Considere: planejamento logístico, saúde da equipe, 
    segurança, experiência do público, e sustentabilidade da turnê.`,
    
    health: `Você está falando sobre saúde e bem-estar. Considere: saúde mental, equilíbrio vida-trabalho, 
    relacionamentos, e sustentabilidade da carreira a longo prazo.`,
    
    creativity: `Você está falando sobre criatividade e desenvolvimento artístico. Considere: bloqueios criativos, 
    inspiração, evolução sonora, e autenticidade artística.`,
    
    networking: `Você está falando sobre relacionamentos profissionais. Considere: construção de relacionamentos genuínos, 
    colaborações estratégicas, e valor mútuo.`,
    
    technology: `Você está falando sobre tecnologia e ferramentas. Considere: eficiência operacional, 
    automação, dados, e como a tecnologia serve sua visão artística.`,
    
    future: `Você está falando sobre planejamento de longo prazo. Considere: visão de 5-10 anos, 
    diversificação de renda, e legado artístico.`,
    
    general: `Você está fazendo uma pergunta geral. Estou aqui para ajudar com qualquer aspecto da sua carreira artística.`
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
      'Crie uma projeção financeira de 12 meses',
      'Negocie melhores termos em seus próximos shows'
    ],
    marketing: [
      'Planeje conteúdo para as próximas 2 semanas',
      'Analise qual tipo de conteúdo gera mais engajamento',
      'Crie uma estratégia de hashtags e tendências'
    ],
    production: [
      'Invista em um equipamento que melhore sua qualidade',
      'Procure um produtor ou engenheiro para colaboração',
      'Estude novos arranjos ou técnicas de produção'
    ],
    shows: [
      'Planeje uma mini-turnê em 3 cidades próximas',
      'Crie um checklist completo de logística',
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
      'Faça um retiro criativo para se reconectar com a música'
    ],
    networking: [
      'Identifique 5 pessoas-chave para conectar',
      'Organize um café ou reunião com potenciais parceiros',
      'Participe de eventos da indústria musical'
    ],
    technology: [
      'Explore ferramentas de automação para seu marketing',
      'Implemente um sistema de CRM para gerenciar contatos',
      'Aprenda a usar IA para acelerar sua produção'
    ],
    future: [
      'Crie uma visão de 5 anos para sua carreira',
      'Defina metas anuais e trimestrais',
      'Diversifique suas fontes de renda'
    ]
  };

  return suggestions[category] || suggestions.general || [];
}

/**
 * Gera tópicos relacionados para continuar a conversa
 */
export function generateRelatedTopics(category: string): string[] {
  const topics: Record<string, string[]> = {
    career: ['Posicionamento no mercado', 'Diferenciação artística', 'Público-alvo', 'Tendências'],
    business: ['Cashflow', 'Tributação', 'Diversificação de renda', 'Investimentos'],
    marketing: ['Branding', 'Storytelling', 'Comunidade', 'Parcerias'],
    production: ['Qualidade de som', 'Parcerias criativas', 'Estúdio', 'Equipamento'],
    shows: ['Segurança', 'Experiência do público', 'Equipe', 'Sustentabilidade'],
    health: ['Saúde mental', 'Equilíbrio', 'Relacionamentos', 'Sustentabilidade'],
    creativity: ['Inspiração', 'Evolução sonora', 'Colaborações', 'Experimentação'],
    networking: ['Parcerias', 'Mentoria', 'Comunidade', 'Oportunidades'],
    technology: ['Automação', 'Dados', 'Plataformas', 'IA'],
    future: ['Legado', 'Aposentadoria', 'Diversificação', 'Impacto']
  };

  return topics[category] || [];
}

/**
 * Simula resposta do Marcos Menezes baseada na categoria e contexto
 * Em produção, isso seria uma chamada à API OpenAI
 */
export async function generateMentorResponse(
  userQuestion: string,
  context?: MentorContext
): Promise<MentorResponse> {
  // Categorizar a pergunta
  const category = categorizeQuestion(userQuestion);
  const categoryContext = generateCategoryContext(category);

  // Simular delay de resposta (em produção seria a latência da API)
  await new Promise(resolve => setTimeout(resolve, 800));

  // Gerar resposta baseada em padrões
  const responses: Record<string, string> = {
    career: `Ótima pergunta sobre carreira! ${categoryContext} 

A verdade é que sua identidade artística é o seu maior ativo. Recomendo que você invista tempo em entender o que torna você único — não é apenas o som, mas a história, a energia e o valor que você traz.

Qual é o seu maior diferencial artístico neste momento? O que você faz que ninguém mais faz exatamente do mesmo jeito?`,

    business: `Entendo sua preocupação com o lado financeiro. ${categoryContext}

A realidade é que muitos artistas deixam dinheiro na mesa por não negociarem bem ou não entenderem seus números. Recomendo que você sempre saiba exatamente quanto está ganhando, quanto está gastando, e qual é sua margem real.

Você tem um controle claro dos seus números atualmente?`,

    marketing: `Excelente foco em marketing! ${categoryContext}

O segredo não é apenas estar em todas as plataformas, mas ser consistente, autêntico e estratégico. Seu público quer conhecer você, não apenas sua música. Compartilhe sua jornada, seus desafios, suas vitórias.

Qual é o tipo de conteúdo que você mais gosta de criar?`,

    production: `Ótimo interesse em produção! ${categoryContext}

A qualidade do seu som é um reflexo do seu profissionalismo. Não precisa ser perfeito, mas precisa ser consistente e representar sua visão artística. Considere investir em melhorias gradualmente.

Qual é o seu maior desafio de produção neste momento?`,

    shows: `Ótimo pensar em shows! ${categoryContext}

Cada show é uma oportunidade de criar memórias, conectar com o público e gerar receita. Mas isso só funciona bem com planejamento cuidadoso. Logística bem feita = equipe feliz = melhor performance.

Qual é o seu maior desafio com shows e turnês?`,

    health: `Sua saúde é fundamental. ${categoryContext}

Muitos artistas negligenciam isso e acabam queimados. A verdade é que sua melhor arte vem quando você está bem — mental, emocional e fisicamente. Isso não é luxo, é necessidade.

Como você está se sentindo em relação ao seu bem-estar neste momento?`,

    creativity: `Criatividade é o coração da sua carreira! ${categoryContext}

Bloqueios criativos são normais e passageiros. O importante é ter estratégias para superá-los — pode ser colaboração, mudança de ambiente, descanso, ou experimentação.

O que está afetando sua criatividade neste momento?`,

    networking: `Relacionamentos são ouro! ${categoryContext}

Sua rede profissional é um dos seus maiores ativos. Pessoas que acreditam em você, que podem abrir portas, que podem colaborar. Invista em relacionamentos genuínos.

Quem são as pessoas-chave que você gostaria de conectar?`,

    technology: `Tecnologia é uma ferramenta poderosa! ${categoryContext}

Não é sobre usar tudo, mas usar o que faz sentido para você e sua carreira. IA, automação, dados — tudo pode ajudar, mas sempre a serviço da sua visão artística.

Qual é a maior dificuldade que você enfrenta que a tecnologia poderia resolver?`,

    future: `Pensar no futuro é sábio! ${categoryContext}

Muitos artistas vivem o presente sem pensar no amanhã. Mas planejamento não mata a criatividade — na verdade, liberta você para ser mais criativo porque você tem segurança.

Qual é sua visão para sua carreira nos próximos 5 anos?`,

    general: `Ótima pergunta! Estou aqui para ajudar com qualquer aspecto da sua carreira artística — desde o lado criativo até o lado comercial, desde shows até saúde mental.

O que você gostaria de explorar comigo?`
  };

  const message = responses[category] || responses.general;

  return {
    message,
    actionSuggestions: generateActionSuggestions(category),
    relatedTopics: generateRelatedTopics(category),
    followUpQuestions: [
      'Quer explorar mais sobre isso?',
      'Posso ajudar com algo específico?',
      'Qual é o seu próximo passo?'
    ]
  };
}

/**
 * Valida se a pergunta é apropriada para o Marcos Menezes
 */
export function isValidQuestion(question: string): boolean {
  // Rejeitar perguntas muito curtas
  if (question.trim().length < 5) return false;

  // Rejeitar spam ou conteúdo inapropriado
  const bannedWords = ['spam', 'scam', 'xxx'];
  if (bannedWords.some(word => question.toLowerCase().includes(word))) return false;

  return true;
}
