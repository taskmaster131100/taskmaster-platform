import { supabase } from '../lib/supabase';

export interface MentorDiagnostic {
  category: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  recommendation: string;
  actionPath?: string;
  dataPoints?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
}

export interface MentorExecutiveSummary {
  overallHealth: number; // 0-100
  activeShows: number;
  upcomingRevenue: number;
  pendingTasks: number;
  diagnostics: MentorDiagnostic[];
  recommendations: string[];
}

/**
 * Análise Cruzada de Dados
 * Lê dados de múltiplos módulos para fornecer insights estratégicos
 */
export async function getMentorExecutiveSummary(): Promise<MentorExecutiveSummary> {
  try {
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // 1. Buscar shows próximos
    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .gte('show_date', now.toISOString().split('T')[0])
      .lte('show_date', next30Days.toISOString().split('T')[0]);

    const activeShows = (shows || []).length;

    // 2. Calcular receita prevista
    const upcomingRevenue = (shows || []).reduce((sum, show: any) => sum + (show.value || 0), 0);

    // 3. Contar tarefas pendentes
    let pendingTasks = 0;
    for (const show of (shows || [])) {
      const { count } = await supabase
        .from('show_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('show_id', show.id)
        .eq('status', 'pending');
      pendingTasks += count || 0;
    }

    // 4. Gerar diagnósticos cruzados
    const diagnostics: MentorDiagnostic[] = [];

    // Diagnóstico de Saúde Financeira
    if (upcomingRevenue > 50000) {
      diagnostics.push({
        category: 'financial',
        severity: 'success',
        title: 'Saúde Financeira Excelente',
        message: `Você tem R$ ${upcomingRevenue.toLocaleString('pt-BR')} em receita prevista para os próximos 30 dias.`,
        recommendation: 'Mantenha essa performance e considere expandir sua carteira de artistas.',
        dataPoints: [
          { label: 'Receita Prevista (30 dias)', value: `R$ ${upcomingRevenue.toLocaleString('pt-BR')}`, trend: 'up' }
        ]
      });
    } else if (upcomingRevenue > 20000) {
      diagnostics.push({
        category: 'financial',
        severity: 'info',
        title: 'Receita Moderada',
        message: `Receita prevista de R$ ${upcomingRevenue.toLocaleString('pt-BR')} nos próximos 30 dias.`,
        recommendation: 'Considere prospectar novos shows para aumentar sua receita.',
        dataPoints: [
          { label: 'Receita Prevista (30 dias)', value: `R$ ${upcomingRevenue.toLocaleString('pt-BR')}`, trend: 'stable' }
        ]
      });
    } else if (upcomingRevenue > 0) {
      diagnostics.push({
        category: 'financial',
        severity: 'warning',
        title: 'Receita Baixa',
        message: `Apenas R$ ${upcomingRevenue.toLocaleString('pt-BR')} em receita prevista para os próximos 30 dias.`,
        recommendation: 'Aumente seus esforços de prospecção para novos contratantes.',
        actionPath: '/shows',
        dataPoints: [
          { label: 'Receita Prevista (30 dias)', value: `R$ ${upcomingRevenue.toLocaleString('pt-BR')}`, trend: 'down' }
        ]
      });
    } else {
      diagnostics.push({
        category: 'financial',
        severity: 'critical',
        title: 'Sem Receita Prevista',
        message: 'Você não tem shows agendados para os próximos 30 dias.',
        recommendation: 'Comece a prospectar novos shows imediatamente para manter o fluxo de caixa.',
        actionPath: '/shows'
      });
    }

    // Diagnóstico de Produção
    if (pendingTasks > 10) {
      diagnostics.push({
        category: 'production',
        severity: 'warning',
        title: 'Muitas Tarefas Pendentes',
        message: `Você tem ${pendingTasks} tarefas pendentes em seus shows.`,
        recommendation: 'Priorize as tarefas críticas (contratos, pagamentos, logística) para evitar atrasos.',
        dataPoints: [
          { label: 'Tarefas Pendentes', value: pendingTasks }
        ]
      });
    } else if (pendingTasks > 0) {
      diagnostics.push({
        category: 'production',
        severity: 'info',
        title: 'Tarefas em Progresso',
        message: `${pendingTasks} tarefas pendentes em seus shows.`,
        recommendation: 'Continue acompanhando o progresso de suas tarefas.',
        dataPoints: [
          { label: 'Tarefas Pendentes', value: pendingTasks }
        ]
      });
    } else {
      diagnostics.push({
        category: 'production',
        severity: 'success',
        title: 'Tudo em Dia',
        message: 'Todas as tarefas de seus shows estão completas!',
        recommendation: 'Excelente organização. Aproveite para planejar novos eventos.'
      });
    }

    // Diagnóstico de Agenda
    if (activeShows === 0) {
      diagnostics.push({
        category: 'logistics',
        severity: 'critical',
        title: 'Sem Shows Agendados',
        message: 'Sua agenda está vazia para os próximos 30 dias.',
        recommendation: 'Comece a agendar shows para manter sua carreira em movimento.',
        actionPath: '/shows'
      });
    } else if (activeShows === 1) {
      diagnostics.push({
        category: 'logistics',
        severity: 'warning',
        title: 'Agenda Leve',
        message: 'Você tem apenas 1 show agendado para os próximos 30 dias.',
        recommendation: 'Aumente a frequência de shows para maximizar sua receita.',
        actionPath: '/shows',
        dataPoints: [
          { label: 'Shows Próximos (30 dias)', value: activeShows }
        ]
      });
    } else {
      diagnostics.push({
        category: 'logistics',
        severity: 'success',
        title: 'Agenda Saudável',
        message: `Você tem ${activeShows} shows agendados para os próximos 30 dias.`,
        recommendation: 'Mantenha essa frequência para garantir um fluxo de caixa consistente.',
        dataPoints: [
          { label: 'Shows Próximos (30 dias)', value: activeShows, trend: 'up' }
        ]
      });
    }

    // 5. Calcular saúde geral
    let overallHealth = 50;
    if (activeShows > 5) overallHealth += 20;
    else if (activeShows > 2) overallHealth += 10;
    
    if (upcomingRevenue > 50000) overallHealth += 20;
    else if (upcomingRevenue > 20000) overallHealth += 10;
    
    if (pendingTasks < 5) overallHealth += 10;

    overallHealth = Math.min(100, overallHealth);

    // 6. Gerar recomendações gerais
    const recommendations: string[] = [];
    if (activeShows === 0) {
      recommendations.push('Comece a prospectar novos shows para sua agenda');
    }
    if (pendingTasks > 5) {
      recommendations.push('Priorize completar as tarefas pendentes de seus shows');
    }
    if (upcomingRevenue < 20000) {
      recommendations.push('Aumente seus esforços de prospecção para novos contratantes');
    }
    if (recommendations.length === 0) {
      recommendations.push('Você está no caminho certo! Continue mantendo essa excelente organização.');
    }

    return {
      overallHealth,
      activeShows,
      upcomingRevenue,
      pendingTasks,
      diagnostics,
      recommendations
    };
  } catch (error) {
    console.error('Erro ao gerar diagnóstico do Mentor:', error);
    return {
      overallHealth: 0,
      activeShows: 0,
      upcomingRevenue: 0,
      pendingTasks: 0,
      diagnostics: [],
      recommendations: ['Erro ao carregar diagnóstico. Tente novamente mais tarde.']
    };
  }
}

/**
 * Análise Pós-Evento (Post-Mortem)
 * Avalia o desempenho de um show após sua realização
 */
export async function getShowPostMortemAnalysis(showId: string): Promise<MentorDiagnostic[]> {
  try {
    const { data: show } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single();

    if (!show) return [];

    const diagnostics: MentorDiagnostic[] = [];

    // Análise Financeira
    const artistShare = (show.value * show.artist_split) / 100;
    const productionShare = show.value - artistShare;

    diagnostics.push({
      category: 'financial',
      severity: 'info',
      title: 'Análise Financeira do Show',
      message: `O show "${show.title}" gerou uma receita total de R$ ${show.value.toLocaleString('pt-BR')}.`,
      recommendation: `Artista recebeu R$ ${artistShare.toLocaleString('pt-BR')} (${show.artist_split}%) e a produção ficou com R$ ${productionShare.toLocaleString('pt-BR')} (${100 - show.artist_split}%).`,
      dataPoints: [
        { label: 'Receita Total', value: `R$ ${show.value.toLocaleString('pt-BR')}` },
        { label: 'Share do Artista', value: `R$ ${artistShare.toLocaleString('pt-BR')}` },
        { label: 'Share da Produção', value: `R$ ${productionShare.toLocaleString('pt-BR')}` }
      ]
    });

    // Análise de Execução
    const { data: completedTasks } = await supabase
      .from('show_tasks')
      .select('*')
      .eq('show_id', showId)
      .eq('status', 'completed');

    const { data: allTasks } = await supabase
      .from('show_tasks')
      .select('*')
      .eq('show_id', showId);

    const completionRate = allTasks?.length ? ((completedTasks?.length || 0) / allTasks.length) * 100 : 0;

    if (completionRate === 100) {
      diagnostics.push({
        category: 'production',
        severity: 'success',
        title: 'Execução Perfeita',
        message: 'Todas as tarefas do show foram completadas com sucesso!',
        recommendation: 'Excelente organização e execução. Mantenha esse padrão de qualidade.',
        dataPoints: [
          { label: 'Taxa de Conclusão', value: `${completionRate.toFixed(0)}%`, trend: 'up' }
        ]
      });
    } else if (completionRate >= 80) {
      diagnostics.push({
        category: 'production',
        severity: 'info',
        title: 'Execução Bem-Sucedida',
        message: `${completionRate.toFixed(0)}% das tarefas foram completadas.`,
        recommendation: 'Bom desempenho. Revise as tarefas não completadas para aprender com a experiência.',
        dataPoints: [
          { label: 'Taxa de Conclusão', value: `${completionRate.toFixed(0)}%` }
        ]
      });
    }

    return diagnostics;
  } catch (error) {
    console.error('Erro ao gerar análise pós-evento:', error);
    return [];
  }
}
