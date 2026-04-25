import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ktspxbucvfzaqyszpyso.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c3B4YnVjdmZ6YXF5c3pweXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDcyNzQsImV4cCI6MjA3MTAyMzI3NH0.-UfFVeGoCJFc69FHSwZ2FHlcQs1uidkxg0tItxmpPTc';
const TG_BOT = process.env.TG_OPS_BOT || '8393382023:AAFjxZf0hdHhAQWG6SfAbavz8KNw-GDvC40';
const TG_CHAT = process.env.TG_OPS_CHAT || '-5294873764';
const BREVO_KEY = process.env.BREVO_API_KEY || '';
const ADMIN_EMAIL = 'contact@taskmaster.works';

async function sendTelegram(msg: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: 'HTML' }),
    });
  } catch {}
}

async function sendEmailToAdmin(name: string, email: string, accountType: string, userId: string) {
  const typeLabel: Record<string, string> = { artist: 'Artista', office: 'Escritório', producer: 'Produtor' };
  const approveUrl = `https://www.taskmaster.works/admin/usuarios`;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'TaskMaster', email: 'contact@taskmaster.works' },
        to: [{ email: ADMIN_EMAIL, name: 'Marcos' }],
        subject: `🆕 Novo cadastro pendente: ${name}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#FF9B6A">Novo cadastro na TaskMaster</h2>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px;color:#666;width:120px">Nome</td><td style="padding:8px;font-weight:bold">${name}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${email}</td></tr>
              <tr><td style="padding:8px;color:#666">Tipo</td><td style="padding:8px">${typeLabel[accountType] || accountType}</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px;color:#666">ID</td><td style="padding:8px;font-size:12px;color:#999">${userId}</td></tr>
            </table>
            <a href="${approveUrl}" style="display:inline-block;background:#FF9B6A;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px">
              Aprovar / Rejeitar →
            </a>
            <p style="color:#999;font-size:12px;margin-top:24px">TaskMaster — ${new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        `,
      }),
    });
  } catch {}
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, email, name, accountType } = req.body;

    if (!userId || !email || !name) {
      return res.status(400).json({ error: 'userId, email, and name are required' });
    }

    // Log the signup request in pending_approvals table (uses anon key — policy allows insert)
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await supabase.from('pending_approvals').insert({
        user_id: userId,
        email,
        name,
        account_type: accountType || 'artist',
        status: 'pending',
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to insert pending approval:', err);
    }

    const typeLabel: Record<string, string> = { artist: 'Artista', office: 'Escritório', producer: 'Produtor' };
    await Promise.all([
      sendTelegram(
        `🆕 <b>Novo cadastro na TaskMaster</b>\n\n` +
        `👤 <b>${name}</b>\n` +
        `📧 ${email}\n` +
        `🏷️ ${typeLabel[accountType] || accountType}\n\n` +
        `Para aprovar: taskmaster.works/admin/usuarios`
      ),
      sendEmailToAdmin(name, email, accountType, userId),
    ]);

    return res.status(200).json({ 
      success: true, 
      message: 'Signup notification sent. Awaiting admin approval.' 
    });
  } catch (error: any) {
    console.error('Notify signup error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
