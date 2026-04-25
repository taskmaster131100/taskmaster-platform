import type { VercelRequest, VercelResponse } from '@vercel/node';

// Brevo API key lida apenas server-side — nunca exposta ao cliente
const BREVO_KEY = process.env.BREVO_API_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!BREVO_KEY) {
    // Sem key configurada: ignora silenciosamente (email não crítico)
    return res.status(200).json({ ok: true, skipped: true });
  }

  try {
    const { type, to, templateId, params, subject, html, sender } = req.body;

    let payload: object;

    if (type === 'template') {
      payload = { sender, to: [to], templateId, params: params || {} };
    } else if (type === 'raw') {
      payload = { sender, to: [to], subject, htmlContent: html };
    } else {
      return res.status(400).json({ error: 'type must be "template" or "raw"' });
    }

    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('Brevo error:', r.status, err);
      return res.status(200).json({ ok: false, error: err }); // 200 para não quebrar o fluxo
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('send-email proxy error:', error);
    return res.status(200).json({ ok: false, error: error.message });
  }
}
