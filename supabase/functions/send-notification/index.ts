import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || '';
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';
const EVOLUTION_INSTANCE = Deno.env.get('EVOLUTION_INSTANCE') || 'taskmaster';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@taskmaster.app';
const FROM_NAME = Deno.env.get('FROM_NAME') || 'TaskMaster';

interface NotificationPayload {
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  channels: ('email' | 'whatsapp')[];
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload: NotificationPayload = await req.json();
    const results: Record<string, any> = {};

    // Buscar dados do usuário e preferências
    const { data: authUser } = await supabase.auth.admin.getUserById(payload.user_id);
    const userEmail = authUser?.user?.email;

    const { data: prefs } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', payload.user_id)
      .maybeSingle();

    // ── EMAIL ──────────────────────────────────────────────
    if (payload.channels.includes('email') && userEmail && SENDGRID_API_KEY) {
      // Verificar se usuário quer esse tipo de notif por email
      const emailEnabled = prefs ? isEmailEnabledForType(prefs, payload.type) : true;

      if (emailEnabled) {
        const linkHtml = payload.link
          ? `<p style="margin-top:16px"><a href="${payload.link}" style="background:#FF9B6A;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver no TaskMaster</a></p>`
          : '';

        const emailBody = {
          personalizations: [{ to: [{ email: userEmail }], subject: payload.title }],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
                <div style="background:linear-gradient(135deg,#FFAD85,#FF9B6A);padding:24px;border-radius:12px 12px 0 0;text-align:center">
                  <h1 style="color:white;margin:0;font-size:20px">TaskMaster</h1>
                </div>
                <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                  <h2 style="color:#111827;margin-top:0">${payload.title}</h2>
                  <p style="color:#374151;line-height:1.6">${payload.message}</p>
                  ${linkHtml}
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
                  <p style="color:#9ca3af;font-size:12px">
                    Você recebeu este email porque tem notificações ativadas no TaskMaster.
                    <a href="${SUPABASE_URL.replace('supabase.co', 'taskmaster.app')}/preferencias" style="color:#FF9B6A">Gerenciar preferências</a>
                  </p>
                </div>
              </div>
            `
          }]
        };

        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailBody),
        });

        results.email = { status: sgRes.status, ok: sgRes.ok };
      } else {
        results.email = { skipped: true, reason: 'user_preference' };
      }
    }

    // ── WHATSAPP ───────────────────────────────────────────
    if (payload.channels.includes('whatsapp') && EVOLUTION_API_URL && prefs?.whatsapp_enabled && prefs?.whatsapp_number) {
      const waNumber = prefs.whatsapp_number.replace(/\D/g, ''); // apenas dígitos
      const text = `*${payload.title}*\n\n${payload.message}${payload.link ? `\n\n🔗 ${payload.link}` : ''}`;

      const waRes = await fetch(`${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: waNumber,
          options: { delay: 1200 },
          textMessage: { text }
        }),
      });

      results.whatsapp = { status: waRes.status, ok: waRes.ok };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err: any) {
    console.error('send-notification error:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

function isEmailEnabledForType(prefs: any, type: string): boolean {
  if (type.includes('task')) return prefs.email_tasks ?? true;
  if (type.includes('show')) return prefs.email_shows ?? true;
  if (type.includes('release')) return prefs.email_releases ?? true;
  if (type.includes('payment') || type.includes('financial')) return prefs.email_financial ?? true;
  if (type.includes('team')) return prefs.email_team_invites ?? true;
  return true;
}
