// Emails transacionais enviados via proxy server-side (/api/send-email)
// A Brevo API key NÃO deve ser exposta no cliente — toda chamada vai pelo servidor.

const SENDER_NAME = 'TaskMaster';
const SENDER_EMAIL = 'contact@taskmaster.works';

export const TEMPLATES = {
  WELCOME: 2,
  SHOW_REMINDER: 3,
  WEEKLY_REPORT: 4,
};

interface SendEmailOptions {
  to: { email: string; name?: string };
  templateId: number;
  params?: Record<string, string | number>;
}

async function sendViaProxy(payload: object): Promise<void> {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // silent fail — email is non-critical
  }
}

export async function sendTransactionalEmail({ to, templateId, params = {} }: SendEmailOptions) {
  await sendViaProxy({
    type: 'template',
    to,
    templateId,
    params,
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
  });
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  return sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: TEMPLATES.WELCOME,
    params: { firstName },
  });
}

export async function sendShowReminderEmail(
  email: string,
  firstName: string,
  showName: string,
  showDate: string,
  venue: string,
  fee: string
) {
  return sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: TEMPLATES.SHOW_REMINDER,
    params: { firstName, showName, showDate, venue, fee },
  });
}

export async function sendWeeklyReportEmail(
  email: string,
  firstName: string,
  showsCount: number,
  revenue: string,
  tasksCompleted: number
) {
  return sendTransactionalEmail({
    to: { email, name: firstName },
    templateId: TEMPLATES.WEEKLY_REPORT,
    params: { firstName, showsCount, revenue, tasksCompleted },
  });
}

export async function sendAccessRequestNotification(data: {
  name: string;
  email: string;
  contact: string;
}) {
  await sendViaProxy({
    type: 'raw',
    to: { email: 'contact@taskmaster.works', name: 'TaskMaster Admin' },
    subject: '🎵 Novo pedido de acesso — TaskMaster',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#FF9B6A;margin-bottom:16px">Novo pedido de acesso</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#666;font-size:14px">Nome</td><td style="padding:8px 0;font-weight:600;font-size:14px">${data.name}</td></tr>
          <tr><td style="padding:8px 0;color:#666;font-size:14px">E-mail</td><td style="padding:8px 0;font-weight:600;font-size:14px">${data.email}</td></tr>
          <tr><td style="padding:8px 0;color:#666;font-size:14px">Contato</td><td style="padding:8px 0;font-weight:600;font-size:14px">${data.contact}</td></tr>
        </table>
        <p style="margin-top:24px;font-size:13px;color:#999">Enviado via formulário de acesso em taskmaster.works</p>
      </div>
    `,
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
  });
}
