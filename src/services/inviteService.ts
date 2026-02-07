import { supabase } from '../lib/supabase';

export interface Invite {
  id: string;
  email: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
}

export async function sendInvite(email: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autorizado');

  // 1. Verificar se o e-mail já está convidado ou cadastrado
  const { data: existing } = await supabase
    .from('invites')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (existing && existing.status === 'pending') {
    throw new Error('Já existe um convite pendente para este e-mail.');
  }

  // 2. Criar o convite no banco de dados
  const { error } = await supabase
    .from('invites')
    .insert({
      email: email.toLowerCase(),
      invited_by: user.id,
      status: 'pending'
    });

  if (error) throw error;

  // Nota: Em produção, aqui dispararíamos um e-mail real via SendGrid/Resend
  console.log(`Convite enviado para: ${email}`);
}

export async function validateInvite(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .single();

  if (error || !data) return false;
  return true;
}

export async function listInvites(): Promise<Invite[]> {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
