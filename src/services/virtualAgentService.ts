import { supabase } from '../lib/supabase';
import { Show, ShowTask } from './showService';

export interface AgentNotification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'critical' | 'suggestion';
  title: string;
  message: string;
  actionLabel?: string;
  actionPath?: string;
  showId?: string;
  category: 'legal' | 'financial' | 'production' | 'logistics' | 'marketing' | 'general';
}

// Mensagens humanizadas para o Agente Virtual
const HUMAN_MESSAGES = {
  contract_pending: [
    "Fala! Notei que o contrato de \"{{show}}\" ainda não foi assinado. Vamos garantir essa segurança jurídica antes da viagem?",
    "Tudo certo? O contrato do show \"{{show}}\" está pendente. É bom dar uma olhada nisso para evitar imprevistos.",
    "Oi! Passando para lembrar que o contrato de \"{{show}}\" precisa de assinatura. Quer que eu te ajude a revisar?"
  ],
  finance_pending: [
    "Ei, o pagamento de entrada de \"{{show}}\" ainda não caiu. Vale dar aquela cobrada amigável no contratante?",
    "Notei que a entrada do show \"{{show}}\" está pendente. Vamos conferir se o financeiro já liberou?",
    "Atenção com o financeiro: a entrada de \"{{show}}\" ainda não foi confirmada. Melhor checar antes de seguir com a logística."
  ],
  logistics_incomplete: [
    "O roteiro de \"{{show}}\" está quase pronto, mas faltam alguns detalhes. Vamos fechar isso para a equipe viajar tranquila?",
    "Equipe na estrada precisa de clareza! O RoadMap de \"{{show}}\" ainda tem pontos em aberto. Vamos finalizar?",
    "Vi que o roteiro de viagem para \"{{show}}\" não está completo. Quer aproveitar agora para definir os horários?"
  ],
  setlist_missing: [
    "Show chegando! O setlist de \"{{show}}\" ainda não foi definido. Quais músicas vamos levar para o palco dessa vez?",
    "Bora ensaiar? O repertório de \"{{show}}\" ainda está em branco. Vamos escolher as músicas?",
    "O artista precisa saber o que tocar! O setlist de \"{{show}}\" está pendente. Vamos montar essa sequência?"
  ],
  marketing_suggestion: [
    "O show \"{{show}}\" está próximo! Que tal usarmos a IA para gerar uns roteiros de Reels e aquecer o público?",
    "Bora bombar esse show? Posso sugerir umas legendas e estratégias de marketing para \"{{show}}\".",
    "Notei que ainda não planejamos o marketing de \"{{show}}\". Quer umas ideias criativas para os Stories?"
  ]
};

function getRandomMessage(key: keyof typeof HUMAN_MESSAGES, showTitle: string): string {
  const messages = HUMAN_MESSAGES[key];
  const msg = messages[Math.floor(Math.random() * messages.length)];
  return msg.replace('{{show}}', showTitle);
}

export async function getAgentNotifications(): Promise<AgentNotification[]> {
  const notifications: AgentNotification[] = [];
  const now = new Date();
  const next14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  try {
    // 1. Buscar shows próximos
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
      
      // Alerta de Contrato (Legal)
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

      // Alerta de Financeiro (Entrada)
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

      // Alerta de Logística (Roteiro)
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

      // Alerta de Setlist
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

      // Sugestão de Marketing (Sempre que o show estiver a menos de 7 dias)
      const showDate = new Date(show.show_date);
      const diffDays = Math.ceil((showDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        notifications.push({
          id: `marketing-${show.id}`,
          type: 'suggestion',
          title: 'Engajamento & Público',
          message: getRandomMessage('marketing_suggestion', show.title),
          actionLabel: 'Gerar Conteúdo',
          actionPath: `/marketing`,
          showId: show.id,
          category: 'marketing'
        });
      }
    }

    // Se não houver nada urgente, dar uma mensagem de boas-vindas/incentivo
    if (notifications.length === 0) {
      notifications.push({
        id: 'welcome-agent',
        type: 'success',
        title: 'Tudo sob controle!',
        message: "Fala! Por aqui está tudo em ordem com seus artistas e shows. Que tal aproveitar o tempo livre para planejar o próximo lançamento?",
        actionLabel: 'Novo Planejamento',
        actionPath: '/planejamento',
        category: 'general'
      });
    }

    return notifications;
  } catch (error) {
    console.error('Erro ao gerar notificações do agente:', error);
    return [];
  }
}
