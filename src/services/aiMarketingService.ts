import { OpenAI } from 'openai';

// O cliente OpenAI já vem pré-configurado no ambiente Manus
const client = new OpenAI();

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
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "Você é um assistente de marketing musical que fala português brasileiro. Responda apenas com o JSON solicitado." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('Falha ao gerar conteúdo de marketing');

    return JSON.parse(content) as MarketingContent;
  } catch (error) {
    console.error('Erro na IA de Marketing:', error);
    throw new Error('Não foi possível gerar a estratégia de marketing no momento.');
  }
}
