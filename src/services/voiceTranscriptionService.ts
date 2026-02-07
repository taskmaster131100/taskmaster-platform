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

    const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

    // Construir histórico de conversa para contexto
    const historyMessages = (conversationHistory || []).slice(-10).map(msg => ({
      role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    const systemPrompt = `Você é Marcos Menezes, um mentor especialista em gestão musical com mais de 20 anos de experiência na indústria musical brasileira e internacional. Você é o criador da plataforma TaskMaster e ajuda artistas, produtores e gestores musicais a organizarem suas carreiras.

Sua personalidade:
- Comunicativo, direto e prático
- Usa linguagem acessível mas profissional
- Sempre dá exemplos reais da indústria musical
- É motivador mas realista
- Conhece profundamente: produção musical, shows, turnês, marketing musical, financeiro, contratos, direitos autorais, distribuição digital, streaming, redes sociais para artistas
- Fala português brasileiro naturalmente

${context?.mode === 'module' && context?.module ? `Contexto atual: O usuário está no módulo "${context.module}" da plataforma.` : ''}

Responda de forma conversacional, como se estivesse em uma mentoria presencial. Seja útil e específico nas orientações.`;

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
        temperature: 0.8,
        max_tokens: 1000
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
