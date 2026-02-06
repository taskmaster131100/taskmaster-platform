/**
 * Serviço de Mentor Vivo (Live Mentor Service)
 * Mantém o Marcos Menezes "vivo" dentro da plataforma, monitorando atividades
 * e oferecendo suporte proativo quando detecta inatividade ou oportunidades
 */

import { supabase } from '../lib/supabase';

export interface UserActivity {
  userId: string;
  lastActivity: Date;
  currentModule?: string;
  showsInProgress: number;
  tasksCompleted: number;
  inactivityDays: number;
}

export interface MentorProactiveMessage {
  id: string;
  type: 'inactivity_check' | 'milestone' | 'opportunity' | 'reminder' | 'celebration';
  title: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  actionLabel?: string;
  actionPath?: string;
  timestamp: Date;
}

/**
 * Monitora a atividade do usuário e detecta padrões
 */
export async function monitorUserActivity(userId: string): Promise<UserActivity> {
  try {
    // Buscar última atividade do usuário
    const { data: lastSession } = await supabase
      .from('user_sessions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const lastActivity = lastSession ? new Date(lastSession.created_at) : new Date();
    const now = new Date();
    const inactivityDays = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    // Buscar shows em progresso
    const { count: showsInProgress } = await supabase
      .from('shows')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', ['consultado', 'confirmado', 'em_producao']);

    // Buscar tarefas completadas hoje
    const today = new Date().toISOString().split('T')[0];
    const { count: tasksCompleted } = await supabase
      .from('show_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('updated_at', today);

    return {
      userId,
      lastActivity,
      inactivityDays,
      showsInProgress: showsInProgress || 0,
      tasksCompleted: tasksCompleted || 0
    };
  } catch (error) {
    console.error('Erro ao monitorar atividade:', error);
    return {
      userId,
      lastActivity: new Date(),
      inactivityDays: 0,
      showsInProgress: 0,
      tasksCompleted: 0
    };
  }
}

/**
 * Gera mensagens proativas baseadas na atividade do usuário
 */
export async function generateProactiveMessages(userId: string): Promise<MentorProactiveMessage[]> {
  const messages: MentorProactiveMessage[] = [];

  try {
    const activity = await monitorUserActivity(userId);

    // 1. Detecção de Inatividade
    if (activity.inactivityDays >= 3 && activity.inactivityDays < 7) {
      messages.push({
        id: `inactivity-${activity.inactivityDays}d`,
        type: 'inactivity_check',
        title: 'Marcos Menezes Checando Você',
        message: `Oi! Notei que você não acessa a plataforma há ${activity.inactivityDays} dias. Tudo bem? Está precisando de ajuda com algo? Estou aqui para apoiar sua carreira!`,
        urgency: 'medium',
        actionLabel: 'Conversar com Marcos',
        actionPath: '/mentor-chat'
      });
    } else if (activity.inactivityDays >= 7) {
      messages.push({
        id: `inactivity-critical-${activity.inactivityDays}d`,
        type: 'inactivity_check',
        title: 'Marcos Menezes: Saudades Suas!',
        message: `Fala! Faz ${activity.inactivityDays} dias que você não vem por aqui. Tenho certeza que você está ocupado com shows e criatividade, mas não esqueça de organizar tudo na plataforma! Vamos conversar?`,
        urgency: 'high',
        actionLabel: 'Voltar à Plataforma',
        actionPath: '/dashboard'
      });
    }

    // 2. Detecção de Shows Parados
    if (activity.showsInProgress > 0) {
      const { data: stuckShows } = await supabase
        .from('shows')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['consultado', 'confirmado'])
        .lt('show_date', new Date().toISOString());

      if (stuckShows && stuckShows.length > 0) {
        messages.push({
          id: `stuck-shows-${stuckShows.length}`,
          type: 'reminder',
          title: 'Shows Atrasados',
          message: `Marcos Menezes aqui! Vi que você tem ${stuckShows.length} show(s) que já deveriam ter acontecido mas ainda estão marcados como em progresso. Vamos atualizar o status?`,
          urgency: 'high',
          actionLabel: 'Ver Shows',
          actionPath: '/shows'
        });
      }
    }

    // 3. Celebração de Milestones
    if (activity.tasksCompleted >= 5 && activity.tasksCompleted % 5 === 0) {
      messages.push({
        id: `milestone-${activity.tasksCompleted}`,
        type: 'celebration',
        title: 'Parabéns! 🎉',
        message: `Você completou ${activity.tasksCompleted} tarefas hoje! Isso é organização de verdade. Marcos Menezes está orgulhoso de você!`,
        urgency: 'low'
      });
    }

    // 4. Oportunidades Baseadas em Padrões
    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .eq('user_id', userId)
      .gte('show_date', new Date().toISOString())
      .order('show_date', { ascending: true })
      .limit(3);

    if (shows && shows.length === 0) {
      messages.push({
        id: 'opportunity-no-shows',
        type: 'opportunity',
        title: 'Marcos Menezes: Hora de Prospectar',
        message: 'Você não tem shows agendados para os próximos 30 dias. Que tal usarmos esse tempo para prospectar novos contratantes e expandir sua carreira?',
        urgency: 'medium',
        actionLabel: 'Novo Show',
        actionPath: '/shows/new'
      });
    } else if (shows && shows.length === 1) {
      messages.push({
        id: 'opportunity-single-show',
        type: 'opportunity',
        title: 'Marcos Menezes: Diversifique Sua Agenda',
        message: 'Você tem apenas 1 show agendado. Recomendo prospectar mais para manter um fluxo de caixa consistente.',
        urgency: 'low',
        actionLabel: 'Prospectar Shows',
        actionPath: '/shows/new'
      });
    }

    // 5. Lembretes de Tarefas Críticas
    const { data: pendingCritical } = await supabase
      .from('show_tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .in('category', ['legal', 'financial'])
      .limit(1);

    if (pendingCritical && pendingCritical.length > 0) {
      messages.push({
        id: 'reminder-critical-tasks',
        type: 'reminder',
        title: 'Marcos Menezes: Tarefas Críticas Pendentes',
        message: `Você tem tarefas críticas (contratos, financeiro) pendentes. Essas são as mais importantes! Vamos resolver isso agora?`,
        urgency: 'high',
        actionLabel: 'Ver Tarefas',
        actionPath: '/shows'
      });
    }

    return messages;
  } catch (error) {
    console.error('Erro ao gerar mensagens proativas:', error);
    return [];
  }
}

/**
 * Hook para monitorar atividade em tempo real
 * Deve ser chamado periodicamente (ex: a cada 5 minutos)
 */
export async function checkMentorNotifications(userId: string): Promise<void> {
  try {
    const messages = await generateProactiveMessages(userId);

    // Armazenar mensagens no banco de dados para exibição posterior
    if (messages.length > 0) {
      const { error } = await supabase
        .from('mentor_notifications')
        .insert(
          messages.map(msg => ({
            user_id: userId,
            type: msg.type,
            title: msg.title,
            message: msg.message,
            urgency: msg.urgency,
            action_label: msg.actionLabel,
            action_path: msg.actionPath,
            created_at: new Date().toISOString()
          }))
        );

      if (error) console.error('Erro ao salvar notificações:', error);
    }
  } catch (error) {
    console.error('Erro ao verificar notificações do mentor:', error);
  }
}

/**
 * Simula uma conversa contínua com o Marcos Menezes
 * Oferece suporte contextual baseado no que o usuário está fazendo
 */
export function generateContextualSupport(
  currentModule: string,
  userAction: string
): { message: string; suggestion: string } {
  const supports: Record<string, Record<string, { message: string; suggestion: string }>> = {
    shows: {
      create: {
        message: 'Ótimo! Você está criando um novo show. Marcos Menezes aqui para ajudar!',
        suggestion: 'Lembre-se: sempre defina um cachê realista que cubra seus custos e gere margem.'
      },
      edit: {
        message: 'Atualizando um show? Ótimo!',
        suggestion: 'Se está mudando o cachê ou split, considere o impacto na sua margem de lucro.'
      },
      view: {
        message: 'Revisando seus shows? Excelente organização!',
        suggestion: 'Verifique se há tarefas críticas (contratos, pagamentos) pendentes.'
      }
    },
    finance: {
      view: {
        message: 'Analisando seu financeiro? Marcos Menezes está aqui!',
        suggestion: 'Dica: Mantenha uma margem mínima de 20% para cobrir despesas operacionais.'
      },
      edit: {
        message: 'Ajustando seus números?',
        suggestion: 'Sempre considere os custos reais (logística, equipe, equipamento) ao calcular margens.'
      }
    },
    marketing: {
      create: {
        message: 'Criando conteúdo de marketing? Ótimo!',
        suggestion: 'Dica: Comece a promover o show com pelo menos 2 semanas de antecedência.'
      }
    },
    logistics: {
      edit: {
        message: 'Planejando a logística? Marcos Menezes aqui para apoiar!',
        suggestion: 'Detalhe bem os horários e paradas. Equipe bem descansada = melhor performance.'
      }
    }
  };

  const moduleSupport = supports[currentModule]?.[userAction];
  if (moduleSupport) {
    return moduleSupport;
  }

  return {
    message: 'Marcos Menezes está acompanhando você!',
    suggestion: 'Qualquer dúvida, é só chamar. Estou aqui para ajudar sua carreira a decolar!'
  };
}

/**
 * Cria uma notificação de check-in personalizada
 */
export function createCheckInNotification(
  inactivityDays: number,
  showsCount: number,
  tasksCount: number
): MentorProactiveMessage {
  let message = '';
  let urgency: 'low' | 'medium' | 'high' = 'low';

  if (inactivityDays >= 7) {
    message = `Fala! Faz ${inactivityDays} dias que você não vem por aqui. Saudades! Você tem ${showsCount} shows em progresso e ${tasksCount} tarefas. Vamos organizar isso?`;
    urgency = 'high';
  } else if (inactivityDays >= 3) {
    message = `Oi! Notei que você não acessa há ${inactivityDays} dias. Tudo bem? Você tem ${showsCount} shows em progresso. Precisa de ajuda?`;
    urgency = 'medium';
  } else {
    message = `Você está em dia! Você tem ${showsCount} shows em progresso e ${tasksCount} tarefas. Continue assim!`;
    urgency = 'low';
  }

  return {
    id: `checkin-${Date.now()}`,
    type: 'inactivity_check',
    title: 'Marcos Menezes: Check-in',
    message,
    urgency,
    actionLabel: 'Conversar',
    actionPath: '/mentor-chat'
  };
}
