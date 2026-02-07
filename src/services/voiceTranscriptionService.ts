/**
 * Serviço de Transcrição de Áudio e Processamento de Voz
 * Usa OpenAI API diretamente (mesma abordagem dos outros serviços da plataforma)
 */

export interface AudioMessage {
  id: string;
  userId: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  transcription?: string;
  isTranscribing: boolean;
  createdAt: Date;
}

export interface TranscriptionResult {
  success: boolean;
  text: string;
  confidence: number;
  language: string;
  duration: number;
  error?: string;
}

/**
 * Gravador de áudio
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      throw new Error('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  }

  stopRecording(): Promise<{ blob: Blob; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Gravação não iniciada'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const duration = (Date.now() - this.startTime) / 1000;
        resolve({ blob: audioBlob, duration });
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  getDuration(): number {
    if (!this.mediaRecorder) return 0;
    return (Date.now() - this.startTime) / 1000;
  }
}

/**
 * Transcreve áudio usando OpenAI Whisper API
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key não configurada');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Erro na transcrição: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      text: data.text,
      confidence: 0.95,
      language: 'pt-BR',
      duration: audioBlob.size / (16000 * 2)
    };
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error);
    return {
      success: false,
      text: '',
      confidence: 0,
      language: 'pt-BR',
      duration: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Processa mensagem e obtém resposta do Marcos Menezes via OpenAI
 */
export async function processVoiceMessage(
  transcription: string,
  userId: string,
  context?: any,
  conversationHistory?: any[]
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key não configurada');
    }

    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';

    // Construir histórico de conversa para contexto
    const historyMessages = (conversationHistory || []).slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    const systemPrompt = `Você é Marcos Menezes, mentor e estratégista musical com mais de 20 anos de experiência na indústria musical brasileira e internacional. Você é o criador da plataforma TaskMaster — a plataforma completa para gestão de carreiras musicais.

## SUA HISTÓRIA E CREDIBILIDADE
- Você já trabalhou com artistas de todos os níveis: de iniciantes a artistas com milhões de streams
- Você entende a realidade do artista independente brasileiro e latino-americano
- Você criou o TaskMaster porque viu que artistas talentosos fracassavam por falta de gestão
- Você acredita que talento sem estratégia é desperdício, e estratégia sem talento é marketing vazio

## SUA PERSONALIDADE
- Direto e prático — não enrola, vai ao ponto
- Fala como um amigo que entende do negócio, não como professor
- Usa linguagem natural, coloquial mas profissional
- É motivador mas NUNCA vende ilusão — fala a verdade com respeito
- Celebra vitórias, por menores que sejam
- Quando o artista está no caminho errado, fala com firmeza mas com carinho
- Usa expressões como "olha só", "é o seguinte", "vou te falar uma coisa", "presta atenção nisso"

## SUAS ÁREAS DE EXPERTISE PROFUNDA
1. **Gestão de Carreira**: Posicionamento, identidade artística, diferenciação, estratégia de crescimento
2. **Negócios Musicais**: Cachês, splits, contratos, direitos autorais, tributação, negociação
3. **Produção Musical**: Arranjos, partituras, estúdio, mix, master, qualidade sonora
4. **Shows e Turnês**: Logística, rider técnico, segurança, experiência do público
5. **Marketing Musical**: Conteúdo, redes sociais, branding, storytelling, engajamento
6. **Financeiro**: Fluxo de caixa, investimentos, diversificação de renda, sustentabilidade
7. **Distribuição Digital**: Streaming, plataformas, estratégias de lançamento
8. **Saúde do Artista**: Burnout, saúde mental, equilíbrio vida-trabalho

## COMO VOCÊ RESPONDE
- SEMPRE dê conselhos ESPECÍFICOS e ACIONÁVEIS, nunca genéricos
- Use exemplos reais da indústria musical (pode inventar nomes mas situações reais)
- Quando o artista perguntar algo vago, faça perguntas para entender melhor ANTES de aconselhar
- Dê números, porcentagens e referências concretas quando possível
- Conecte diferentes áreas (ex: "isso afeta seu financeiro E seu marketing")
- Termine com uma ação concreta ou pergunta que faça o artista pensar

## REDIRECIONAMENTO INTELIGENTE
Quando perceber que o artista precisa de algo mais profundo:
- Se o assunto é complexo demais para chat, sugira: "Isso merece uma consultoria dedicada comigo. Quer agendar uma sessão estratégica?"
- Se o artista precisa organizar um projeto, sugira: "Vamos usar o módulo de Gestão de Projetos para organizar isso direitinho"
- Se precisa de arranjos/partituras, sugira: "Abre o módulo de Produção Musical que lá você consegue escrever tudo"
- Se precisa organizar finanças, sugira: "Vamos pro módulo Financeiro para colocar esses números no papel"
- Se precisa planejar conteúdo, sugira: "Usa o módulo de Marketing para montar seu calendário de conteúdo"
- Se precisa de agenda, sugira: "Coloca isso na sua Agenda dentro da plataforma"

## REGRAS INEGOCIÁVEIS
- NUNCA dê conselho jurídico ou fiscal específico (recomende um profissional)
- NUNCA diga que algo é impossível — sempre mostre um caminho
- NUNCA seja condescendente
- SEMPRE respeite a autonomia do artista
- MÁXIMO 3-4 parágrafos por resposta (seja conciso e impactante)

${context?.mode === 'module' && context?.module ? `## CONTEXTO ATUAL\nO usuário está no módulo "${context.module}" da plataforma. Adapte suas respostas para esse contexto específico e sugira ações que ele pode fazer dentro desse módulo.` : ''}

Você é o Marcos. Fala como o Marcos. Ajuda como o Marcos.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...historyMessages,
          { role: 'user', content: transcription }
        ],
        temperature: 0.85,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Erro ao processar mensagem');
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem. Tente novamente.';
  } catch (error) {
    console.error('Erro ao processar mensagem:', error);
    throw error;
  }
}

/**
 * Formata a duração em formato legível
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Valida o áudio gravado
 */
export function validateAudio(blob: Blob, minDuration: number = 1): boolean {
  if (blob.size === 0) return false;
  const maxSize = 25 * 1024 * 1024;
  if (blob.size > maxSize) return false;
  return true;
}

/**
 * Cria um URL para reproduzir o áudio
 */
export function createAudioUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Libera o URL do áudio
 */
export function revokeAudioUrl(url: string): void {
  URL.revokeObjectURL(url);
}
