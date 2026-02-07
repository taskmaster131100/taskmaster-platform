/**
 * Vercel Serverless Function - /api/mentor/transcribe
 * Transcreve áudio usando OpenAI Whisper
 * A API key fica segura no servidor
 */

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

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
    const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Receber o áudio como base64
    const { audioBase64, mimeType } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Converter base64 para buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Criar FormData para a API do OpenAI
    const formData = new FormData();
    const audioBlob = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });
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
      console.error('Whisper API error:', errorData);
      return res.status(response.status).json({ 
        error: 'Erro na transcrição',
        details: errorData.error?.message || response.statusText
      });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      text: data.text,
      language: data.language || 'pt-BR'
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
