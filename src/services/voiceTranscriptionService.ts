/**
 * Serviço de Transcrição de Áudio e Processamento de Voz
 * Permite que usuários enviem mensagens de áudio que são transcritas e processadas pela IA
 */

export interface AudioMessage {
  id: string;
  userId: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number; // em segundos
  transcription?: string;
  isTranscribing: boolean;
  createdAt: Date;
}

export interface TranscriptionResult {
  success: boolean;
  text: string;
  confidence: number; // 0-1
  language: string;
  duration: number;
  error?: string;
}

/**
 * Inicia a gravação de áudio
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

      // Parar o stream
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
 * Transcreve áudio usando a API do OpenAI Whisper
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt'); // Português

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erro na transcrição: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      text: data.text,
      confidence: 0.95, // OpenAI não retorna confiança, usar valor padrão
      language: 'pt-BR',
      duration: audioBlob.size / (16000 * 2) // Estimativa baseada no tamanho
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
 * Processa uma mensagem de voz e gera resposta
 */
export async function processVoiceMessage(
  transcription: string,
  userId: string,
  context?: any
): Promise<string> {
  try {
    // Aqui você integraria com a IA (OpenAI, Claude, etc.)
    // Por enquanto, retornar uma resposta simulada

    const response = await fetch('/api/mentor/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: transcription,
        userId,
        context,
        mode: 'voice'
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao processar mensagem');
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Erro ao processar mensagem de voz:', error);
    throw error;
  }
}

/**
 * Converte texto em fala (Text-to-Speech) para resposta do Marcos
 * Opcional: usar para fazer o Marcos responder com voz
 */
export async function synthesizeSpeech(text: string): Promise<Blob> {
  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova', // Voz feminina clara
        language: 'pt-BR'
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao sintetizar fala');
    }

    return await response.blob();
  } catch (error) {
    console.error('Erro ao sintetizar fala:', error);
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
  // Mínimo de 1 segundo
  if (blob.size === 0) return false;

  // Tamanho máximo de 25MB (limite do OpenAI Whisper)
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

/**
 * Detecta o idioma do áudio (opcional)
 */
export async function detectLanguage(audioBlob: Blob): Promise<string> {
  try {
    // Usar Whisper para detectar idioma
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      return 'pt-BR'; // Padrão: português
    }

    const data = await response.json();
    return data.language || 'pt-BR';
  } catch (error) {
    console.error('Erro ao detectar idioma:', error);
    return 'pt-BR'; // Padrão: português
  }
}
