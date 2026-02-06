import { supabase } from '../lib/supabase';
import { Show, ShowTask } from './showService';

export interface AgentNotification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'critical' | 'suggestion' | 'mentor';
  title: string;
  message: string;
  actionLabel?: string;
  actionPath?: string;
  showId?: string;
  category: 'legal' | 'financial' | 'production' | 'logistics' | 'marketing' | 'general' | 'strategy';
  isMentorInsight?: boolean;
}

// Mensagens humanizadas e estratégicas para o Mentor FlexMax
const HUMAN_MESSAGES = {
  onboarding: [
    "Boas-vindas à FlexMax! Sou seu Mentor e estou aqui para garantir que sua carreira decole com organização. Que tal começarmos cadastrando seu primeiro artista?",
    "Olá! Fico feliz em ter você aqui. Como seu Mentor, sugiro que o primeiro passo seja configurar sua organização para gerenciar seus talentos com eficiência.",
  ],
  contract_pending: [
    "Fala! Notei que o contrato de \"{{show}}\" ainda não foi assinado. Vamos garantir essa segurança jurídica antes da viagem?",
    "Tudo certo? O contrato do show \"{{show}}\" está pendente. É bom dar uma olhada nisso para evitar imprevistos.",
  ],
  finance_pending: [
    "Ei, o pagamento de entrada de \"{{show}}\" ainda não caiu. Vale dar aquela cobrada amigável no contratante?",
    "Atenção com o financeiro: a entrada de \"{{show}}\" ainda não foi confirmada. Melhor checar antes de seguir com a logística.",
  ],
  logistics_incomplete: [
    "O roteiro de \"{{show}}\" está quase pronto, mas faltam alguns detalhes. Vamos fechar isso para a equipe viajar tranquila?",
    "Equipe na estrada precisa de clareza! O RoadMap de \"{{show}}\" ainda tem pontos em aberto. Vamos finalizar?",
  ],
  setlist_missing: [
    "Show chegando! O setlist de \"{{show}}\" ainda não foi definido. Quais músicas vamos levar para o palco dessa vez?",
    "O artista precisa saber o que tocar! O setlist de \"{{show}}\" está pendente. Vamos montar essa sequência?",
  ],
  marketing_suggestion: [
    "O show \"{{show}}\" está próximo! Que tal usarmos a IA para gerar uns roteiros de Reels e aquecer o público?",
    "Bora bombar esse show? Posso sugerir umas legendas e estratégias de marketing para \"{{show}}\".",
  ],
  strategic_insight: [
    "Analisando seus dados: Notei que sua margem de lucro em \"{{show}}\" está abaixo da média devido aos custos de logística. Quer revisar o split?",
    "Dica de Mentor: Seus lançamentos recentes tiveram mais engajamento com roteiros de Reels. Vamos focar nisso para o próximo show?",
  ]
};

function getRandomMessage(key: keyof typeof HUMAN_MESSAGES, context?: string): string {
  const messages = HUMAN_MESSAGES[key];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  return context ? msg.replace('{{show}}', context) : msg;
}

export async function getAgentNotifications(): Promise<AgentNotification[]> {
  const notifications: AgentNotification[] = [];
  const now = new Date();
  const next14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  try {
    // 1. Verificar Onboarding (Se não houver artistas cadastrados)
    const { count: artistCount } = await supabase
      .from('artists')
      .select('*', { count: 'exact', head: true });

    if (artistCount === 0) {
      notifications.push({
        id: 'mentor-onboarding',
        type: 'mentor',
        title: 'Marcos Menezes - Mentor FlexMax: Primeiros Passos',
        message: getRandomMessage('onboarding'),
        actionLabel: 'Cadastrar Artista',
        actionPath: '/artistas',
        category: 'strategy',
        isMentorInsight: true
      });
    }

    // 2. Buscar shows próximos para diagnósticos
    const { data: shows, error: showsError } = await supabase
      .from('shows')
      .select('*')
      .gte('show_date', now.toISOString().split('T')[0])
      .lte('show_date', next14Days.toISOString().split('T')[0]);

    if (showsError) throw showsError;

    for (const show of (shows as Show[])) {
      const { data: tasks } = await supabase
        .from('show_tasks')
        .select('*')
        .eq('show_id', show.id)
        .eq('status', 'pending');

      const pendingTasks = (tasks || []) as ShowTask[];
      
      // Diagnóstico de Segurança Jurídica
      if (pendingTasks.find(t => t.title.toLowerCase().includes('contrato'))) {
        notifications.push({
          id: `contract-${show.id}`,
          type: 'critical',
          title: 'Segurança Jurídica',
          message: getRandomMessage('contract_pending', show.title),
          actionLabel: 'Ver Contrato',
          actionPath: `/shows`,
          showId: show.id,
          category: 'legal'
        });
      }

      // Diagnóstico Financeiro
      if (pendingTasks.find(t => t.title.toLowerCase().includes('entrada') || t.category === 'financial')) {
        notifications.push({
          id: `finance-${show.id}`,
          type: 'warning',
          title: 'Fluxo de Caixa',
          message: getRandomMessage('finance_pending', show.title),
          actionLabel: 'Ver Financeiro',
          actionPath: `/finance`,
          showId: show.id,
          category: 'financial'
        });
      }

      // Insight Estratégico (Simulação de análise de margem)
      if (show.total_value && show.total_value > 5000) {
        notifications.push({
          id: `insight-${show.id}`,
          type: 'mentor',
          title: 'Marcos Menezes - Mentor: Insight Estratégico',
          message: getRandomMessage('strategic_insight', show.title),
          actionLabel: 'Analisar Split',
          actionPath: `/shows`,
          showId: show.id,
          category: 'strategy',
          isMentorInsight: true
        });
      }

      // Logística e Produção
      if (pendingTasks.find(t => t.category === 'logistics')) {
        notifications.push({
          id: `logistics-${show.id}`,
          type: 'info',
          title: 'Conforto na Estrada',
          message: getRandomMessage('logistics_incomplete', show.title),
          actionLabel: 'Fechar Roteiro',
          actionPath: `/shows`,
          showId: show.id,
          category: 'logistics'
        });
      }

      if (pendingTasks.find(t => t.title.toLowerCase().includes('setlist'))) {
        notifications.push({
          id: `setlist-${show.id}`,
          type: 'suggestion',
          title: 'Preparação Artística',
          message: getRandomMessage('setlist_missing', show.title),
          actionLabel: 'Montar Setlist',
          actionPath: `/shows`,
          showId: show.id,
          category: 'production'
        });
      }
    }

    // Se não houver nada urgente, dar uma mensagem de incentivo do Mentor
    if (notifications.length === 0) {
      notifications.push({
        id: 'mentor-idle',
        type: 'mentor',
        title: 'Marcos Menezes - Mentor FlexMax: Visão Geral',
        message: "Tudo sob controle por aqui! Seus artistas estão com a agenda em dia. Que tal usarmos esse tempo para prospectar novos contratantes?",
        actionLabel: 'Ver Relatórios',
        actionPath: '/relatorios',
        category: 'strategy',
        isMentorInsight: true
      });
    }

    return notifications;
  } catch (error) {
    console.error('Erro ao gerar notificações do agente:', error);
    return [];
  }
}
