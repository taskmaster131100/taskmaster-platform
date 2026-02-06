/**
 * Serviço de Diagnóstico de Maturidade em 4 Estágios
 * Identifica o perfil do usuário e seu nível de maturidade na carreira musical
 */

export type MaturityStage = 'dreamer' | 'band_manager' | 'scaling_structure' | 'multi_artist_producer';

export interface UserProfile {
  stage: MaturityStage;
  stageLabel: string;
  description: string;
  characteristics: string[];
  challenges: string[];
  firstProjectSuggestion: string;
  mentorApproach: string;
}

export interface DiagnosticQuestion {
  id: string;
  category: string;
  question: string;
  answers: {
    text: string;
    stage: MaturityStage;
    weight: number;
  }[];
}

/**
 * Perguntas de diagnóstico para identificar o estágio
 */
export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 'q1',
    category: 'current_situation',
    question: 'Qual é sua situação atual?',
    answers: [
      {
        text: 'Tenho um sonho de ser artista/ter uma banda, mas ainda não comecei',
        stage: 'dreamer',
        weight: 3
      },
      {
        text: 'Tenho uma banda/projeto, mas sem estrutura formal',
        stage: 'band_manager',
        weight: 3
      },
      {
        text: 'Tenho uma banda/projeto com estrutura, mas espalhado em vários lugares',
        stage: 'scaling_structure',
        weight: 3
      },
      {
        text: 'Sou produtor e trabalho com vários artistas',
        stage: 'multi_artist_producer',
        weight: 3
      }
    ]
  },
  {
    id: 'q2',
    category: 'team_structure',
    question: 'Como está sua equipe?',
    answers: [
      {
        text: 'Ainda não tenho equipe, é só uma ideia',
        stage: 'dreamer',
        weight: 2
      },
      {
        text: 'Tenho alguns amigos/colaboradores, mas sem papéis definidos',
        stage: 'band_manager',
        weight: 2
      },
      {
        text: 'Tenho equipe com papéis definidos, mas comunicação desorganizada',
        stage: 'scaling_structure',
        weight: 2
      },
      {
        text: 'Tenho equipe profissional gerenciando múltiplos artistas',
        stage: 'multi_artist_producer',
        weight: 2
      }
    ]
  },
  {
    id: 'q3',
    category: 'business_experience',
    question: 'Qual é sua experiência com negócios musicais?',
    answers: [
      {
        text: 'Nenhuma, sou totalmente novo nisso',
        stage: 'dreamer',
        weight: 2
      },
      {
        text: 'Já fiz alguns shows, mas sem sistema de gestão',
        stage: 'band_manager',
        weight: 2
      },
      {
        text: 'Já administro alguns projetos, mas de forma desorganizada',
        stage: 'scaling_structure',
        weight: 2
      },
      {
        text: 'Tenho experiência administrando múltiplos artistas',
        stage: 'multi_artist_producer',
        weight: 2
      }
    ]
  },
  {
    id: 'q4',
    category: 'number_of_artists',
    question: 'Quantos artistas/projetos você gerencia?',
    answers: [
      {
        text: 'Nenhum ainda, é só um sonho',
        stage: 'dreamer',
        weight: 2
      },
      {
        text: '1 (eu mesmo ou minha banda)',
        stage: 'band_manager',
        weight: 2
      },
      {
        text: '1 a 2 projetos',
        stage: 'scaling_structure',
        weight: 2
      },
      {
        text: '3 ou mais artistas',
        stage: 'multi_artist_producer',
        weight: 2
      }
    ]
  },
  {
    id: 'q5',
    category: 'primary_need',
    question: 'Qual é sua maior necessidade agora?',
    answers: [
      {
        text: 'Aprender como começar e montar uma equipe',
        stage: 'dreamer',
        weight: 3
      },
      {
        text: 'Organizar e gerenciar melhor minha banda',
        stage: 'band_manager',
        weight: 3
      },
      {
        text: 'Centralizar informações e escalar meus projetos',
        stage: 'scaling_structure',
        weight: 3
      },
      {
        text: 'Gerenciar múltiplos artistas de forma eficiente',
        stage: 'multi_artist_producer',
        weight: 3
      }
    ]
  }
];

