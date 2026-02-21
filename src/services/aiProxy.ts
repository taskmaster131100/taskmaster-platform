/**
 * AI Proxy Service
 * 
 * Centralizes all AI API calls through the server-side proxy
 * to protect the OpenAI API key from being exposed in the frontend.
 */

const AI_CHAT_ENDPOINT = '/api/ai-chat';
const AI_TRANSCRIBE_ENDPOINT = '/api/ai-transcribe';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: any;
}

/**
 * Send a chat completion request through the server proxy
 */
export async function aiChatCompletion(options: ChatCompletionOptions): Promise<any> {
  const response = await fetch(AI_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: options.messages,
      model: options.model || 'gpt-4o-mini',
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
      response_format: options.response_format
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `AI API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Send an audio transcription request through the server proxy
 */
export async function aiTranscribe(formData: FormData): Promise<any> {
  const response = await fetch(AI_TRANSCRIBE_ENDPOINT, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Transcription error: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper to extract text content from a chat completion response
 */
export function extractContent(response: any): string {
  return response?.choices?.[0]?.message?.content || '';
}
