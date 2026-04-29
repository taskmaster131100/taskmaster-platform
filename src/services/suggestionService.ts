import { supabase } from '../lib/supabase';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'info' | 'success' | 'action';
  module: 'shows' | 'releases' | 'tasks' | 'finance';
  actionLabel?: string;
  actionPath?: string;
}

export const getProactiveSuggestions = async (): Promise<Suggestion[]> => {
  const suggestions: Suggestion[] = [];
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    // 1. Verificar Shows Próximos sem Tarefas
    const { data: upcomingShows } = await supabase
      .from('shows')
      .select('id, title, date')
      .gte('date', now.toISOString().split('T')[0])
      .lte('date', nextWeek.toISOString().split('T')[0]);

    if (upcomingShows && upcomingShows.length > 0) {
      for (const show of upcomingShows) {
        const { count } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('related_id', show.id);

        if (count === 0) {
          suggestions.push({
            id: `show-tasks-${show.id}`,
            title: `Show sem Planejamento: ${show.title}`,
            description: `Este show acontece em breve (${new Date(show.date).toLocaleDateString()}) e ainda não possui tarefas ou checklist definidos.`,
            type: 'warning',
            module: 'shows',
            actionLabel: 'Criar Checklist',
            actionPath: `/shows/${show.id}`
          });
        }
      }
    }

    // 2. Verificar Lançamentos Próximos (D-30)
    const { data: upcomingReleases } = await supabase
      .from('releases')
      .select('id, title, release_date')
      .gte('release_date', now.toISOString())
      .lte('release_date', new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString());

    if (upcomingReleases && upcomingReleases.length > 0) {
      suggestions.push({
        id: 'release-planning',
        title: 'Foco em Lançamentos',
        description: `Você tem ${upcomingReleases.length} lançamentos previstos para os próximos 30 dias. Verifique o cronograma D-30.`,
        type: 'info',
        module: 'releases',
        actionLabel: 'Ver Lançamentos',
        actionPath: '/releases'
      });
    }

    // 3. Verificar Tarefas Atrasadas
    const { data: overdueTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('status', 'pending')
      .lt('due_date', now.toISOString());

    if (overdueTasks && overdueTasks.length > 0) {
      suggestions.push({
        id: 'overdue-tasks',
        title: 'Tarefas Atrasadas',
        description: `Existem ${overdueTasks.length} tarefas com prazo vencido que precisam de atenção imediata.`,
        type: 'warning',
        module: 'tasks',
        actionLabel: 'Resolver Agora',
        actionPath: '/tasks'
      });
    }

    // 4. Orientação para conta nova sem dados
    const { count: artistCount } = await supabase.from('artists').select('*', { count: 'exact', head: true });
    const { count: showCount } = await supabase.from('shows').select('*', { count: 'exact', head: true });

    if (!artistCount || artistCount === 0) {
      suggestions.push({
        id: 'onboarding-artist',
        title: 'Cadastre seu primeiro artista',
        description: 'Comece criando o perfil do artista que você representa. É o ponto de partida para organizar shows, lançamentos e projetos.',
        type: 'action',
        module: 'tasks',
        actionLabel: 'Criar Artista',
        actionPath: '/artists'
      });
    } else if (!showCount || showCount === 0) {
      suggestions.push({
        id: 'onboarding-show',
        title: 'Registre seu próximo show',
        description: 'Cadastre um show para começar a gerar checklists, tarefas de produção e acompanhar o financeiro.',
        type: 'info',
        module: 'shows',
        actionLabel: 'Cadastrar Show',
        actionPath: '/shows'
      });
    } else {
      // 4. Sugestão de Faturamento (conta com dados)
      suggestions.push({
        id: 'finance-check',
        title: 'Revisão Financeira',
        description: 'Que tal revisar o faturamento dos shows recentes e atualizar as entradas financeiras?',
        type: 'action',
        module: 'finance',
        actionLabel: 'Ver Financeiro',
        actionPath: '/finance'
      });
    }

  } catch (error) {
    console.error('Error generating suggestions:', error);
  }

  return suggestions;
};
