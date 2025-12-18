// Planning AI Service - Geração de planejamentos com IA

interface PlanningPhase {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  color: string;
  tasks: {
    title: string;
    description: string;
    moduleType: 'content' | 'shows' | 'communication' | 'analysis' | 'kpis' | 'finance' | 'general';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string;
  }[];
}

interface AIGeneratedPlanning {
  name: string;
  description: string;
  phases: PlanningPhase[];
}

/**
 * Gera um planejamento estruturado usando IA (OpenAI)
 */
export async function generatePlanningWithAI(prompt: string): Promise<AIGeneratedPlanning> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-proj-your-openai-key-here') {
    // Modo fallback: retorna planejamento mock
    return generateMockPlanning(prompt);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em planejamento de projetos artísticos e musicais.
            Sua tarefa é criar um planejamento estruturado em fases, com tarefas específicas para cada módulo da plataforma TaskMaster.

            Módulos disponíveis:
            - content: Produção de conteúdo (gravações, posts, vídeos)
            - shows: Eventos, shows, ensaios, logística
            - communication: Comunicação, marketing, mídia, entrevistas
            - analysis: Análise de dados e desempenho
            - kpis: Indicadores e metas
            - finance: Orçamento e custos
            - general: Tarefas gerais

            Retorne APENAS um JSON válido seguindo esta estrutura:
            {
              "name": "Nome do Planejamento",
              "description": "Descrição resumida",
              "phases": [
                {
                  "name": "Nome da Fase",
                  "description": "Descrição da fase",
                  "startDate": "2025-11-15",
                  "endDate": "2025-12-15",
                  "status": "pending",
                  "color": "#3b82f6",
                  "tasks": [
                    {
                      "title": "Título da Tarefa",
                      "description": "Descrição detalhada",
                      "moduleType": "content",
                      "priority": "high",
                      "dueDate": "2025-11-20"
                    }
                  ]
                }
              ]
            }

            Crie fases realistas com datas coerentes. Use cores diferentes para cada fase.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Parse JSON response
    const planning = JSON.parse(content);
    return planning;

  } catch (error) {
    console.error('Error generating planning with AI:', error);
    // Fallback to mock planning
    return generateMockPlanning(prompt);
  }
}

/**
 * Gera um planejamento mock baseado no prompt (usado como fallback)
 */
