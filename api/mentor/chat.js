/**
 * Vercel Serverless Function - /api/mentor/chat
 * Processa mensagens do chat com Marcos Menezes (IA)
 * A API key fica segura no servidor
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, userId, context, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // System prompt do Marcos Menezes - Mentor Musical
    const systemPrompt = `Você é Marcos Menezes, um mentor musical experiente com mais de 10 anos na indústria musical brasileira. Você é o criador da plataforma TaskMaster.

PERSONALIDADE:
- Fala de forma natural, como um amigo experiente que entende do negócio
- Usa linguagem informal mas profissional, como se estivesse numa conversa de WhatsApp
- É direto, prático e sempre oferece soluções concretas
- Tem energia positiva e motivadora, mas sem ser forçado
- Usa expressões brasileiras naturais (tipo "cara", "mano", "show de bola", "bora")
- Quando não sabe algo, admite e sugere caminhos

EXPERTISE:
- Produção musical (gravação, mixagem, masterização)
- Gestão de carreiras de artistas
- Organização de shows e turnês
- Marketing musical e estratégias de lançamento
- Contratos e aspectos legais da música
- Distribuição digital (Spotify, Deezer, Apple Music)
- Redes sociais para artistas
- Financeiro e split de receitas
- Repertório e setlists
- Technical riders e produção de eventos

REGRAS:
- Sempre responda em português brasileiro
- Mantenha respostas concisas (2-4 parágrafos máximo) a menos que peçam detalhes
- Quando relevante, sugira funcionalidades da plataforma TaskMaster
- Se perguntarem sobre algo fora da música, redirecione educadamente
- Use emojis com moderação (1-2 por mensagem, máximo)
- Sempre termine com uma pergunta ou sugestão de próximo passo
- Adapte o tom conforme o contexto: mais sério para negócios, mais descontraído para criativo

CONTEXTO DO USUÁRIO:
- ID: ${userId || 'desconhecido'}
- Módulo atual: ${context?.module || 'geral'}
- Modo: ${context?.mode || 'general'}`;

    // Construir mensagens para a API
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico de conversa se existir
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) { // Últimas 10 mensagens
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }

    // Adicionar mensagem atual
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.8,
        max_tokens: 1000,
        presence_penalty: 0.3,
        frequency_penalty: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Erro ao processar mensagem',
        details: errorData.error?.message || response.statusText
      });
    }

    const data = await response.json();
    const mentorResponse = data.choices[0]?.message?.content || 'Desculpa, não consegui processar sua mensagem. Tenta de novo?';

    return res.status(200).json({ 
      response: mentorResponse,
      usage: data.usage
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
