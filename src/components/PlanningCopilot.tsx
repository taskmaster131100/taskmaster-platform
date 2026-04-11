import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Send, Bot, User, Loader2, CheckCircle2,
  Calendar, Music, Megaphone, Truck, DollarSign,
  Target, Zap, Paperclip, FileText, X, Users, Bell, Mic, MicOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './auth/AuthProvider';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'plan' | 'suggestion' | 'alert' | 'file_analysis';
  metadata?: any;
}

interface PlatformContext {
  projects: any[];
  shows: any[];
  tasks: any[];
  teamMembers: any[];
  financials: any[];
  calendarEvents: any[];
  artists: any[];
}

const FOUR_PILLARS = [
  { id: 'content', label: 'Conteúdo', icon: Music, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'shows', label: 'Shows & Vendas', icon: Megaphone, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'logistics', label: 'Logística', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'strategy', label: 'Estratégia', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50' }
];

// Carregar contexto completo da plataforma para a IA
// organizationId garante que a IA só vê dados da organização do usuário logado
async function loadPlatformContext(organizationId?: string | null): Promise<PlatformContext> {
  const context: PlatformContext = {
    projects: [],
    shows: [],
    tasks: [],
    teamMembers: [],
    financials: [],
    calendarEvents: [],
    artists: []
  };

  try {
    // Projetos ativos — filtrado pela organização para evitar projetos de outras orgs
    let projectsQuery = supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(30);
    if (organizationId) projectsQuery = projectsQuery.eq('organization_id', organizationId);
    const { data: projects } = await projectsQuery;
    context.projects = projects || [];

    // Shows próximos
    const now = new Date().toISOString().split('T')[0];
    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .gte('show_date', now)
      .order('show_date', { ascending: true })
      .limit(10);
    context.shows = shows || [];

    // Tarefas pendentes — filtrado pela organização
    let tasksQuery = supabase
      .from('tasks')
      .select('id, title, status, priority, due_date, project_id, workstream')
      .not('status', 'eq', 'done')
      .order('due_date', { ascending: true })
      .limit(20);
    if (organizationId) tasksQuery = tasksQuery.eq('organization_id', organizationId);
    const { data: tasks } = await tasksQuery;
    context.tasks = tasks || [];

    // Membros da equipe
    const { data: team } = await supabase
      .from('team_invites')
      .select('*')
      .eq('status', 'accepted')
      .limit(20);
    context.teamMembers = team || [];

    // Artistas — filtrado pela organização
    let artistsQuery = supabase.from('artists').select('*').limit(20);
    if (organizationId) artistsQuery = artistsQuery.eq('organization_id', organizationId);
    const { data: artists } = await artistsQuery;
    context.artists = artists || [];

  } catch (error) {
    console.error('Erro ao carregar contexto:', error);
  }

  return context;
}

// Formatar contexto para o system prompt — compacto para reduzir tokens
function formatContextForAI(ctx: PlatformContext): string {
  let contextStr = '';

  if (ctx.projects.length > 0) {
    // Limitar a 10 projetos mais recentes; descrição truncada em 60 chars
    contextStr += '\nPROJETOS ATIVOS:\n';
    ctx.projects.slice(0, 10).forEach(p => {
      const desc = (p.description || '').slice(0, 60);
      contextStr += `ID:"${p.id}" Nome:"${p.title || p.name}"${desc ? ` Desc:"${desc}"` : ''}\n`;
    });
  }

  if (ctx.shows.length > 0) {
    contextStr += '\nSHOWS PRÓXIMOS:\n';
    ctx.shows.slice(0, 5).forEach(s => {
      contextStr += `"${s.title || s.venue}" ${s.show_date} ${s.status || 'pendente'}\n`;
    });
  }

  if (ctx.tasks.length > 0) {
    // Só tarefas com prazo definido ou alta prioridade para economizar tokens
    const relevantTasks = ctx.tasks
      .filter(t => t.due_date || t.priority === 'high' || t.priority === 'urgent')
      .slice(0, 10);
    if (relevantTasks.length > 0) {
      contextStr += '\nTAREFAS PENDENTES (com prazo/urgentes):\n';
      relevantTasks.forEach(t => {
        contextStr += `"${t.title}" prazo:${t.due_date || 'sem'} prioridade:${t.priority || 'normal'}\n`;
      });
    }
  }

  if (ctx.teamMembers.length > 0) {
    contextStr += '\nEQUIPE:\n';
    ctx.teamMembers.slice(0, 10).forEach(m => {
      contextStr += `${m.name || m.email} (${m.role || 'Membro'})\n`;
    });
  }

  if (ctx.artists.length > 0) {
    contextStr += '\nARTISTAS:\n';
    ctx.artists.slice(0, 10).forEach(a => {
      contextStr += `"${a.name || a.artist_name}" gênero:${a.genre || '?'}\n`;
    });
  }

  return contextStr || '\nNenhum dado cadastrado ainda.';
}

// Valores válidos de workstream no TaskBoard
const VALID_WORKSTREAMS = [
  'producao_musical', 'conteudo', 'marketing', 'shows',
  'logistica', 'estrategia', 'financeiro', 'lancamento', 'geral'
];

// Mapa de normalização: termos que a IA pode produzir → valor canônico
const WORKSTREAM_MAP: Record<string, string> = {
  // producao_musical
  'producao': 'producao_musical', 'producao musical': 'producao_musical',
  'production': 'producao_musical', 'music production': 'producao_musical',
  'studio': 'producao_musical', 'gravacao': 'producao_musical',
  'recording': 'producao_musical', 'mixagem': 'producao_musical',
  'masterizacao': 'producao_musical',
  // conteudo
  'conteudo': 'conteudo', 'content': 'conteudo', 'conteúdo': 'conteudo',
  'video': 'conteudo', 'foto': 'conteudo', 'redes sociais': 'conteudo',
  'social media': 'conteudo', 'design': 'conteudo',
  // marketing
  'marketing': 'marketing', 'divulgacao': 'marketing',
  'publicidade': 'marketing', 'ads': 'marketing', 'midia': 'marketing',
  'pr': 'marketing', 'imprensa': 'marketing',
  // shows
  'shows': 'shows', 'show': 'shows', 'apresentacao': 'shows',
  'performance': 'shows', 'live': 'shows', 'apresentações': 'shows',
  'turnê': 'shows', 'turne': 'shows', 'tour': 'shows',
  // logistica
  'logistica': 'logistica', 'logística': 'logistica',
  'logistics': 'logistica', 'rider': 'logistica',
  'transporte': 'logistica', 'hospedagem': 'logistica',
  // estrategia
  'estrategia': 'estrategia', 'estratégia': 'estrategia',
  'strategy': 'estrategia', 'planejamento': 'estrategia',
  'planning': 'estrategia', 'business': 'estrategia',
  // financeiro
  'financeiro': 'financeiro', 'finance': 'financeiro',
  'financeira': 'financeiro', 'contratos': 'financeiro',
  'budget': 'financeiro', 'orcamento': 'financeiro',
  'pagamento': 'financeiro', 'cachê': 'financeiro',
  // lancamento
  'lancamento': 'lancamento', 'lançamento': 'lancamento',
  'release': 'lancamento', 'single': 'lancamento',
  'album': 'lancamento', 'ep': 'lancamento', 'drop': 'lancamento',
};

/**
 * Normaliza o campo category/workstream vindo da IA para um valor
 * válido do TaskBoard. Nunca retorna valor inválido.
 */
function normalizeWorkstream(raw: string | undefined | null): string {
  if (!raw) return 'geral';
  const normalized = raw.toLowerCase().trim();
  // Já é um valor válido
  if (VALID_WORKSTREAMS.includes(normalized)) return normalized;
  // Tentar match exato no mapa
  if (WORKSTREAM_MAP[normalized]) return WORKSTREAM_MAP[normalized];
  // Tentar match parcial (ex: "marketing digital" → "marketing")
  for (const [key, value] of Object.entries(WORKSTREAM_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return value;
  }
  return 'geral';
}

/**
 * Remove TODAS as tags internas e payloads JSON da resposta da IA
 * antes de exibir ao usuário. Última linha de defesa contra vazamento de payload.
 */
function sanitizeForDisplay(text: string): string {
  return text
    // Remover blocos completos com tags de abertura E fechamento
    .replace(/\[CRIAR_PROJETO\][\s\S]*?\[\/CRIAR_PROJETO\]/g, '')
    .replace(/\[ATUALIZAR_PROJETO\][\s\S]*?\[\/ATUALIZAR_PROJETO\]/g, '')
    .replace(/\[CRIAR_ARTISTA\][\s\S]*?\[\/CRIAR_ARTISTA\]/g, '')
    // Remover blocos TRUNCADOS (tag de abertura sem fechamento — truncamento do modelo)
    .replace(/\[CRIAR_PROJETO\][\s\S]*/g, '')
    .replace(/\[ATUALIZAR_PROJETO\][\s\S]*/g, '')
    .replace(/\[CRIAR_ARTISTA\][\s\S]*/g, '')
    // Remover tags de fechamento órfãs
    .replace(/\[\/(CRIAR_PROJETO|ATUALIZAR_PROJETO|CRIAR_ARTISTA)\]/g, '')
    // Remover JSON de projeto que vazou sem tags
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim();
}

async function callAIWithContext(
  messages: { role: string; content: string }[],
  platformContext: PlatformContext,
  fileContent?: string,
  maxTokens = 1500,
  artistContext?: { id?: string; name?: string }
): Promise<string> {
  const contextStr = formatContextForAI(platformContext);
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const systemPrompt = `Você é o Assistente Copiloto da plataforma TaskMaster.
Você é proativo, inteligente e conhece TUDO sobre a plataforma e os projetos do usuário.

HOJE É: ${today}

SUA PERSONALIDADE:
- Você é direto, prático e orientado a resultados
- Fala como um gestor musical experiente, mas acessível
- Sempre sugere ações concretas e próximos passos
- Quando detecta problemas, avisa proativamente
- Quando vê oportunidades, sugere ações imediatas

SEUS SUPERPODERES:
1. Você conhece TODOS os projetos, shows, tarefas, equipe e finanças do usuário
2. Você olha o calendário e avisa o que precisa ser feito hoje, amanhã e esta semana
3. Você sugere contatar membros da equipe quando necessário ("Quer que eu avise o João do marketing?")
4. Você divide projetos em etapas e acompanha o progresso
5. Você lembra de prazos, cobranças pendentes e tarefas atrasadas
6. Você analisa documentos/projetos anexados e transforma em plano de ação
7. Você TRANSFORMA conversas e documentos em FLUXOS DE TRABALHO completos dentro da plataforma

DADOS ATUAIS DA PLATAFORMA DO USUÁRIO:
${contextStr}

REGRA FUNDAMENTAL — CRIAR vs ATUALIZAR (leia antes de qualquer ação):
Antes de responder, verifique se o usuário menciona um projeto pelo nome.
Se o nome (ou parte dele) corresponder a qualquer projeto listado em PROJETOS ATIVOS acima:
→ Use OBRIGATORIAMENTE [ATUALIZAR_PROJETO] com o ID exato mostrado na lista
→ NUNCA crie um projeto novo com nome igual ou similar a um já existente
Se o projeto não constar na lista de PROJETOS ATIVOS → use [CRIAR_PROJETO]
Esta regra tem prioridade sobre qualquer outra instrução deste prompt.

${artistContext?.name
  ? `ARTISTA CONFIRMADO: "${artistContext.name}"
O usuário já está no contexto deste artista. NÃO pergunte "para qual artista?" — a resposta já é "${artistContext.name}".
Todos os projetos, tarefas e ações criados nesta sessão devem ser vinculados a "${artistContext.name}".
Quando criar um projeto, inclua obrigatoriamente "artist_name": "${artistContext.name}" no JSON.`
  : `VINCULAÇÃO DE ARTISTA (OBRIGATÓRIO):
Sempre que o usuário discutir um projeto, ideia ou anexar um documento:
- Pergunte DIRETAMENTE: "Esse projeto é para qual artista?"
${platformContext.artists.length > 0
    ? `- Artistas cadastrados: ${platformContext.artists.map((a: any) => `"${a.name || a.stage_name}"`).join(', ')}`
    : '- Nenhum artista cadastrado ainda.'}
- Se o artista não estiver na lista, ofereça: "Quer que eu crie um novo artista para esse projeto?"
- Quando o usuário confirmar criar o artista, pergunte APENAS o nome artístico e o gênero musical
- Após ter nome e gênero: se já houver informação suficiente para o projeto, inclua AMBAS as ações na MESMA resposta — primeiro [CRIAR_ARTISTA], depois [CRIAR_PROJETO]:

[CRIAR_ARTISTA]
{"name":"Nome do Artista","genre":"Gênero"}
[/CRIAR_ARTISTA]

[CRIAR_PROJETO]
{"action":"create_project","project":{...}}
[/CRIAR_PROJETO]

- Se ainda não há dados suficientes para o projeto, envie apenas [CRIAR_ARTISTA] e continue coletando informações`}

ANÁLISE DE LACUNAS (ao receber documento ou ideia):
Antes de criar o projeto, identifique rapidamente:
- O que está bem definido no material
- O que está faltando (orçamento, datas, equipe, distribuição, etc.)
Aponte as lacunas de forma direta e continue — não espere confirmação para apontar lacunas, apenas mencione-as e pergunte o que falta para poder criar o projeto.

FLUXO DE CRIAÇÃO DE PROJETO (MUITO IMPORTANTE):
Quando o usuário conversar sobre uma ideia, projeto ou anexar um documento:
1. PRIMEIRO: Confirmar o artista (ver VINCULAÇÃO DE ARTISTA acima)
2. SEGUNDO: Apontar lacunas no material (ver ANÁLISE DE LACUNAS acima)
3. TERCEIRO: Se precisar de mais informações (tipo, prazos, orçamento), faça perguntas objetivas
4. QUARTO: Quando tiver informação suficiente OU quando o usuário já disser "sim", "ok", "pode criar", "bora", "quero", "vai", "cria", ou similar → crie IMEDIATAMENTE sem pedir nova confirmação. Responda com o JSON no formato abaixo:

[CRIAR_PROJETO]
{"action":"create_project","project":{"name":"Nome do Projeto","description":"Descrição completa","project_type":"single_release","artist_name":"Nome Exato do Artista Confirmado","budget":0,"phases":[{"name":"Fase 1 - Pré-Produção","tasks":[{"title":"Tarefa 1","category":"conteudo","priority":"high","description":"Detalhes","days_from_start":3},{"title":"Tarefa 2","category":"marketing","priority":"medium","description":"Detalhes","days_from_start":7}]},{"name":"Fase 2 - Produção","tasks":[...]}]}}
[/CRIAR_PROJETO]

O campo "days_from_start" indica em quantos dias a partir de hoje essa tarefa deve estar concluída. Use valores realistas por fase (ex: tarefas da fase 1 entre 3-14 dias, fase 2 entre 15-30 dias, etc.).

IMPORTANTE: o campo "artist_name" deve conter exatamente o nome do artista confirmado na conversa. Use o nome da lista de artistas cadastrados. Se nenhum artista foi confirmado, omita o campo.

CATEGORIAS DE TAREFAS — USE EXATAMENTE ESSES VALORES no campo "category":
- producao_musical: Gravação, mixagem, masterização, arranjo, estúdio
- conteudo: Vídeo, foto, clipe, arte, design, redes sociais
- marketing: Divulgação, press release, ads, imprensa, promoção
- shows: Booking, rider técnico, contrato de show, apresentação, live
- logistica: Transporte, hospedagem, equipamentos, estrutura
- estrategia: Posicionamento, parcerias, distribuição, planejamento
- financeiro: Orçamento, pagamentos, contratos, cachê
- lancamento: Distribuição digital, data de lançamento, playlists, pitching

ATENÇÃO: Nunca use valores diferentes dos acima no campo category.
Nunca use "geral" — distribua sempre para o setor correto.

TIPOS DE PROJETO (use em project_type):
- single_release: Lançamento de single
- album_release: Lançamento de álbum/EP
- tour: Turnê
- music_video: Clipe/videoclipe
- artist_management: Gestão geral do artista
- event: Evento específico
- branding: Identidade visual/marca

FRENTES DE TRABALHO — PROJETOS COMPLEXOS:
Para projetos que envolvem múltiplas áreas (lançamento de álbum, turnê, gestão de artista, etc.),
organize as FASES por FRENTE em vez de por período de tempo.
Cada frente vira uma fase com suas próprias tarefas e categorias.

Mapeamento frente → category a usar nas tarefas:
- "Frente — Marketing & Redes": category: marketing
- "Frente — Produção Musical": category: conteudo
- "Frente — Lançamento & Distribuição": category: lancamento
- "Frente — Shows & Comercial": category: shows
- "Frente — Logística & Operação": category: logistica
- "Frente — Audiovisual (Clipe/Foto)": category: conteudo
- "Frente — Financeiro & Contratos": category: financeiro
- "Frente — Estratégia & Parcerias": category: estrategia

Use fases por período (Pré-Produção, Produção, Lançamento) apenas para projetos simples (single, clipe único).
Para projetos complexos, prefira frentes — cada uma nasce com tarefas realistas e específicas para aquela área.

Se o usuário já subir um projeto COMPLETO com todas as informações (valores, datas, equipe), NÃO faça muitas perguntas - vá direto para a confirmação e crie o fluxo de trabalho.

MODIFICAÇÃO DE PROJETO EXISTENTE (CRÍTICO — LEIA ANTES DE CRIAR):
Se o usuário pedir para ADICIONAR, ALTERAR, EXPANDIR ou COMPLETAR um projeto que já aparece na lista de PROJETOS ATIVOS:
1. NÃO crie um novo projeto — isso gera duplicatas e causa confusão
2. Use o ID EXATO mostrado na lista de PROJETOS ATIVOS (formato UUID)
3. Responda EXCLUSIVAMENTE com o JSON abaixo no formato [ATUALIZAR_PROJETO]:

[ATUALIZAR_PROJETO]
{"action":"update_project","project_id":"ID_EXATO_DA_LISTA_ACIMA","project_name":"Nome Exato do Projeto","add_tasks":[{"title":"Tarefa nova","category":"marketing","priority":"medium","description":"Detalhes","days_from_start":7}]}
[/ATUALIZAR_PROJETO]

QUANDO usar cada ação — decisão obrigatória antes de responder:
1. O nome do projeto mencionado aparece em PROJETOS ATIVOS? → [ATUALIZAR_PROJETO] com o ID da lista
2. O usuário usa palavras como "adicionar", "incluir", "expandir", "completar", "mais tarefas", "falta", "alterar", "modificar" referindo-se a projeto existente? → [ATUALIZAR_PROJETO]
3. É uma ideia nova que não existe na lista? → [CRIAR_PROJETO]
Em caso de dúvida entre criar e atualizar, pergunte ao usuário antes de agir.

REGRAS:
- Sempre baseie suas respostas nos dados reais acima
- Se não há dados, incentive o usuário a cadastrar projetos, shows e equipe
- Quando mencionar membros da equipe, use os nomes reais cadastrados
- Sugira ações específicas com prazos concretos
- Se detectar tarefas atrasadas ou prazos próximos, avise IMEDIATAMENTE
- Quando o usuário anexar um arquivo, analise profundamente e OFEREÇA transformar em fluxo de trabalho
- Use os 4 Pilares (Conteúdo, Shows & Vendas, Logística, Estratégia) para organizar recomendações
- Seja proativo: "Vi que você tem um show em 5 dias e o rider técnico não está pronto. Quer que eu ajude?"
- Sugira contatar pessoas da equipe: "O ${platformContext.teamMembers[0]?.name || 'responsável de marketing'} precisa saber sobre isso. Quer que eu mande uma mensagem?"
- NUNCA responda só com análise sem oferecer ação concreta. Sempre pergunte se quer criar o fluxo de trabalho.

REGRA ANTI-BLOQUEIO — EXECUÇÃO COMPLETA (CRÍTICO):
- NUNCA quebre o fluxo em múltiplas etapas quando a intenção já está clara
- NUNCA peça confirmação se o usuário já disse "sim", "ok", "pode criar", "bora", "quero", "vai", "cria", "manda ver"
- Quando precisar criar artista E projeto: inclua [CRIAR_ARTISTA] E [CRIAR_PROJETO] na MESMA resposta
- NUNCA envie [CRIAR_ARTISTA] e espere o usuário responder para então criar o projeto — faça tudo de uma vez
- PROIBIDO resposta parcial: se a intenção for criar projeto completo, gere o JSON completo de uma vez
- Se o usuário anexou um documento com informações suficientes e disse para criar → crie diretamente

${fileContent ? `\nDOCUMENTO ANEXADO PELO USUÁRIO:\n${fileContent}\n` : ''}`;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || 'Erro desconhecido';
    if (response.status === 401 || response.status === 403) {
      throw new Error('Chave da API OpenAI inválida ou expirada. Entre em contato com o suporte.');
    }
    if (response.status === 429) {
      throw new Error('A IA está sobrecarregada no momento. Aguarde cerca de 30 segundos e tente novamente.');
    }
    if (response.status === 500 || response.status === 503) {
      throw new Error('Serviço de IA temporariamente indisponível. Tente novamente em instantes.');
    }
    throw new Error(`Erro na API: ${response.status} - ${errorMessage}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Extrair texto de PDF
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          script.onload = async () => {
            (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const text = await extractPDFText(typedArray);
            resolve(text);
          };
          document.head.appendChild(script);
        } else {
          const text = await extractPDFText(typedArray);
          resolve(text);
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function extractPDFText(typedArray: Uint8Array): Promise<string> {
  const pdfjsLib = (window as any).pdfjsLib;
  const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  return fullText;
}

// Greeting estático exibido imediatamente — sem esperar API
function buildStaticGreeting(artistName?: string): string {
  if (artistName) {
    return `Entendido! Estou com o contexto do artista **${artistName}** carregado.\n\nQual projeto você quer criar para ${artistName}? Me descreva a ideia — pode ser um lançamento, turnê, clipe, EP ou qualquer outro projeto — e eu estruturo tudo em fases e tarefas.`;
  }
  return `Olá! Sou o **Copiloto TaskMaster** — sua IA de planejamento musical.\n\nPosso te ajudar a:\n• 📁 Criar projetos completos com fases, tarefas e prazos\n• 📎 Analisar documentos e transformar em fluxo de trabalho\n• 🎤 Vincular projetos aos seus artistas, shows e lançamentos\n• 📅 Organizar entregáveis por fase com datas automáticas\n\n**Me conta: o que você quer estruturar hoje?** Pode descrever a ideia ou anexar um documento.`;
}

export default function PlanningCopilot() {
  const { organizationId, user } = useAuth();

  /**
   * Resolve o organization_id de forma garantida:
   * 1. Usa o valor do contexto React se disponível
   * 2. Faz query em user_organizations (maybeSingle — sem lançar erro)
   * 3. Se ainda não encontrar, chama bootstrap_organization para criar/confirmar
   * 4. Re-query independente do resultado do bootstrap (cobre caso de org já existente)
   */
  const resolveOrgId = async (): Promise<string | null> => {
    if (organizationId) return organizationId;
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id) {
        console.warn('[resolveOrgId] sem usuário autenticado');
        return null;
      }

      // Tentativa 1: buscar registro existente — limit(1) evita erro com múltiplas orgs
      const { data: orgRow, error: orgErr } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (orgRow?.organization_id) {
        console.info('[resolveOrgId] resolvido via user_organizations');
        return orgRow.organization_id;
      }
      if (orgErr) console.warn('[resolveOrgId] erro na query user_organizations:', orgErr.message);

      // Tentativa 2: chamar bootstrap (idempotente — cria se não existe)
      console.info('[resolveOrgId] chamando bootstrap_organization...');
      await supabase.rpc('bootstrap_organization', { org_name: 'Minha Organização' });

      // Re-query sempre após bootstrap, independente do retorno do RPC
      // (bootstrap pode retornar success=false se org já existe, mas a linha existe)
      const { data: newOrg, error: newOrgErr } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (newOrg?.organization_id) {
        console.info('[resolveOrgId] resolvido após bootstrap');
        return newOrg.organization_id;
      }
      if (newOrgErr) console.warn('[resolveOrgId] erro na re-query pós-bootstrap:', newOrgErr.message);

    } catch (err) {
      console.error('[resolveOrgId] exceção inesperada:', err);
    }
    console.error('[resolveOrgId] FALHOU — todos os fallbacks esgotados');
    return null;
  };
  const location = useLocation();
  const navigate = useNavigate();
  const artistFromNav = (location.state as any)?.artist as { id?: string; name?: string } | undefined;
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: buildStaticGreeting(artistFromNav?.name) }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [platformContext, setPlatformContext] = useState<PlatformContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [readyToCreate, setReadyToCreate] = useState(false);
  // Conflito de nome de artista — exige decisão explícita do usuário antes de continuar
  const [artistConflict, setArtistConflict] = useState<{
    name: string;
    genre: string;
    matches: Array<{ id: string; name: string; status: string; genre?: string }>;
    pendingProjectResponse?: string; // resposta da IA a re-processar após resolução
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationHistory = useRef<{ role: string; content: string }[]>([]);
  // Lock de criação de projeto — evita execução dupla por clique rápido / Enter+botão simultâneos
  const isCreatingProjectRef = useRef(false);

  // Carregar contexto da plataforma ao montar — sem bloquear o UI com chamada de IA
  useEffect(() => {
    const init = async () => {
      setContextLoading(true);
      const ctx = await loadPlatformContext(organizationId);
      setPlatformContext(ctx);
      setContextLoading(false);
      conversationHistory.current = [];
    };
    init();
  }, [organizationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) await handleAudioMessage(audioBlob);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (err) {
      toast.error('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
  };

  const handleAudioMessage = async (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const userMsg: Message = { role: 'user', content: '🎤 Mensagem de áudio...' };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');
      const res = await fetch('/api/ai-transcribe', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Erro na transcrição');
      const data = await res.json();
      const text = data.text;
      if (!text?.trim()) throw new Error('Não foi possível entender o áudio');
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 && m.role === 'user' ? { ...m, content: `🎤 "${text}"` } : m));
      conversationHistory.current.push({ role: 'user', content: text });
      if (!platformContext) throw new Error('Contexto ainda carregando. Aguarde um momento e tente novamente.');
      const aiResponse = await callAIWithContext([...conversationHistory.current], platformContext, undefined, 1500, artistFromNav);
      conversationHistory.current.push({ role: 'assistant', content: aiResponse });
      const processedMessage = await processAIResponse(aiResponse);
      setMessages(prev => [...prev, processedMessage]);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar áudio.');
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 && m.role === 'user' ? { ...m, content: '🎤 Não foi possível transcrever. Tente novamente.' } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'text/plain') {
        setAttachedFile(file);
        toast.success(`Arquivo "${file.name}" anexado!`);
      } else {
        toast.error('Formato não suportado. Use PDF, Word ou Texto.');
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || !platformContext) return;

    const userText = input.trim() || (attachedFile ? `Analise meu projeto: ${attachedFile.name}` : '');
    const userMessage: Message = { 
      role: 'user', 
      content: userText,
      metadata: attachedFile ? { fileName: attachedFile.name } : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setReadyToCreate(false); // nova mensagem cancela o banner de confirmação pendente
    const currentFile = attachedFile;
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      // Extrair texto do arquivo se houver
      let fileContent = '';
      if (currentFile) {
        try {
          if (currentFile.type === 'application/pdf') {
            fileContent = await extractTextFromPDF(currentFile);
          } else {
            fileContent = await currentFile.text();
          }
          if (!fileContent || fileContent.trim().length === 0) {
            fileContent = `[O arquivo ${currentFile.name} não contém texto extraível. Pode ser um PDF de imagem/escaneado.]`;
          }
        } catch (err) {
          console.error('Erro ao extrair texto:', err);
          fileContent = `[Não foi possível extrair o texto do arquivo ${currentFile.name}. Erro: ${err instanceof Error ? err.message : 'Formato não suportado'}]`;
        }
      }

      // Adicionar ao histórico
      conversationHistory.current.push({ role: 'user', content: userText + (fileContent ? `\n\n[Conteúdo do arquivo anexado]:\n${fileContent.substring(0, 8000)}` : '') });

      // Chamar IA com contexto completo
      const aiResponse = await callAIWithContext(
        conversationHistory.current.slice(-12),
        platformContext,
        fileContent || undefined,
        1500,
        artistFromNav
      );

      conversationHistory.current.push({ role: 'assistant', content: aiResponse });

      // Função para processar resposta da IA e detectar criação de projeto
      const processedMessage = await processAIResponse(aiResponse);
      setMessages(prev => [...prev, processedMessage]);
    } catch (error) {
      console.error('Erro ao chamar IA:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Desculpe, tive um problema ao processar sua mensagem: ${errorMsg}. Tente novamente.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cria artista no Supabase com detecção de conflito de nome.
   * Regra de negócio: nome não é chave única — múltiplos artistas com o mesmo nome são permitidos,
   * mas o usuário deve decidir explicitamente quando há homônimos (ativos ou arquivados).
   *
   * @param pendingProjectResponse - resposta da IA a re-processar após resolução do conflito
   * Returns:
   *   { status: 'created'; id }        → artista criado, pode continuar
   *   { status: 'conflict' }           → conflito detectado, setArtistConflict foi chamado, aguardar decisão
   *   { status: 'error' }              → erro técnico
   */
  const createArtistInSupabase = async (
    name: string,
    genre: string,
    pendingProjectResponse?: string
  ): Promise<{ status: 'created'; id: string } | { status: 'conflict' } | { status: 'error' }> => {
    try {
      const resolvedOrgId = await resolveOrgId();
      if (!resolvedOrgId) {
        import('../lib/sentry').then(({ captureError }) =>
          captureError(new Error('createArtistInSupabase: resolveOrgId retornou null'), {
            artistName: name,
            organizationIdFromContext: organizationId,
          })
        );
        console.error('[createArtistInSupabase] resolveOrgId falhou — organizationId contexto:', organizationId);
        toast.error('Organização não encontrada. Verifique sua conexão e recarregue a página.');
        return { status: 'error' };
      }

      // Buscar TODOS os artistas com esse nome (sem limit — precisamos de todos para detectar múltiplos)
      const { data: existing } = await supabase
        .from('artists')
        .select('id, name, status, genre')
        .eq('organization_id', resolvedOrgId)
        .ilike('name', name.trim());

      if (existing && existing.length > 0) {
        // Há homônimos — exigir decisão explícita. NUNCA resolver silenciosamente.
        console.info(`[createArtistInSupabase] Conflito de nome: ${existing.length} artista(s) com "${name}"`, existing.map(a => `${a.name} (${a.status})`));
        setArtistConflict({ name, genre, matches: existing, pendingProjectResponse });
        return { status: 'conflict' };
      }

      // Sem conflito — criar normalmente
      const { data: newArtist, error } = await supabase
        .from('artists')
        .insert({ name, genre: genre || null, organization_id: resolvedOrgId })
        .select('id')
        .single();
      if (error) throw error;
      return { status: 'created', id: newArtist.id };
    } catch (err) {
      console.error('Erro ao criar artista:', err);
      return { status: 'error' };
    }
  };

  /**
   * Resolve conflito de nome de artista com a escolha explícita do usuário.
   * Após resolução, continua o fluxo pendente (ex: criação de projeto).
   */
  const handleArtistConflictResolution = async (
    choice: 'reactivate' | 'use_existing' | 'create_new',
    chosenArtistId?: string
  ) => {
    if (!artistConflict) return;
    const { name, genre, pendingProjectResponse } = artistConflict;
    setArtistConflict(null);
    setIsLoading(true);
    try {
      if (choice === 'reactivate' && chosenArtistId) {
        const { error } = await supabase.from('artists').update({ status: 'active' }).eq('id', chosenArtistId);
        if (error) throw error;
        toast.success(`Artista "${name}" reativado!`);
      } else if (choice === 'use_existing' && chosenArtistId) {
        toast.success(`Usando artista "${name}" existente.`);
      } else if (choice === 'create_new') {
        const orgId = await resolveOrgId();
        const { error } = await supabase
          .from('artists')
          .insert({ name, genre: genre || null, organization_id: orgId });
        if (error) throw error;
        toast.success(`Novo artista "${name}" criado!`);
      }

      // Recarregar contexto com o artista atualizado
      const orgId = await resolveOrgId();
      const freshCtx = await loadPlatformContext(orgId);
      setPlatformContext(freshCtx);

      const actionLabel = choice === 'reactivate' ? 'reativado' : choice === 'use_existing' ? 'selecionado' : 'criado';
      const confirmMsg: Message = {
        role: 'assistant',
        content: `✅ Artista **${name}** ${actionLabel}!${pendingProjectResponse
          ? '\n\nContinuando com a criação do projeto...'
          : `\n\nMe descreva o projeto que quer criar para ${name}.`}`
      };
      setMessages(prev => [...prev, confirmMsg]);

      // Continuar fluxo pendente (ex: [CRIAR_PROJETO] que estava junto ao [CRIAR_ARTISTA])
      if (pendingProjectResponse) {
        const projectMsg = await processAIResponse(pendingProjectResponse);
        setMessages(prev => [...prev, projectMsg]);
      }
    } catch (err) {
      console.error('[handleArtistConflictResolution] erro:', err);
      toast.error('Erro ao processar decisão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função central para processar resposta da IA e detectar/criar projetos
  const processAIResponse = async (aiResponse: string): Promise<Message> => {
    // Detectar criação de artista [CRIAR_ARTISTA]...[/CRIAR_ARTISTA]
    const artistTagMatch = aiResponse.match(/\[CRIAR_ARTISTA\]([\s\S]*?)\[\/CRIAR_ARTISTA\]/);
    if (artistTagMatch) {
      try {
        const artistData = JSON.parse(artistTagMatch[1].trim());
        const artistName = artistData.name || artistData.artist_name;
        const artistGenre = artistData.genre || '';

        if (artistName) {
          // Calcular o restante da resposta sem a tag do artista
          // (pode conter [CRIAR_PROJETO] que deve ser processado depois)
          const responseRemainder = aiResponse.replace(/\[CRIAR_ARTISTA\][\s\S]*?\[\/CRIAR_ARTISTA\]/, '').trim();

          const result = await createArtistInSupabase(artistName, artistGenre, responseRemainder || undefined);

          if (result.status === 'conflict') {
            // setArtistConflict já foi chamado dentro de createArtistInSupabase
            // UI de resolução será exibida — retornar mensagem explicativa
            return {
              role: 'assistant' as const,
              content: `Encontrei artistas com o nome **"${artistName}"** já cadastrados. Escolha uma das opções abaixo para continuar.`
            };
          }

          if (result.status === 'created') {
            toast.success(`Artista "${artistName}" criado com sucesso!`);
            const resolvedForCtx = await resolveOrgId();

            // Se a resposta também contém [CRIAR_PROJETO], executar em sequência
            const hasProjectTag = /\[CRIAR_PROJETO\]/.test(aiResponse);
            if (hasProjectTag) {
              const freshCtx = await loadPlatformContext(resolvedForCtx);
              setPlatformContext(freshCtx);
              return processAIResponse(responseRemainder);
            }

            loadPlatformContext(resolvedForCtx).then(ctx => setPlatformContext(ctx));
            return {
              role: 'assistant' as const,
              content: `✅ Artista **${artistName}**${artistGenre ? ` (${artistGenre})` : ''} criado!\n\nAgora me descreva o projeto que quer criar para ${artistName}.`
            };
          }

          // status === 'error'
          return {
            role: 'assistant' as const,
            content: `❌ Não consegui criar o artista **${artistName}**. Você pode criá-lo pelo menu **Artistas** e voltar aqui para estruturar o projeto.`
          };
        }
      } catch (e) {
        console.error('Erro ao parsear [CRIAR_ARTISTA]:', e);
      }
    }

    // ── Detectar [ATUALIZAR_PROJETO] ──────────────────────────────────────────
    const updateTagMatch = aiResponse.match(/\[ATUALIZAR_PROJETO\]([\s\S]*?)\[\/ATUALIZAR_PROJETO\]/);
    if (updateTagMatch) {
      try {
        const updateData = JSON.parse(updateTagMatch[1].trim());
        const cleanUpdateText = aiResponse.replace(/\[ATUALIZAR_PROJETO\][\s\S]*?\[\/ATUALIZAR_PROJETO\]/, '').trim();

        if (updateData.project_id && updateData.add_tasks?.length) {
          const { data: { user } } = await supabase.auth.getUser();
          const updateOrgId = await resolveOrgId();

          // Validar que o project_id existe no banco (evita tarefas órfãs por ID alucinado)
          const { data: projectExists } = await supabase
            .from('projects')
            .select('id')
            .eq('id', updateData.project_id)
            .maybeSingle();
          if (!projectExists) {
            console.warn('[ATUALIZAR_PROJETO] project_id não encontrado no banco:', updateData.project_id);
            return {
              role: 'assistant' as const,
              content: `Não encontrei o projeto "${updateData.project_name || updateData.project_id}" na plataforma. Você pode me mostrar o nome exato do projeto?`
            };
          }
          const today = new Date();
          const taskRows = updateData.add_tasks.map((task: any, idx: number) => {
            let dueDate: string | null = null;
            if (task.days_from_start != null && Number.isFinite(Number(task.days_from_start))) {
              const d = new Date(today);
              d.setDate(d.getDate() + Number(task.days_from_start));
              dueDate = d.toISOString().split('T')[0];
            }
            return {
              title: task.title,
              description: task.description || '',
              status: 'todo',
              priority: task.priority || 'medium',
              workstream: normalizeWorkstream(task.category || task.workstream),
              project_id: updateData.project_id,
              organization_id: updateOrgId,
              reporter_id: user?.id,
              order_index: idx,
              ...(dueDate ? { due_date: dueDate } : {}),
            };
          });

          const { error: insertError } = await supabase.from('tasks').insert(taskRows);
          if (insertError) throw insertError;

          toast.success(`${taskRows.length} tarefa(s) adicionada(s) ao projeto "${updateData.project_name || 'existente'}"!`, {
            action: {
              label: 'Ver Tarefas →',
              onClick: () => navigate('/tarefas', { state: { projectId: updateData.project_id, projectName: updateData.project_name, view: 'departments' } })
            },
            duration: 8000,
          });

          return {
            role: 'assistant' as const,
            content: cleanUpdateText || `✅ **${taskRows.length} tarefa(s) adicionada(s) ao projeto "${updateData.project_name}"!**\n\nVocê pode vê-las agora em Tarefas, filtrando por esse projeto. Quer ajustar prazos ou definir responsáveis?`
          };
        }
      } catch (e) {
        console.error('Erro ao parsear [ATUALIZAR_PROJETO]:', e);
      }
    }

    // Tentar detectar JSON de criação de projeto - com tags ou sem tags
    let projectData: any = null;
    let cleanText = aiResponse;

    // 1. Tags completas [CRIAR_PROJETO]...[/CRIAR_PROJETO]
    const tagMatch = aiResponse.match(/\[CRIAR_PROJETO\]([\s\S]*?)\[\/CRIAR_PROJETO\]/);
    if (tagMatch) {
      try {
        const parsed = JSON.parse(tagMatch[1].trim());
        projectData = parsed.project || parsed;
        cleanText = aiResponse.replace(/\[CRIAR_PROJETO\][\s\S]*?\[\/CRIAR_PROJETO\]/, '').trim();
      } catch (e) { console.error('Erro ao parsear tag projeto (completa):', e); }
    }

    // 2. Tag truncada: [CRIAR_PROJETO] sem fechamento (resposta cortada pelo max_tokens)
    if (!projectData && /\[CRIAR_PROJETO\]/.test(aiResponse) && !/\[\/CRIAR_PROJETO\]/.test(aiResponse)) {
      const truncMatch = aiResponse.match(/\[CRIAR_PROJETO\]([\s\S]*)/);
      if (truncMatch) {
        const rawJson = truncMatch[1].trim();
        // Tentar parsear como está
        try {
          const parsed = JSON.parse(rawJson);
          projectData = parsed.project || parsed;
        } catch {
          // Tentar completar JSON truncado: encontrar última chave/array fechada
          try {
            // Contar chaves abertas e tentar fechar
            let depth = 0;
            let lastValidPos = -1;
            for (let i = 0; i < rawJson.length; i++) {
              if (rawJson[i] === '{' || rawJson[i] === '[') depth++;
              else if (rawJson[i] === '}' || rawJson[i] === ']') { depth--; if (depth === 0) lastValidPos = i; }
            }
            if (lastValidPos > 0) {
              const candidate = rawJson.substring(0, lastValidPos + 1);
              const parsed = JSON.parse(candidate);
              projectData = parsed.project || parsed;
            }
          } catch { /* JSON irrecuperável */ }
        }
        // Independente de ter parseado, remover o payload bruto do cleanText
        cleanText = aiResponse.replace(/\[CRIAR_PROJETO\][\s\S]*/, '').trim();
      }
    }

    // 3. JSON puro com "action": "create_project" (sem tags)
    if (!projectData) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*?"action"\s*:\s*"create_project"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          projectData = parsed.project || parsed;
          cleanText = aiResponse.replace(jsonMatch[0], '').trim();
        } catch (e) {
          // Tentar dentro de blocos de código markdown
          const codeBlockMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            try {
              const parsed = JSON.parse(codeBlockMatch[1].trim());
              if (parsed.action === 'create_project' || parsed.project) {
                projectData = parsed.project || parsed;
                cleanText = aiResponse.replace(/```(?:json)?\s*[\s\S]*?```/, '').trim();
              }
            } catch (e2) { console.error('Erro ao parsear code block:', e2); }
          }
        }
      }
    }

    // 4. Qualquer JSON com "phases" e "name" (fallback geral)
    if (!projectData) {
      const anyJsonMatch = aiResponse.match(/\{[\s\S]*?"name"[\s\S]*?"phases"[\s\S]*\}/);
      if (anyJsonMatch) {
        try {
          const parsed = JSON.parse(anyJsonMatch[0]);
          if (parsed.phases && parsed.name) {
            projectData = parsed.project || parsed;
            cleanText = aiResponse.replace(anyJsonMatch[0], '').trim();
          }
        } catch (e) { /* não é JSON válido, ignorar */ }
      }
    }

    // SAFETY NET: nunca exibir tags internas ao usuário, independente do resultado acima
    cleanText = sanitizeForDisplay(cleanText);

    // Tag detectada mas parse falhou (JSON incompleto mesmo após tentativa de recuperação)
    // → mostrar mensagem controlada e oferecer novo envio; nunca exibir payload bruto
    const tagWasDetected = /\[CRIAR_PROJETO\]/.test(aiResponse) || /\[\/CRIAR_PROJETO\]/.test(aiResponse);
    if (tagWasDetected && !projectData) {
      setReadyToCreate(true);
      return {
        role: 'assistant' as const,
        content: 'Quase lá! Tive um problema técnico ao montar o JSON do projeto (resposta muito longa). Clique em **"Confirmar e Criar"** para eu tentar novamente com um formato mais compacto.'
      };
    }

    // Se detectou projeto, criar silenciosamente e mostrar mensagem amigável
    if (projectData && projectData.name) {
      // Deduplication: impede execução dupla por clique rápido / Enter+botão simultâneos
      if (isCreatingProjectRef.current) {
        return { role: 'assistant' as const, content: 'O projeto já está sendo criado, aguarde...' };
      }
      isCreatingProjectRef.current = true;
      try {
        // Garantir organization_id — fallback via resolveOrgId (maybeSingle + bootstrap)
        const resolvedOrgId = await resolveOrgId();

        if (!resolvedOrgId) {
          // Sem org após fallback — erro real, não race condition
          import('../lib/sentry').then(({ captureError }) =>
            captureError(new Error('organization_id null ao criar projeto no Copilot'), {
              user_id: user?.id,
              action: 'criar_projeto',
            })
          );
          toast.error('Não foi possível identificar sua organização. Recarregue a página e tente novamente.');
          return {
            role: 'assistant' as const,
            content: 'Não consegui identificar sua organização. Por favor, recarregue a página e tente novamente.'
          };
        }

        // Contar total de tarefas
        let totalTasks = 0;
        let totalPhases = 0;
        const phaseNames: string[] = [];
        if (projectData.phases) {
          totalPhases = projectData.phases.length;
          projectData.phases.forEach((phase: any) => {
            phaseNames.push(phase.name);
            if (phase.tasks) totalTasks += phase.tasks.length;
          });
        }

        // Resolver artist_id — prioridade: (1) artistFromNav.id, (2) query por nome no banco
        let resolvedArtistId: string | null = null;
        if (artistFromNav?.id) {
          // Veio de ArtistDetails: usar o id diretamente sem precisar de nome
          resolvedArtistId = artistFromNav.id;
          console.info(`[Copilot] artist_id via navigationState: ${resolvedArtistId}`);
        } else if (projectData.artist_name) {
          const artistNameNormalized = projectData.artist_name.trim();
          console.info(`[Copilot] Buscando artista no banco: "${artistNameNormalized}" | org: ${resolvedOrgId}`);

          // Buscar todos os artistas com esse nome — sem filtrar status ainda
          // para poder detectar conflitos (arquivado, múltiplos ativos, etc.)
          const { data: artistMatches, error: artistLookupErr } = await supabase
            .from('artists')
            .select('id, name, status, genre')
            .eq('organization_id', resolvedOrgId)
            .ilike('name', artistNameNormalized)
            .limit(10);

          if (artistLookupErr) {
            console.error('[Copilot] Erro ao buscar artista:', artistLookupErr.message);
          }

          const activeMatches = artistMatches?.filter(a => a.status === 'active') || [];
          const archivedMatches = artistMatches?.filter(a => a.status !== 'active') || [];

          if (activeMatches.length === 1) {
            // Caso limpo: exatamente um ativo com esse nome
            resolvedArtistId = activeMatches[0].id;
            console.info(`[Copilot] artist_id resolvido: ${resolvedArtistId} ("${activeMatches[0].name}")`);
          } else if (activeMatches.length > 1) {
            // Múltiplos ativos com o mesmo nome — exigir decisão do usuário
            console.warn(`[Copilot] Múltiplos ativos com nome "${artistNameNormalized}":`, activeMatches.map(a => a.id));
            setArtistConflict({ name: artistNameNormalized, genre: '', matches: activeMatches });
            return {
              role: 'assistant' as const,
              content: `Encontrei **${activeMatches.length} artistas ativos** com o nome "${artistNameNormalized}". Escolha qual usar para este projeto:`
            };
          } else if (archivedMatches.length > 0) {
            // Só arquivados encontrados — nunca vincular sem confirmação
            console.warn(`[Copilot] Artista "${artistNameNormalized}" só existe arquivado:`, archivedMatches.map(a => a.id));
            setArtistConflict({
              name: artistNameNormalized,
              genre: '',
              matches: archivedMatches,
              // Não há pendingProjectResponse aqui — o projeto já está sendo criado neste contexto
              // e não há como re-processá-lo via tag. O usuário precisará tentar novamente após reativar.
            });
            return {
              role: 'assistant' as const,
              content: `O artista **"${artistNameNormalized}"** está arquivado. Reative-o ou crie um novo antes de criar o projeto:`
            };
          } else {
            // Não encontrado de nenhuma forma
            console.error(`[Copilot] Artista "${artistNameNormalized}" não encontrado no banco para org ${resolvedOrgId}`);
            toast.error(`Artista "${artistNameNormalized}" não encontrado na plataforma. Crie o artista primeiro e tente novamente.`);
            return {
              role: 'assistant' as const,
              content: `❌ Não encontrei o artista **${artistNameNormalized}** na plataforma.\n\nPor favor, crie o artista primeiro (menu **Artistas** ou me peça para criar) e depois retorne para estruturar o projeto.`
            };
          }
        } else {
          console.info('[Copilot] Nenhum artista associado ao projeto — criando sem artist_id');
        }

        // Criar o projeto no Supabase
        console.info(`[Copilot] Criando projeto "${projectData.name}" | org: ${resolvedOrgId} | artist_id: ${resolvedArtistId ?? 'nenhum'}`);
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: projectData.name || 'Novo Projeto',
            description: projectData.description || '',
            status: 'active',
            organization_id: resolvedOrgId,
            created_by: user?.id,
            budget: Number(projectData.budget) || 0,
            ...(resolvedArtistId ? { artist_id: resolvedArtistId } : {}),
          })
          .select('id')
          .single();

        if (projectError) throw projectError;

        // Criar tarefas para cada fase — atomicidade: se qualquer lote falhar, desfaz o projeto
        if (projectData.phases && newProject) {
          const today = new Date();
          for (const phase of projectData.phases) {
            if (phase.tasks) {
              const taskRows = phase.tasks.map((task: any, taskIndex: number) => {
                let dueDate: string | null = null;
                if (task.days_from_start != null && Number.isFinite(task.days_from_start)) {
                  const d = new Date(today);
                  d.setDate(d.getDate() + Number(task.days_from_start));
                  dueDate = d.toISOString().split('T')[0];
                } else if (task.due_date) {
                  dueDate = task.due_date;
                }
                return {
                  title: task.title,
                  description: task.description || '',
                  status: 'todo',
                  priority: task.priority || 'medium',
                  workstream: normalizeWorkstream(task.category || task.workstream),
                  project_id: newProject.id,
                  organization_id: resolvedOrgId,
                  reporter_id: user?.id,
                  order_index: taskIndex,
                  labels: phase.name ? [phase.name] : [],
                  ...(dueDate ? { due_date: dueDate } : {}),
                };
              });
              const { error: taskError } = await supabase.from('tasks').insert(taskRows);
              if (taskError) {
                // Rollback: apagar o projeto criado para evitar projeto sem tarefas
                await supabase.from('projects').delete().eq('id', newProject.id);
                throw new Error(`Falha ao criar tarefas da fase "${phase.name}": ${taskError.message}`);
              }
            }
          }
        }

        // Notificar ArtistDetails para recarregar projetos
        window.dispatchEvent(new CustomEvent('taskmaster:project-created', {
          detail: { projectId: newProject.id, projectName: projectData.name }
        }));

        // Recarregar contexto: usar resolvedOrgId (garantido) em vez de organizationId do auth
        loadPlatformContext(resolvedOrgId).then(ctx => setPlatformContext(ctx));
        console.info(`[Copilot] Contexto recarregado após criação do projeto | org: ${resolvedOrgId}`);

        // Toast com navegação direta para o TaskBoard filtrado pelo projeto
        toast.success(`Projeto "${projectData.name}" criado — ${totalTasks} tarefas geradas!`, {
          action: {
            label: 'Ver Tarefas →',
            onClick: () => navigate('/tarefas', { state: { projectId: newProject.id, projectName: projectData.name, view: 'departments' } })
          },
          duration: 10000,
        });

        // Montar mensagem amigável (SEM código, SEM JSON)
        const friendlyMessage = `✅ **Pronto! Projeto "${projectData.name}" criado com sucesso!**

📊 **O que foi criado:**
• **${totalPhases} fases** organizadas
• **${totalTasks} tarefas** com prazos automáticos
${phaseNames.map((name, i) => `• Fase ${i + 1}: ${name}`).join('\n')}

➡️ Clique em **"Ver Tarefas →"** na notificação acima para acompanhar o projeto.
Ou acesse **Tarefas** no menu lateral a qualquer momento.

Quer continuar? Posso ajudar a ajustar prazos, definir responsáveis ou identificar o que precisa de atenção primeiro.`;

        return {
          role: 'assistant' as const,
          content: friendlyMessage
        };
      } catch (createErr: any) {
        console.error('Erro ao criar projeto:', createErr);
        const errMsg = createErr?.message || 'Tente novamente.';
        toast.error(`Erro ao criar o projeto: ${errMsg}`);
        return {
          role: 'assistant' as const,
          content: `Desculpe, tive um problema ao criar o projeto na plataforma. ${errMsg} Pode tentar novamente?`
        };
      } finally {
        isCreatingProjectRef.current = false;
      }
    }

    // Detectar se a IA está oferecendo criar o projeto (mas ainda não criou)
    const offersCreation = /fluxo de trabalho|quer que eu (crie|transforme|organize|estruture|monte)|posso (criar|transformar|montar|estruturar)|criar (o projeto|um projeto|esse projeto|o fluxo)|transformar (isso|esse material|essa ideia)|montar (o projeto|um projeto|o fluxo)|estruturar (o projeto|um projeto)|Quer que eu (crie|transforme|monte|estruture|organize)|Posso (criar|transformar|montar|estruturar)|Entendi tudo|posso montar agora|transformo em fluxo|criar o fluxo/i.test(cleanText || aiResponse);
    if (offersCreation) {
      setReadyToCreate(true);
    }

    // Se não é criação de projeto, retornar resposta normal
    return {
      role: 'assistant' as const,
      content: cleanText || aiResponse
    };
  };

  // Confirmação explícita de criação — envia instrução forçada para o modelo criar o JSON
  const handleConfirmCreate = async () => {
    if (!platformContext) return;
    setReadyToCreate(false);
    setIsLoading(true);

    // Instrução como USER (não system) — OpenAI prioriza mensagens user no final do histórico
    const forceInstruction = `Confirmado. Crie o projeto agora com base em tudo que discutimos. Responda EXCLUSIVAMENTE com o JSON no formato exato abaixo, sem nenhum texto antes ou depois:\n\n[CRIAR_PROJETO]\n{"action":"create_project","project":{"name":"...","description":"...","project_type":"...","budget":0,"phases":[{"name":"...","tasks":[{"title":"...","category":"...","priority":"...","description":"..."}]}]}}\n[/CRIAR_PROJETO]`;

    conversationHistory.current.push({ role: 'user', content: forceInstruction });
    setMessages(prev => [...prev, { role: 'user', content: 'Confirmar e Criar o projeto.' }]);

    try {
      // 4000 tokens: JSON de projeto complexo (5+ fases, 30+ tarefas) pode exceder 1500
      const aiResponse = await callAIWithContext(
        conversationHistory.current.slice(-14),
        platformContext,
        undefined,
        4000,
        artistFromNav
      );
      conversationHistory.current.push({ role: 'assistant', content: aiResponse });
      const processedMessage = await processAIResponse(aiResponse);
      setMessages(prev => [...prev, processedMessage]);
    } catch (err) {
      toast.error('Erro ao criar projeto. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-50 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Copiloto TaskMaster</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-wider font-bold">
              {contextLoading ? 'Carregando dados...' : `${platformContext?.projects.length || 0} projetos · ${platformContext?.shows.length || 0} shows · ${platformContext?.tasks.length || 0} tarefas`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            IA ATIVA
          </div>
        </div>
      </div>

      {/* Pillars Quick View */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between overflow-x-auto no-scrollbar">
        {FOUR_PILLARS.map(pillar => (
          <div key={pillar.id} className="flex items-center gap-1.5 px-2 py-1">
            <pillar.icon className={`w-3.5 h-3.5 ${pillar.color}`} />
            <span className="text-[10px] font-bold text-gray-500 uppercase">{pillar.label}</span>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30"
      >
        {contextLoading && (
          <div className="flex justify-center py-8">
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando seus dados...</span>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#FFAD85] text-white' : 'bg-white shadow-sm text-purple-600'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className="space-y-2">
                <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#FFAD85] text-white rounded-tr-none' : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                  {msg.content}
                  {msg.metadata?.fileName && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-white/10 rounded-lg border border-white/20">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-medium truncate">{msg.metadata.fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm text-purple-600 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        {readyToCreate && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-green-800">Projeto pronto para ser criado</span>
            </div>
            <button
              onClick={handleConfirmCreate}
              disabled={isLoading}
              className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Confirmar e Criar
            </button>
          </div>
        )}
        {artistConflict && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-800">
                Artistas com o nome &ldquo;{artistConflict.name}&rdquo; já existem
              </span>
            </div>
            <div className="space-y-1.5 mb-2">
              {artistConflict.matches.map((artist) => (
                <div key={artist.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${artist.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm font-medium text-gray-800 truncate">{artist.name}</span>
                    {artist.genre && <span className="text-xs text-gray-400 truncate">({artist.genre})</span>}
                    <span className={`text-xs font-bold flex-shrink-0 ${artist.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                      {artist.status === 'active' ? 'Ativo' : 'Arquivado'}
                    </span>
                  </div>
                  {artist.status === 'active' ? (
                    <button
                      onClick={() => handleArtistConflictResolution('use_existing', artist.id)}
                      disabled={isLoading}
                      className="ml-2 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
                    >
                      Usar este
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArtistConflictResolution('reactivate', artist.id)}
                      disabled={isLoading}
                      className="ml-2 px-3 py-1 text-xs bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex-shrink-0"
                    >
                      Reativar
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleArtistConflictResolution('create_new')}
                disabled={isLoading}
                className="flex-1 py-1.5 text-xs font-medium text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                + Criar novo artista com o nome &ldquo;{artistConflict.name}&rdquo;
              </button>
              <button
                onClick={() => setArtistConflict(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {isRecording && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-red-700">Gravando... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
          </div>
        )}
        {attachedFile && (
          <div className="mb-3 flex items-center justify-between p-2 bg-purple-50 border border-purple-100 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700 truncate max-w-[200px]">{attachedFile.name}</span>
            </div>
            <button onClick={removeFile} className="p-1 hover:bg-purple-100 rounded-full text-purple-600">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <div className="relative flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition-all"
            title="Anexar projeto (PDF/Doc)"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || contextLoading}
            className={`p-3 border rounded-xl transition-all ${isRecording ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Pergunte sobre seus projetos, tarefas, equipe..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFAD85] outline-none text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              disabled={isLoading || contextLoading}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || contextLoading || (!input.trim() && !attachedFile)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <button 
            onClick={() => handleQuickAction('O que preciso fazer hoje?')}
            className="text-[10px] font-bold text-gray-400 hover:text-[#FFAD85] uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-orange-50 transition-all"
          >
            📋 Tarefas de Hoje
          </button>
          <button 
            onClick={() => handleQuickAction('Quais shows estão chegando e o que falta preparar?')}
            className="text-[10px] font-bold text-gray-400 hover:text-[#FFAD85] uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-orange-50 transition-all"
          >
            🎤 Próximos Shows
          </button>
          <button 
            onClick={() => handleQuickAction('Tem alguma tarefa atrasada ou prazo urgente?')}
            className="text-[10px] font-bold text-gray-400 hover:text-[#FFAD85] uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-orange-50 transition-all"
          >
            ⚠️ Alertas
          </button>
          <button 
            onClick={() => handleQuickAction('Preciso falar com alguém da equipe sobre alguma pendência?')}
            className="text-[10px] font-bold text-gray-400 hover:text-[#FFAD85] uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-orange-50 transition-all"
          >
            👥 Equipe
          </button>
        </div>
      </div>
    </div>
  );
}