function generateMockPlanning(prompt: string): AIGeneratedPlanning {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const threeMonths = new Date(today);
  threeMonths.setMonth(threeMonths.getMonth() + 3);

  // Detectar tipo de projeto baseado no prompt
  const isEP = /ep|extended play/i.test(prompt);
  const isAlbum = /album|álbum|disco/i.test(prompt);
  const isTour = /tour|turnê|shows/i.test(prompt);
  const isVideo = /clipe|vídeo|video|audiovisual/i.test(prompt);

  let projectName = 'Projeto Artístico';
  if (isEP) projectName = 'Lançamento de EP';
  else if (isAlbum) projectName = 'Lançamento de Álbum';
  else if (isTour) projectName = 'Turnê Nacional';
  else if (isVideo) projectName = 'Produção Audiovisual';

  const phases: PlanningPhase[] = [
    {
      name: 'Pré-Produção',
      description: 'Planejamento inicial, escolha de repertório e equipe',
      startDate: formatDate(today),
      endDate: formatDate(addDays(today, 30)),
      status: 'pending',
      color: '#8b5cf6',
      tasks: [
        {
          title: 'Definir repertório e conceito artístico',
          description: 'Escolher músicas, definir conceito visual e narrativa do projeto',
          moduleType: 'content',
          priority: 'high',
          dueDate: formatDate(addDays(today, 7))
        },
        {
          title: 'Montar equipe de produção',
          description: 'Contratar produtor musical, engenheiro de som, designer',
          moduleType: 'general',
          priority: 'high',
          dueDate: formatDate(addDays(today, 10))
        },
        {
          title: 'Definir orçamento total do projeto',
          description: 'Calcular custos de gravação, produção, marketing e distribuição',
          moduleType: 'finance',
          priority: 'high',
          dueDate: formatDate(addDays(today, 14))
        }
      ]
    },
    {
      name: 'Produção e Gravação',
      description: 'Gravação de músicas, produção de conteúdo visual',
      startDate: formatDate(addDays(today, 31)),
      endDate: formatDate(addDays(today, 75)),
      status: 'pending',
      color: '#3b82f6',
      tasks: [
        {
          title: 'Gravar faixas em estúdio',
          description: 'Sessões de gravação de vozes, instrumentos e arranjos',
          moduleType: 'content',
          priority: 'high',
          dueDate: formatDate(addDays(today, 60))
        },
        {
          title: 'Produzir clipe principal',
          description: 'Roteiro, filmagem e edição do videoclipe',
          moduleType: 'content',
          priority: 'high',
          dueDate: formatDate(addDays(today, 70))
        },
        {
          title: 'Criar conteúdo para redes sociais',
          description: 'Fotos, vídeos curtos, making of e bastidores',
          moduleType: 'content',
          priority: 'medium',
          dueDate: formatDate(addDays(today, 65))
        }
      ]
    },
    {
      name: 'Marketing e Divulgação',
      description: 'Estratégia de lançamento e comunicação',
      startDate: formatDate(addDays(today, 60)),
      endDate: formatDate(addDays(today, 120)),
      status: 'pending',
      color: '#f59e0b',
      tasks: [
        {
          title: 'Desenvolver estratégia de marketing digital',
          description: 'Planejamento de posts, anúncios e campanha de lançamento',
          moduleType: 'communication',
          priority: 'high',
          dueDate: formatDate(addDays(today, 70))
        },
        {
          title: 'Agendar entrevistas e press releases',
          description: 'Contato com mídia, podcasts e veículos de música',
          moduleType: 'communication',
          priority: 'medium',
          dueDate: formatDate(addDays(today, 85))
        },
        {
          title: 'Configurar distribuição em plataformas',
          description: 'Spotify, Apple Music, YouTube Music, Deezer',
          moduleType: 'content',
          priority: 'high',
          dueDate: formatDate(addDays(today, 75))
        },
        {
          title: 'Definir metas de alcance e engajamento',
          description: 'KPIs: streams, seguidores, engajamento, budget ROI',
          moduleType: 'kpis',
          priority: 'medium',
          dueDate: formatDate(addDays(today, 80))
        }
      ]
    },
    {
      name: 'Lançamento',
      description: 'Release oficial e eventos de lançamento',
      startDate: formatDate(addDays(today, 90)),
      endDate: formatDate(addDays(today, 105)),
      status: 'pending',
      color: '#10b981',
      tasks: [
        {
          title: 'Show de lançamento oficial',
          description: 'Evento presencial com performance completa',
          moduleType: 'shows',
          priority: 'high',
          dueDate: formatDate(addDays(today, 100))
        },
        {
          title: 'Live de lançamento nas redes',
          description: 'Transmissão ao vivo no Instagram/YouTube',
          moduleType: 'communication',
          priority: 'high',
          dueDate: formatDate(addDays(today, 95))
        },
        {
          title: 'Monitorar métricas de lançamento',
          description: 'Acompanhar streams, vendas e engajamento',
          moduleType: 'analysis',
          priority: 'high',
          dueDate: formatDate(addDays(today, 105))
        }
      ]
    },
    {
      name: 'Pós-Lançamento',
      description: 'Análise de resultados e planejamento futuro',
      startDate: formatDate(addDays(today, 106)),
      endDate: formatDate(addDays(today, 150)),
      status: 'pending',
      color: '#6366f1',
      tasks: [
        {
          title: 'Relatório completo de performance',
          description: 'Análise de métricas, ROI e alcance total',
          moduleType: 'analysis',
          priority: 'high',
          dueDate: formatDate(addDays(today, 120))
        },
        {
          title: 'Planejar próximos passos',
          description: 'Turnê, singles adicionais, parcerias',
          moduleType: 'general',
          priority: 'medium',
          dueDate: formatDate(addDays(today, 140))
        }
      ]
    }
  ];

  return {
    name: projectName,
    description: prompt,
    phases
  };
}

/**
 * Processa texto de projeto e gera planejamento estruturado com IA
 */
export async function parseProjectFromText(text: string, fileName?: string): Promise<AIGeneratedPlanning> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-proj-your-openai-key-here') {
    // Modo fallback: retorna planejamento mock
    return generateMockPlanningFromText(text, fileName);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em planejamento de projetos artísticos e musicais.

Analise o texto de um projeto artístico e extraia uma estrutura organizacional clara.

IMPORTANTE: Retorne APENAS um JSON válido, sem markdown, sem explicações extras.

Estrutura JSON esperada:
{
  "name": "Nome do Projeto",
  "description": "Breve descrição do objetivo",
  "phases": [
    {
      "name": "Nome da Fase",
      "description": "Descrição da fase",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "status": "pending",
      "color": "#hexcolor",
      "tasks": [
        {
          "title": "Título da tarefa",
          "description": "Descrição detalhada",
          "moduleType": "content|shows|communication|analysis|kpis|finance|general",
          "priority": "low|medium|high",
          "dueDate": "YYYY-MM-DD"
        }
      ]
    }
  ]
}