/**
 * Perfis de usuário para cada estágio
 */
export const USER_PROFILES: Record<MaturityStage, UserProfile> = {
  dreamer: {
    stage: 'dreamer',
    stageLabel: 'Estágio 1: O Sonhador',
    description: 'Você tem um sonho de ser artista ou ter uma banda, mas ainda não começou ou está nos primeiros passos.',
    characteristics: [
      'Tem paixão pela música',
      'Ainda não tem equipe formal',
      'Sem experiência em negócios musicais',
      'Precisa de orientação básica'
    ],
    challenges: [
      'Não sabe como montar uma equipe',
      'Desconhecimento de como começar',
      'Falta de estrutura e planejamento',
      'Insegurança sobre o caminho'
    ],
    firstProjectSuggestion: 'Criar seu primeiro projeto piloto (lançar uma música, gravar um vídeo, fazer um show local)',
    mentorApproach: 'Educacional e inspirador. Marcos vai fazer perguntas para entender sua visão, ajudar a definir o primeiro passo concreto e montar um plano básico.'
  },
  band_manager: {
    stage: 'band_manager',
    stageLabel: 'Estágio 2: Gerenciador de Banda',
    description: 'Você já tem uma banda ou projeto, mas ainda está aprendendo a gerenciar e organizar.',
    characteristics: [
      'Tem uma banda/projeto ativo',
      'Faz shows ocasionais',
      'Equipe informal',
      'Gestão desorganizada'
    ],
    challenges: [
      'Falta de sistema de gestão',
      'Comunicação desorganizada com a equipe',
      'Dificuldade em controlar financeiro',
      'Sem planejamento estratégico'
    ],
    firstProjectSuggestion: 'Organizar uma turnê ou série de shows com planejamento estruturado',
    mentorApproach: 'Prático e organizador. Marcos vai ajudar a centralizar informações, criar processos básicos e planejar o próximo grande projeto.'
  },
  scaling_structure: {
    stage: 'scaling_structure',
    stageLabel: 'Estágio 3: Estrutura em Escala',
    description: 'Você tem uma estrutura organizacional, mas está espalhada em vários lugares e precisa de controle e acompanhamento.',
    characteristics: [
      'Tem estrutura organizacional',
      'Múltiplos projetos ou artistas',
      'Informações em vários lugares',
      'Crescimento desorganizado'
    ],
    challenges: [
      'Falta de visão centralizada',
      'Dificuldade em acompanhar tudo',
      'Escalabilidade limitada',
      'Perda de informações'
    ],
    firstProjectSuggestion: 'Centralizar toda a gestão em uma plataforma e criar dashboards de acompanhamento',
    mentorApproach: 'Estratégico e analítico. Marcos vai ajudar a consolidar informações, criar métricas de acompanhamento e planejar a escalabilidade.'
  },
  multi_artist_producer: {
    stage: 'multi_artist_producer',
    stageLabel: 'Estágio 4: Produtor Multi-Artista',
    description: 'Você é um produtor que trabalha com múltiplos artistas e precisa gerenciar uma operação complexa.',
    characteristics: [
      'Trabalha com 3+ artistas',
      'Estrutura profissional',
      'Operação complexa',
      'Crescimento contínuo'
    ],
    challenges: [
      'Gerenciar múltiplos artistas simultaneamente',
      'Manter qualidade em todos os projetos',
      'Escalabilidade da operação',
      'Necessidade de escritório formal'
    ],
    firstProjectSuggestion: 'Criar um sistema de gestão centralizado para todos os artistas com métricas e KPIs',
    mentorApproach: 'Executivo e estratégico. Marcos vai atuar como um conselheiro de negócios, ajudando a otimizar operações, escalar e preparar para o próximo nível.'
  }
};

/**
 * Calcula o estágio baseado nas respostas do diagnóstico
 */
