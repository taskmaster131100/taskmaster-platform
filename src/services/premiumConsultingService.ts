/**
 * Serviço de Consultoria Premium com Marcos Menezes
 * Gerencia agendamento de sessões estratégicas de 1 hora com o mentor humano
 */

export type ConsultingTopic = 
  | 'career_strategy' 
  | 'marketing_strategy' 
  | 'social_media_strategy' 
  | 'financial_strategy' 
  | 'business_model' 
  | 'custom';

export interface ConsultingSession {
  id: string;
  userId: string;
  scheduledDate: Date;
  scheduledTime: string; // HH:mm format
  duration: number; // 60 minutes
  topic: ConsultingTopic;
  topicDescription?: string;
  status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled';
  priceUSD: number;
  paymentId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  notes?: string;
  meetingLink?: string;
  recordingLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailableSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  available: boolean;
}

export interface ConsultingPackage {
  id: string;
  name: string;
  description: string;
  priceUSD: number;
  duration: number; // minutes
  topics: ConsultingTopic[];
  benefits: string[];
  idealFor: string;
}

/**
 * Pacotes de consultoria disponíveis
 */
export const CONSULTING_PACKAGES: ConsultingPackage[] = [
  {
    id: 'starter',
    name: 'Sessão Estratégica',
    description: 'Uma sessão de 1 hora com Marcos Menezes para definir sua estratégia',
    priceUSD: 99,
    duration: 60,
    topics: ['career_strategy', 'marketing_strategy', 'social_media_strategy', 'financial_strategy', 'business_model', 'custom'],
    benefits: [
      'Diagnóstico estratégico completo',
      'Plano de ação personalizado',
      'Recomendações específicas',
      'Acesso a recursos exclusivos'
    ],
    idealFor: 'Artistas em qualquer estágio que precisam de orientação estratégica'
  },
  {
    id: 'pro',
    name: 'Consultoria Trimestral',
    description: '3 sessões de 1 hora ao longo de 3 meses com acompanhamento',
    priceUSD: 249,
    duration: 180,
    topics: ['career_strategy', 'marketing_strategy', 'social_media_strategy', 'financial_strategy', 'business_model'],
    benefits: [
      'Diagnóstico estratégico completo',
      'Plano de ação detalhado',
      'Acompanhamento mensal',
      'Suporte via email',
      'Acesso a recursos exclusivos',
      'Desconto em futuras sessões'
    ],
    idealFor: 'Produtores e gerenciadores que precisam de acompanhamento contínuo'
  },
  {
    id: 'enterprise',
    name: 'Consultoria Anual',
    description: 'Acompanhamento estratégico completo ao longo de 12 meses',
    priceUSD: 891,
    duration: 720,
    topics: ['career_strategy', 'marketing_strategy', 'social_media_strategy', 'financial_strategy', 'business_model', 'custom'],
    benefits: [
      'Diagnóstico estratégico completo',
      'Plano de ação detalhado',
      'Acompanhamento mensal',
      'Suporte prioritário via email',
      'Acesso a recursos exclusivos',
      'Consultoria ad-hoc (até 2 horas/mês)',
      'Desconto em futuras sessões'
    ],
    idealFor: 'Escritórios e produtoras com múltiplos artistas'
  }
];

/**
 * Tópicos de consultoria disponíveis
 */
export const CONSULTING_TOPICS: Record<ConsultingTopic, { label: string; description: string; icon: string }> = {
  career_strategy: {
    label: 'Estratégia de Carreira',
    description: 'Planejamento de longo prazo, posicionamento e evolução artística',
    icon: '🎯'
  },
  marketing_strategy: {
    label: 'Estratégia de Marketing',
    description: 'Plano de marketing, lançamentos, campanhas e engajamento',
    icon: '📢'
  },
  social_media_strategy: {
    label: 'Estratégia de Redes Sociais',
    description: 'Conteúdo, crescimento, engajamento e monetização',
    icon: '📱'
  },
  financial_strategy: {
    label: 'Estratégia Financeira',
    description: 'Cachês, splits, margens, tributação e fluxo de caixa',
    icon: '💰'
  },
  business_model: {
    label: 'Modelo de Negócio',
    description: 'Estrutura, operações, escalabilidade e diversificação de renda',
    icon: '🏢'
  },
  custom: {
    label: 'Consultoria Customizada',
    description: 'Defina o tópico que você quer discutir',
    icon: '✨'
  }
};

/**
 * Gera slots de disponibilidade para agendamento
 * Todos os horários padrão são exibidos como disponíveis.
 * O bloqueio de slots ocupados é feito em etapa posterior (confirmação de pagamento).
 */
export function generateAvailableSlots(daysAhead: number = 30): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const now = new Date();

  // Horários disponíveis: Segunda a Quinta, das 08h às 11h (horário de Brasília)
  const availableTimes = ['08:00', '09:00', '10:00', '11:00'];

  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    // Apenas Segunda a Quinta (0 = Domingo, 5 = Sexta, 6 = Sábado)
    const day = date.getDay();
    if (day === 0 || day === 5 || day === 6) continue;

    const dateStr = date.toISOString().split('T')[0];

    availableTimes.forEach(time => {
      slots.push({ date: dateStr, time, available: true });
    });
  }

  return slots;
}