Cores recomendadas para fases:
- Pré-produção/Planejamento: #8b5cf6 (roxo)
- Produção/Gravação: #3b82f6 (azul)
- Marketing/Divulgação: #f59e0b (laranja)
- Lançamento: #10b981 (verde)
- Pós-lançamento/Análise: #6366f1 (índigo)

Módulos:
- content: Gravação, produção de conteúdo, vídeos
- shows: Shows, eventos, turnês, ensaios
- communication: Marketing, mídia, redes sociais
- analysis: Análise de dados e métricas
- kpis: Indicadores e metas
- finance: Orçamento, custos, receitas
- general: Tarefas gerais que não se encaixam nos outros

INSTRUÇÕES:
- Identifique TODAS as tarefas mencionadas ou implícitas
- Use datas realistas (se não mencionadas, estime baseado em ordem cronológica)
- Priorize tarefas críticas como "high"
- Organize em fases lógicas (pré, durante, pós)
- Se mencionar músicas, crie tarefas para cada uma
- Se mencionar datas específicas, use-as`
          },
          {
            role: 'user',
            content: `Analise este projeto e crie um planejamento estruturado:\n\n${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    // Remove markdown code blocks se presentes
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON response
    const planning = JSON.parse(content);
    return planning;

  } catch (error) {
    console.error('Error parsing project with AI:', error);
    // Fallback to mock planning
    return generateMockPlanningFromText(text, fileName);
  }
}

/**
 * Gera planejamento mock a partir de texto (fallback)
 */
function generateMockPlanningFromText(text: string, fileName?: string): AIGeneratedPlanning {
  const today = new Date();

  // Extrair nome do projeto do texto ou usar nome do arquivo
  let projectName = 'Projeto Artístico';
  const firstLine = text.split('\n')[0]?.trim();
  if (firstLine && firstLine.length < 100) {
    projectName = firstLine;
  } else if (fileName) {
    projectName = fileName.replace(/\.(pdf|docx|txt|md)$/i, '');
  }

  // Detectar tipo de projeto
  const isEP = /ep|extended play/i.test(text);
  const isAlbum = /album|álbum|disco/i.test(text);
  const isSingle = /single|música|faixa/i.test(text);
  const isVideo = /clipe|vídeo|video|audiovisual/i.test(text);

  return {
    name: projectName,
    description: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
    phases: [
      {
        name: 'Pré-Produção',
        description: 'Fase inicial de planejamento e organização',
        startDate: formatDate(today),
        endDate: formatDate(addDays(today, 30)),
        status: 'pending',
        color: '#8b5cf6',
        tasks: [
          {
            title: 'Revisar projeto completo',
            description: 'Analisar documento e validar informações',
            moduleType: 'general',
            priority: 'high',
            dueDate: formatDate(addDays(today, 7))
          },
          {
            title: 'Montar equipe de produção',
            description: 'Contratar profissionais necessários',
            moduleType: 'general',
            priority: 'high',
            dueDate: formatDate(addDays(today, 14))
          }
        ]
      },
      {
        name: 'Produção',
        description: 'Execução do projeto artístico',
        startDate: formatDate(addDays(today, 31)),
        endDate: formatDate(addDays(today, 75)),
        status: 'pending',
        color: '#3b82f6',
        tasks: [
          {
            title: 'Produzir conteúdo principal',
            description: 'Gravar e produzir material artístico',
            moduleType: 'content',
            priority: 'high',
            dueDate: formatDate(addDays(today, 60))
          }
        ]
      },
      {
        name: 'Lançamento',
        description: 'Divulgação e release do projeto',
        startDate: formatDate(addDays(today, 76)),
        endDate: formatDate(addDays(today, 105)),
        status: 'pending',
        color: '#10b981',
        tasks: [
          {
            title: 'Lançar projeto oficialmente',
            description: 'Disponibilizar nas plataformas e divulgar',
            moduleType: 'communication',
            priority: 'high',
            dueDate: formatDate(addDays(today, 90))
          }
        ]
      }
    ]
  };
}

/**
 * Processa arquivo PDF/DOCX e extrai planejamento
 */
export async function parsePlanningFromFile(file: File): Promise<AIGeneratedPlanning> {
  // Ler conteúdo do arquivo como texto
  const text = await readFileAsText(file);

  // Processar texto com IA
  return parseProjectFromText(text, file.name);
}

/**
 * Lê arquivo como texto
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text || '');
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

// Helper functions
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