export function calculateMaturityStage(answers: Record<string, MaturityStage>): MaturityStage {
  const stageScores: Record<MaturityStage, number> = {
    dreamer: 0,
    band_manager: 0,
    scaling_structure: 0,
    multi_artist_producer: 0
  };

  // Contar votos ponderados
  Object.values(answers).forEach(stage => {
    stageScores[stage]++;
  });

  // Retornar estágio com maior pontuação
  let maxStage: MaturityStage = 'dreamer';
  let maxScore = 0;

  Object.entries(stageScores).forEach(([stage, score]) => {
    if (score > maxScore) {
      maxScore = score;
      maxStage = stage as MaturityStage;
    }
  });

  return maxStage;
}

/**
 * Gera o perfil completo do usuário
 */
export function getUserProfile(stage: MaturityStage): UserProfile {
  return USER_PROFILES[stage];
}

/**
 * Gera as próximas perguntas de diagnóstico baseadas nas respostas anteriores
 */
export function getNextDiagnosticQuestions(
  currentAnswers: Record<string, MaturityStage>,
  askedQuestions: string[]
): DiagnosticQuestion[] {
  return DIAGNOSTIC_QUESTIONS.filter(q => !askedQuestions.includes(q.id));
}

/**
 * Cria um plano de ação inicial baseado no estágio
 */
export interface ActionPlan {
  title: string;
  description: string;
  steps: {
    order: number;
    title: string;
    description: string;
    estimatedTime: string;
    resources: string[];
  }[];
  firstProject: {
    name: string;
    description: string;
    duration: string;
    expectedOutcome: string;
  };
}

