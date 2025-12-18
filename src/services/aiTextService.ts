import { supabase } from '../lib/supabase';

export interface AIGeneration {
  id: string;
  generation_type: GenerationType;
  prompt: string;
  result: string;
  model: string;
  context: Record<string, any>;
  created_by: string;
  created_at: string;
}

export type GenerationType =
  | 'copywriting'
  | 'press_release'
  | 'bio'
  | 'script'
  | 'email'
  | 'strategy';

export const GENERATION_TYPES: { value: GenerationType; label: string; description: string }[] = [
  {
    value: 'copywriting',
    label: 'Copywriting',
    description: 'Posts para redes sociais, anúncios e captions'
  },
  {
    value: 'press_release',
    label: 'Press Release',
    description: 'Comunicados de imprensa para lançamentos'
  },
  {
    value: 'bio',
    label: 'Bio de Artista',
    description: 'Biografias profissionais para artistas'
  },
  {
    value: 'script',
    label: 'Scripts',
    description: 'Roteiros para vídeos e podcasts'
  },
  {
    value: 'email',
    label: 'Email Marketing',
    description: 'Campanhas de email e newsletters'
  },
  {
    value: 'strategy',
    label: 'Estratégia',
    description: 'Planejamento estratégico e análise'
  }
];

interface GenerateTextParams {
  type: GenerationType;
  prompt: string;
  context?: Record<string, any>;
}

const SYSTEM_PROMPTS: Record<GenerationType, string> = {
  copywriting: `Você é um copywriter profissional especializado em conteúdo para a indústria musical.
Crie textos persuasivos, criativos e otimizados para redes sociais.
Use linguagem envolvente, emojis quando apropriado, e inclua calls-to-action efetivos.
Mantenha o tom adequado ao público e plataforma.`,

  press_release: `Você é um especialista em comunicação e relações públicas para a indústria musical.
Escreva press releases profissionais, objetivos e informativos.
Siga a estrutura: título impactante, lead (quem, o quê, quando, onde, por quê), corpo com detalhes, informações de contato.
Use linguagem formal e jornalística.`,

  bio: `Você é um biógrafo profissional especializado em artistas musicais.
Escreva biografias cativantes que contam a história do artista de forma envolvente.
Destaque conquistas, estilo musical, influências e momentos marcantes.
Adapte o tom conforme o contexto (formal para imprensa, mais casual para redes sociais).`,

  script: `Você é um roteirista criativo especializado em conteúdo audiovisual musical.
Crie roteiros estruturados com introdução, desenvolvimento e conclusão.
Inclua indicações de cena, diálogos naturais e transições suaves.
Pense em storytelling visual e engajamento do público.`,

  email: `Você é um especialista em email marketing para a indústria musical.
Escreva emails persuasivos com assuntos chamativos.
Use estrutura clara: saudação personalizada, mensagem principal, call-to-action, encerramento.
Mantenha tom amigável mas profissional.`,

  strategy: `Você é um estrategista de marketing musical com vasta experiência.
Desenvolva estratégias detalhadas, viáveis e orientadas a resultados.
Inclua análise de contexto, objetivos claros, táticas específicas, métricas e timeline.
Use frameworks reconhecidos e melhores práticas do mercado.`
};

export async function generateText({
  type,
  prompt,
  context = {}
}: GenerateTextParams): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return generateMockText(type, prompt);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPTS[type]
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating text:', error);
    return generateMockText(type, prompt);
  }
}

function generateMockText(type: GenerationType, prompt: string): string {
  const mocks: Record<GenerationType, string> = {
    copywriting: `🎵 [Título Impactante]

${prompt}

✨ Transforme sua paixão em realidade musical!

📍 Acesse agora e descubra mais
🔔 Ative as notificações para não perder nada

#Música #Arte #Cultura #NovoLançamento`,

    press_release: `PARA DIVULGAÇÃO IMEDIATA

[${new Date().toLocaleDateString('pt-BR')}]

${prompt}

O lançamento representa um marco importante na carreira do artista, trazendo uma proposta inovadora que promete conquistar o público.

Para mais informações:
Contato: [email/telefone]
Website: [url]

###`,

    bio: `${prompt}

Com uma trajetória marcada pela autenticidade e inovação, o artista vem construindo uma carreira sólida na indústria musical. Seu trabalho reflete influências diversas e uma visão única que ressoa com públicos de diferentes gerações.

Principais conquistas e projetos recentes demonstram o comprometimento com a excelência artística e a conexão genuína com os fãs.`,

    script: `[ABERTURA]
${prompt}

[DESENVOLVIMENTO]
[Cena 1 - Apresentação]
- Apresentação do tema principal
- Estabelecimento do contexto

[Cena 2 - Conteúdo]
- Desenvolvimento da narrativa
- Pontos-chave e mensagens

[ENCERRAMENTO]
- Conclusão impactante
- Call-to-action
- Créditos

[FIM]`,

    email: `Assunto: ${prompt.split('\n')[0] || 'Novidades Musicais'}

Olá!

${prompt}

Ficamos felizes em compartilhar essas novidades com você. Sua jornada musical está prestes a ficar ainda mais especial!

Clique aqui para saber mais: [LINK]

Até breve,
Equipe TaskMaster`,

    strategy: `ESTRATÉGIA: ${prompt}

1. ANÁLISE DE CONTEXTO
- Situação atual e oportunidades identificadas
- Público-alvo e segmentação

2. OBJETIVOS
- Objetivo principal: [definir meta SMART]
- Objetivos secundários

3. TÁTICAS E AÇÕES
- Fase 1: Preparação (semanas 1-2)
- Fase 2: Execução (semanas 3-6)
- Fase 3: Otimização (semanas 7-8)

4. MÉTRICAS DE SUCESSO
- KPIs principais
- Ferramentas de acompanhamento

5. RECURSOS NECESSÁRIOS
- Equipe e responsabilidades
- Orçamento estimado

6. CRONOGRAMA
- Timeline detalhado com marcos principais`
  };

  return mocks[type];
}

export async function saveGeneration(
  type: GenerationType,
  prompt: string,
  result: string,
  context: Record<string, any> = {}
): Promise<AIGeneration> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('ai_generations')
    .insert({
      generation_type: type,
      prompt,
      result,
      model: 'gpt-4o-mini',
      context,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listGenerations(
  type?: GenerationType
): Promise<AIGeneration[]> {
  let query = supabase
    .from('ai_generations')
    .select('*')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('generation_type', type);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function deleteGeneration(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_generations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function exportAsText(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
