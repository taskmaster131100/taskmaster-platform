import { supabase } from '../lib/supabase';

// Email enviado via proxy server-side — Brevo key não exposta no cliente
const APP_URL = 'https://www.taskmaster.works';

export interface Invite {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  token: string;
  artist_id?: string | null;
}

export interface SendInviteParams {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  artist_id?: string | null;
}

async function sendInviteEmail(email: string, role: string, token: string): Promise<boolean> {
  const link = `${APP_URL}/invite/${token}`;
  const roleLabel: Record<string, string> = {
    viewer: 'Visualizador', editor: 'Editor', admin: 'Administrador',
  };

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;border-radius:12px;border:1px solid #e5e7eb">
      <h2 style="color:#111827;margin:0 0 8px">Você foi convidado para a equipe</h2>
      <p style="color:#6b7280;margin:0 0 24px">
        Você recebeu um convite para entrar na plataforma <strong>TaskMaster</strong> como <strong>${roleLabel[role] || role}</strong>.
      </p>
      <a href="${link}" style="display:inline-block;background:#6366f1;color:#fff;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">
        Aceitar convite
      </a>
      <p style="color:#9ca3af;font-size:12px;margin:24px 0 0">
        Este link expira em 7 dias. Se não reconhece este convite, ignore este e-mail.
      </p>
    </div>
  `;

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'raw',
        to: { email },
        subject: 'Convite para a plataforma TaskMaster',
        html,
        sender: { name: 'TaskMaster', email: 'contact@taskmaster.works' },
      }),
    });
    return res.ok;
  } catch (e) {
    console.error('[inviteService] falha ao enviar e-mail:', e);
    return false;
  }
}

export async function sendInvite({ email, role, artist_id }: SendInviteParams): Promise<{ token: string; emailSent: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  // Resolver organization_id do usuário atual
  const { data: orgRow } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!orgRow?.organization_id) throw new Error('Organização não encontrada');

  // Verificar convite pendente para o mesmo e-mail + org
  const { data: existing } = await supabase
    .from('team_invites')
    .select('id, status')
    .eq('email', email.toLowerCase())
    .eq('organization_id', orgRow.organization_id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existing) throw new Error('Já existe um convite pendente para este e-mail.');

  // Gerar token único
  const token = crypto.randomUUID();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('team_invites').insert({
    email: email.toLowerCase(),
    role,
    token,
    invited_by: user.id,
    organization_id: orgRow.organization_id,
    artist_id: artist_id || null,
    status: 'pending',
    expires_at,
  });

  if (error) throw new Error(error.message);

  // Enviar e-mail via Brevo
  const emailSent = await sendInviteEmail(email.toLowerCase(), role, token);

  return { token, emailSent };
}

export async function listInvites(): Promise<Invite[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: orgRow } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!orgRow?.organization_id) return [];

  const { data, error } = await supabase
    .from('team_invites')
    .select('id, email, role, status, created_at, expires_at, token, artist_id')
    .eq('organization_id', orgRow.organization_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as Invite[];
}

export async function revokeInvite(id: string): Promise<void> {
  const { error } = await supabase
    .from('team_invites')
    .update({ status: 'expired' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
