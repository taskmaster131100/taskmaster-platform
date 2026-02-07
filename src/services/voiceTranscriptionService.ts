/**
 * Serviço de Transcrição de Áudio e Processamento de Voz
 * Usa Vercel Serverless Functions para manter a API key segura no servidor
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
 * Converte Blob para base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcreve áudio usando a Serverless Function (API key segura no servidor)
 */
export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  try {
    const audioBase64 = await blobToBase64(audioBlob);

    const response = await fetch('/api/mentor/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioBase64,
        mimeType: audioBlob.type || 'audio/webm'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro na transcrição: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      text: data.text,
      confidence: 0.95,
      language: data.language || 'pt-BR',
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
 * Processa mensagem e obtém resposta do Marcos Menezes via Serverless Function
 */
export async function processVoiceMessage(
  transcription: string,
  userId: string,
  context?: any,
  conversationHistory?: any[]
): Promise<string> {
  try {
    const response = await fetch('/api/mentor/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: transcription,
        userId,
        context,
        conversationHistory
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao processar mensagem');
    }

    const data = await response.json();
    return data.response;
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