export function generateActionPlan(stage: MaturityStage): ActionPlan {
  const plans: Record<MaturityStage, ActionPlan> = {
    dreamer: {
      title: 'Seu Plano de Início - Do Sonho à Realidade',
      description: 'Um plano estruturado para transformar seu sonho em realidade',
      steps: [
        {
          order: 1,
          title: 'Definir Sua Visão Artística',
          description: 'Entender seu estilo, público-alvo e diferencial',
          estimatedTime: '1 semana',
          resources: ['Marcos Menezes (consultoria)', 'Questionário de perfil artístico']
        },
        {
          order: 2,
          title: 'Montar Sua Equipe Inicial',
          description: 'Identificar e convidar pessoas-chave para seu projeto',
          estimatedTime: '2 semanas',
          resources: ['Guia de papéis e responsabilidades', 'Contato com potenciais colaboradores']
        },
        {
          order: 3,
          title: 'Criar Seu Primeiro Projeto',
          description: 'Lançar seu primeiro trabalho (música, vídeo, show)',
          estimatedTime: '4-8 semanas',
          resources: ['Estúdio/equipamento', 'Plataformas de distribuição']
        },
        {
          order: 4,
          title: 'Estabelecer Presença Digital',
          description: 'Criar redes sociais e começar a construir comunidade',
          estimatedTime: '2 semanas',
          resources: ['Redes sociais', 'Conteúdo de marketing']
        }
      ],
      firstProject: {
        name: 'Lançamento do Primeiro Single/Vídeo',
        description: 'Gravar e lançar sua primeira música ou vídeo profissional',
        duration: '4-8 semanas',
        expectedOutcome: 'Ter seu primeiro trabalho profissional lançado e começar a construir audiência'
      }
    },
    band_manager: {
      title: 'Seu Plano de Organização - Estruturando Sua Banda',
      description: 'Um plano para organizar e profissionalizar sua banda',
      steps: [
        {
          order: 1,
          title: 'Centralizar Informações',
          description: 'Reunir todos os dados em um único lugar (FlexMax)',
          estimatedTime: '1 semana',
          resources: ['FlexMax', 'Documentos da banda']
        },
        {
          order: 2,
          title: 'Definir Papéis e Responsabilidades',
          description: 'Deixar claro quem faz o quê na banda',
          estimatedTime: '1 semana',
          resources: ['Guia de papéis', 'Reunião com a banda']
        },
        {
          order: 3,
          title: 'Planejar Turnê/Série de Shows',
          description: 'Organizar uma sequência de shows com planejamento',
          estimatedTime: '4 semanas',
          resources: ['Calendário de shows', 'Logística']
        },
        {
          order: 4,
          title: 'Implementar Sistema de Gestão',
          description: 'Começar a usar FlexMax para gerenciar tudo',
          estimatedTime: '2 semanas',
          resources: ['Treinamento FlexMax', 'Documentação']
        }
      ],
      firstProject: {
        name: 'Turnê Organizada de 5-10 Shows',
        description: 'Planejar e executar uma série de shows com logística estruturada',
        duration: '4 semanas',
        expectedOutcome: 'Demonstrar que sua banda é profissional e gerar receita consistente'
      }
    },
    scaling_structure: {
      title: 'Seu Plano de Escalabilidade - Centralizando e Crescendo',
      description: 'Um plano para centralizar operações e escalar seus projetos',
      steps: [
        {
          order: 1,
          title: 'Auditoria de Operações',
          description: 'Mapear toda a estrutura atual e identificar gaps',
          estimatedTime: '2 semanas',
          resources: ['Marcos Menezes (consultoria)', 'Auditoria operacional']
        },
        {
          order: 2,
          title: 'Centralizar em FlexMax',
          description: 'Migrar todos os dados e processos para a plataforma',
          estimatedTime: '3 semanas',
          resources: ['FlexMax', 'Treinamento da equipe']
        },
        {
          order: 3,
          title: 'Criar Dashboards de Acompanhamento',
          description: 'Estabelecer KPIs e métricas de sucesso',
          estimatedTime: '2 semanas',
          resources: ['Dashboard executivo', 'Métricas']
        },
        {
          order: 4,
          title: 'Planejar Escalabilidade',
          description: 'Definir como crescer mantendo qualidade',
          estimatedTime: '2 semanas',
          resources: ['Plano estratégico', 'Marcos Menezes (consultoria)']
        }
      ],
      firstProject: {
        name: 'Consolidação Operacional e Lançamento de Novo Projeto',
        description: 'Centralizar tudo e lançar um novo projeto maior (álbum, turnê, documentário)',
        duration: '8 semanas',
        expectedOutcome: 'Ter operação centralizada e lançar novo projeto de impacto'
      }
    },
    multi_artist_producer: {
      title: 'Seu Plano de Crescimento - Otimizando Múltiplos Artistas',
      description: 'Um plano para otimizar e escalar sua operação multi-artista',
      steps: [
        {
          order: 1,
          title: 'Análise Estratégica de Portfólio',
          description: 'Avaliar cada artista e definir estratégia individual',
          estimatedTime: '3 semanas',
          resources: ['Marcos Menezes (consultoria executiva)', 'Análise de portfólio']
        },
        {
          order: 2,
          title: 'Implementar Sistema de Gestão Centralizado',
          description: 'FlexMax para gerenciar todos os artistas',
          estimatedTime: '4 semanas',
          resources: ['FlexMax multi-artista', 'Treinamento da equipe']
        },
        {
          order: 3,
          title: 'Criar Estrutura de Escritório',
          description: 'Definir equipe, processos e infraestrutura',
          estimatedTime: '4 semanas',
          resources: ['Organograma', 'Processos operacionais']
        },
        {
          order: 4,
          title: 'Planejar Crescimento e Novas Oportunidades',
          description: 'Identificar oportunidades de expansão',
          estimatedTime: '3 semanas',
          resources: ['Plano estratégico 5 anos', 'Marcos Menezes (consultoria)']
        }
      ],
      firstProject: {
        name: 'Lançamento Coordenado de Projetos Simultâneos',
        description: 'Coordenar lançamentos de múltiplos artistas de forma estratégica',
        duration: '8-12 semanas',
        expectedOutcome: 'Demonstrar capacidade de gerenciar múltiplos artistas e gerar impacto no mercado'
      }
    }
  };

  return plans[stage];
}
