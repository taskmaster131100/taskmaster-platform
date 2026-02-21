// AI Marketing Service - usa proxy do servidor

export interface MarketingStrategyRequest {
  artistName: string;
  genre: string;
  eventType: 'show' | 'release' | 'tour';
  details: string;
}

export interface MarketingContent {
  scripts: {
    reels: string[];
    stories: string[];
  };
  captions: string[];
  strategy: string;
}

// === NOVO: Tipos para gerador de conteúdo expandido ===
export type ContentType = 'caption' | 'stories' | 'reels' | 'hashtags' | 'bio' | 'strategy';

export interface ContentGenerationRequest {
  type: ContentType;
  context: string;
  platform?: string;
  tone?: string;
}

export const CONTENT_TYPES: { value: ContentType; label: string; icon: string; description: string }[] = [
  { value: 'caption', label: 'Legendas', icon: '📝', description: 'Legendas prontas para Instagram, Facebook, TikTok' },
  { value: 'stories', label: 'Stories', icon: '📱', description: 'Roteiros e ideias para stories engajantes' },
  { value: 'reels', label: 'Reels/TikTok', icon: '🎬', description: 'Roteiros criativos para vídeos curtos' },
  { value: 'hashtags', label: 'Hashtags', icon: '#️⃣', description: 'Lista de hashtags estratégicas para alcance' },
  { value: 'bio', label: 'Bio', icon: '✨', description: 'Bio profissional e impactante para perfis' },
  { value: 'strategy', label: 'Estratégia', icon: '🎯', description: 'Plano estratégico de marketing digital' },
];

const CONTENT_PROMPTS: Record<ContentType, string> = {
  caption: 'Gere 3-5 legendas profissionais e criativas prontas para postar. Cada legenda deve ter um gancho forte, corpo envolvente e call-to-action. Inclua emojis estratégicos.',
  stories: 'Crie um roteiro de 5-7 stories sequenciais que criem expectativa e engajamento. Para cada story, descreva: tipo (texto/foto/vídeo/enquete/quiz), conteúdo visual, texto/legenda, e stickers/interações sugeridas.',
  reels: 'Crie 2-3 roteiros detalhados para Reels/TikTok virais. Para cada roteiro inclua: hook dos primeiros 3 segundos, cenas/transições, texto na tela, áudio/música sugerida, e call-to-action final.',
  hashtags: 'Gere uma lista de 25-30 hashtags estratégicas organizadas em 3 categorias: alta competição (alcance), média competição (nicho), e baixa competição (específicas). Inclua hashtags em português e inglês.',
  bio: 'Escreva 3 versões de bio profissional e impactante para perfil de artista musical. Cada versão com estilo diferente: formal/profissional, casual/criativa, e minimalista. Máximo 150 caracteres cada.',
  strategy: 'Desenvolva uma estratégia completa de marketing digital com: análise de posicionamento, calendário de conteúdo semanal, táticas de crescimento orgânico, estratégia de engajamento, e métricas de acompanhamento.',
};

export async function generateContent(request: ContentGenerationRequest): Promise<string> {
  const systemPrompt = `Você é um especialista em marketing musical digital com vasta experiência em redes sociais, branding de artistas e estratégias de crescimento orgânico. Responda em português brasileiro de forma criativa e profissional. Sempre dê conteúdo PRONTO PARA USAR, não genérico.${request.platform ? ` Plataforma alvo: ${request.platform}.` : ''}${request.tone ? ` Tom desejado: ${request.tone}.` : ''}`;

  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${CONTENT_PROMPTS[request.type]}. Contexto: ${request.context}` }
        ],
        temperature: 0.8,
        max_tokens: 1500
      })
    });

    if (!response.ok) throw new Error(`AI API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'Conteúdo não gerado. Tente novamente.';
  } catch (error) {
    console.error('Erro no gerador de conteúdo IA:', error);
    throw new Error('Não foi possível gerar o conteúdo no momento. Verifique sua conexão e tente novamente.');
  }
}

// === Função original mantida ===
export async function generateMarketingStrategy(request: MarketingStrategyRequest): Promise<MarketingContent> {
  const prompt = `
    Você é um especialista em marketing musical de alto nível. 
    Crie uma estratégia de conteúdo para o artista "${request.artistName}" (Gênero: ${request.genre}).
    O objetivo é promover um(a) ${request.eventType}: ${request.details}.

    Por favor, forneça:
    1. 2 Roteiros criativos para Reels/TikTok (focados em engajamento e viralização).
    2. 3 Sugestões de Stories para criar expectativa.
    3. 2 Legendas profissionais para posts no Feed (Instagram/Facebook).
    4. Uma breve estratégia de "guerrilha" para os dias que antecedem o evento.

    Responda em formato JSON estruturado:
    {
      "scripts": {
        "reels": ["roteiro 1", "roteiro 2"],
        "stories": ["ideia 1", "ideia 2", "ideia 3"]
      },
      "captions": ["legenda 1", "legenda 2"],
      "strategy": "descrição da estratégia"
    }
  `;

  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Você é um assistente de marketing musical que fala português brasileiro. Responda apenas com o JSON solicitado.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) throw new Error('Falha ao gerar conteúdo de marketing');

    // Remove markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanContent) as MarketingContent;
  } catch (error) {
    console.error('Erro na IA de Marketing:', error);
    throw new Error('Não foi possível gerar a estratégia de marketing no momento.');
  }
}

// === NOVO: Análise financeira IA ===
export async function analyzeFinances(transactions: any[], summary: { totalRevenue: number; totalExpenses: number; balance: number }): Promise<string> {
  if (!transactions.length) {
    return 'Você ainda não tem transações registradas. Comece a registrar suas receitas e despesas para receber insights personalizados sobre sua saúde financeira.';
  }

  const txSummary = transactions.slice(0, 50).map(t =>
    `${t.type === 'revenue' ? '+' : '-'}R$${t.amount} | ${t.category} | ${t.description} | ${t.transaction_date}`
  ).join('\n');

  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'Você é o Marcos Menezes, consultor financeiro especializado na indústria musical. Analise as finanças do artista e dê insights PRÁTICOS e ACIONÁVEIS. Fale em português brasileiro, de forma direta e estratégica. Use emojis com moderação para destacar pontos importantes.' },
          { role: 'user', content: `Analise minhas finanças:\n\nResumo:\n- Receitas totais: R$${summary.totalRevenue}\n- Despesas totais: R$${summary.totalExpenses}\n- Saldo: R$${summary.balance}\n- Total de transações: ${transactions.length}\n\nÚltimas transações:\n${txSummary}\n\nDê insights sobre:\n1. Saúde financeira geral\n2. Padrões de gastos\n3. Oportunidades de economia\n4. Sugestões para aumentar receita\n5. Próximos passos recomendados` }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) throw new Error(`AI API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'Análise não disponível no momento.';
  } catch (error) {
    console.error('Erro na análise financeira IA:', error);
    throw new Error('Não foi possível gerar a análise financeira no momento.');
  }
}
