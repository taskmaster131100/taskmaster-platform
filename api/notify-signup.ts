import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ktspxbucvfzaqyszpyso.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TG_BOT = process.env.TG_OPS_BOT || '8393382023:AAFjxZf0hdHhAQWG6SfAbavz8KNw-GDvC40';
const TG_CHAT = process.env.TG_OPS_CHAT || '-5294873764';

async function sendTelegram(msg: string) {
  try {
    await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT, text: msg, parse_mode: 'HTML' }),
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

    // Log the signup request in pending_approvals table
    if (SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      await supabase.from('pending_approvals').insert({
        user_id: userId,
        email,
        name,
        account_type: accountType || 'artist',
        status: 'pending',
        created_at: new Date().toISOString()
      }).catch(err => {
        console.error('Failed to insert pending approval:', err);
      });
    }

    const typeLabel: Record<string, string> = { artist: 'Artista', office: 'Escritório', producer: 'Produtor' };
    await sendTelegram(
      `🆕 <b>Novo cadastro na TaskMaster</b>\n\n` +
      `👤 <b>${name}</b>\n` +
      `📧 ${email}\n` +
      `🏷️ ${typeLabel[accountType] || accountType}\n\n` +
      `Para aprovar: acesse taskmaster.works/admin/usuarios`
    );

    return res.status(200).json({ 
      success: true, 
      message: 'Signup notification sent. Awaiting admin approval.' 
    });
  } catch (error: any) {
    console.error('Notify signup error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
