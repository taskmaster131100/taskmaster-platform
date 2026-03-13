const BREVO_KEY = import.meta.env.VITE_BREVO_API_KEY;
const SENDER = {
  name: import.meta.env.VITE_BREVO_SENDER_NAME || 'TaskMaster',
  email: import.meta.env.VITE_BREVO_SENDER_EMAIL || 'contact@taskmaster.works',
};

export const TEMPLATES = {
  WELCOME: Number(import.meta.env.VITE_BREVO_TEMPLATE_WELCOME) || 2,
  SHOW_REMINDER: Number(import.meta.env.VITE_BREVO_TEMPLATE_SHOW_REMINDER) || 3,
  WEEKLY_REPORT: Number(import.meta.env.VITE_BREVO_TEMPLATE_WEEKLY_REPORT) || 4,
};

interface SendEmailOptions {
  to: { email: string; name?: string };
  templateId: number;
  params?: Record<string, string | number>;
}

export async function sendTransactionalEmail({ to, templateId, params = {} }: SendEmailOptions) {
  if (!BREVO_KEY) return;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [to],
        templateId,
        params,
      }),
    });
  } catch {
    // silent fail — email is non-critical
  }
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