/**
 * Cria uma nova sessão de consultoria
 */
export async function createConsultingSession(
  userId: string,
  packageId: string,
  topic: ConsultingTopic,
  scheduledDate: string,
  scheduledTime: string,
  topicDescription?: string
): Promise<ConsultingSession> {
  const pkg = CONSULTING_PACKAGES.find(p => p.id === packageId);
  if (!pkg) throw new Error('Pacote não encontrado');

  const session: ConsultingSession = {
    id: `session-${Date.now()}`,
    userId,
    scheduledDate: new Date(scheduledDate),
    scheduledTime,
    duration: 60,
    topic,
    topicDescription,
    status: 'pending_payment',
    priceUSD: pkg.priceUSD,
    paymentStatus: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Em produção, salvar no banco de dados
  // await supabase.from('consulting_sessions').insert(session);

  return session;
}

/**
 * Confirma o pagamento de uma sessão
 */
export async function confirmPayment(
  sessionId: string,
  paymentId: string
): Promise<ConsultingSession> {
  // Em produção, atualizar no banco de dados
  // await supabase
  //   .from('consulting_sessions')
  //   .update({ status: 'confirmed', paymentStatus: 'completed', paymentId })
  //   .eq('id', sessionId);

  return {
    id: sessionId,
    userId: '',
    scheduledDate: new Date(),
    scheduledTime: '',
    duration: 60,
    topic: 'career_strategy',
    status: 'confirmed',
    priceUSD: 150,
    paymentId,
    paymentStatus: 'completed',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Gera um link de reunião para a sessão
 */
export function generateMeetingLink(sessionId: string): string {
  // Em produção, integrar com Zoom, Google Meet, etc.
  return `https://meet.taskmaster.works/${sessionId}`;
}

/**
 * Envia confirmação de agendamento para o usuário
 */
export async function sendConfirmationEmail(
  userEmail: string,
  session: ConsultingSession
): Promise<void> {
  const topic = CONSULTING_TOPICS[session.topic];
  const date = new Date(session.scheduledDate).toLocaleDateString('pt-BR');
  const time = session.scheduledTime;

  const emailBody = `
    Olá!

    Sua consultoria estratégica com Marcos Menezes foi confirmada!

    📅 Data: ${date}
    🕐 Horário: ${time}
    ⏱️ Duração: 1 hora
    ${topic.label}: ${topic.description}

    Link da reunião: ${generateMeetingLink(session.id)}

    Prepare-se para uma conversa estratégica que vai transformar sua carreira!

    Abraços,
    Marcos Menezes
  `;

  // Em produção, usar serviço de email (SendGrid, AWS SES, etc.)
  console.log('Email enviado para:', userEmail);
  console.log(emailBody);
}

/**
 * Cria lembretes para a sessão
 */
export async function scheduleReminders(session: ConsultingSession): Promise<void> {
  // 24 horas antes
  const reminderDate = new Date(session.scheduledDate);
  reminderDate.setHours(reminderDate.getHours() - 24);

  // Em produção, usar sistema de agendamento (cron, Bull, etc.)
  console.log(`Lembrete agendado para: ${reminderDate}`);
}

/**
 * Gera relatório pós-sessão
 */
export interface SessionReport {
  sessionId: string;
  date: Date;
  topic: ConsultingTopic;
  keyTakeaways: string[];
  actionItems: {
    title: string;
    priority: 'high' | 'medium' | 'low';
    deadline: string;
  }[];
  nextSteps: string;
}

export function generateSessionReport(
  session: ConsultingSession,
  notes: string
): SessionReport {
  // Em produção, usar IA para gerar relatório baseado nas notas
  return {
    sessionId: session.id,
    date: session.scheduledDate,
    topic: session.topic,
    keyTakeaways: [
      'Ponto-chave 1 da discussão',
      'Ponto-chave 2 da discussão',
      'Ponto-chave 3 da discussão'
    ],
    actionItems: [
      {
        title: 'Ação 1',
        priority: 'high',
        deadline: '1 semana'
      },
      {
        title: 'Ação 2',
        priority: 'medium',
        deadline: '2 semanas'
      }
    ],
    nextSteps: 'Próximos passos definidos durante a sessão'
  };
}

/**
 * Calcula o preço com desconto para múltiplas sessões
 */
export function calculateDiscountedPrice(
  basePrice: number,
  numberOfSessions: number
): number {
  let discount = 0;

  if (numberOfSessions >= 3) discount = 0.1; // 10% para 3+
  if (numberOfSessions >= 6) discount = 0.15; // 15% para 6+
  if (numberOfSessions >= 12) discount = 0.20; // 20% para 12+

  return basePrice * (1 - discount);
}
