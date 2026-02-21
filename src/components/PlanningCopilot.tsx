import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Bot, User, Loader2, CheckCircle2,
  Calendar, Music, Megaphone, Truck, DollarSign,
  Target, Zap, Paperclip, FileText, X, Users, Bell, Mic, MicOff
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { localDatabase } from '../services/localDatabase';

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
async function loadPlatformContext(): Promise<PlatformContext> {
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
    // Projetos ativos
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
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

    // Tarefas pendentes
    const { data: tasks } = await supabase
      .from('show_tasks')
      .select('*')
      .neq('status', 'completed')
      .order('due_date', { ascending: true })
      .limit(20);
    context.tasks = tasks || [];

    // Membros da equipe
    const { data: team } = await supabase
      .from('team_invites')
      .select('*')
      .eq('status', 'accepted')
      .limit(20);
    context.teamMembers = team || [];

    // Artistas
    const { data: artists } = await supabase
      .from('artists')
      .select('*')
      .limit(10);
    context.artists = artists || [];

  } catch (error) {
    console.error('Erro ao carregar contexto:', error);
  }

  return context;
}

// Formatar contexto para o system prompt
function formatContextForAI(ctx: PlatformContext): string {
  let contextStr = '';

  if (ctx.projects.length > 0) {
    contextStr += '\n\n📁 PROJETOS ATIVOS:\n';
    ctx.projects.forEach(p => {
      contextStr += `- "${p.title || p.name}" (Status: ${p.status || 'em andamento'}) - ${p.description || 'Sem descrição'}\n`;
    });
  }

  if (ctx.shows.length > 0) {
    contextStr += '\n\n🎤 SHOWS PRÓXIMOS:\n';
    ctx.shows.forEach(s => {
      contextStr += `- "${s.title || s.venue}" em ${s.show_date} - Status: ${s.status || 'pendente'} - Local: ${s.venue || s.city || 'A definir'}\n`;
    });
  }

  if (ctx.tasks.length > 0) {
    contextStr += '\n\n📋 TAREFAS PENDENTES:\n';
    ctx.tasks.forEach(t => {
      contextStr += `- "${t.title || t.description}" - Prazo: ${t.due_date || 'Sem prazo'} - Responsável: ${t.assigned_to || 'Não atribuído'} - Status: ${t.status}\n`;
    });
  }

  if (ctx.teamMembers.length > 0) {
    contextStr += '\n\n👥 EQUIPE:\n';
    ctx.teamMembers.forEach(m => {
      contextStr += `- ${m.name || m.email} - Função: ${m.role || 'Membro'}\n`;
    });
  }

  if (ctx.artists.length > 0) {
    contextStr += '\n\n🎵 ARTISTAS:\n';
    ctx.artists.forEach(a => {
      contextStr += `- "${a.name || a.artist_name}" - Gênero: ${a.genre || 'Não definido'} - Estágio: ${a.stage || a.career_stage || 'Não avaliado'}\n`;
    });
  }

  return contextStr || '\n\nNenhum dado cadastrado ainda na plataforma.';
}

// Chamar OpenAI com contexto completo
async function callAIWithContext(
  messages: { role: string; content: string }[],
  platformContext: PlatformContext,
  fileContent?: string
): Promise<string> {
  const contextStr = formatContextForAI(platformContext);
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const systemPrompt = `Você é o Assistente Copiloto da plataforma TaskMaster, criada por Marcos Menezes.
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

FLUXO DE CRIAÇÃO DE PROJETO (MUITO IMPORTANTE):
Quando o usuário conversar sobre uma ideia, projeto ou anexar um documento:
1. PRIMEIRO: Faça perguntas naturais para entender melhor (nome do projeto, artista, tipo, prazos, orçamento, equipe envolvida)
2. SEGUNDO: Quando tiver informação suficiente, SEMPRE pergunte:
   "Entendi tudo! Quer que eu transforme isso em um fluxo de trabalho completo dentro da plataforma? Vou criar o projeto com todas as tarefas organizadas por fase."
3. TERCEIRO: Quando o usuário aceitar (sim, ok, pode criar, bora, etc.), responda com um JSON estruturado no formato abaixo:

[CRIAR_PROJETO]
{"action":"create_project","project":{"name":"Nome do Projeto","description":"Descrição completa","project_type":"single_release","budget":0,"phases":[{"name":"Fase 1 - Pré-Produção","tasks":[{"title":"Tarefa 1","category":"conteudo","priority":"high","description":"Detalhes"},{"title":"Tarefa 2","category":"marketing","priority":"medium","description":"Detalhes"}]},{"name":"Fase 2 - Produção","tasks":[...]}]}}
[/CRIAR_PROJETO]

CATEGORIAS DE TAREFAS (use nos campos category):
- conteudo: Gravação, mixagem, masterização, produção musical
- marketing: Divulgação, redes sociais, press release, conteúdo visual
- shows: Booking, rider técnico, logística de shows
- logistica: Transporte, hospedagem, equipamentos
- estrategia: Posicionamento, parcerias, distribuição
- financeiro: Orçamento, pagamentos, contratos
- lancamento: Distribuição digital, data de lançamento, playlists

TIPOS DE PROJETO (use em project_type):
- single_release: Lançamento de single
- album_release: Lançamento de álbum/EP
- tour: Turnê
- music_video: Clipe/videoclipe
- artist_management: Gestão geral do artista
- event: Evento específico
- branding: Identidade visual/marca

Se o usuário já subir um projeto COMPLETO com todas as informações (valores, datas, equipe), NÃO faça muitas perguntas - vá direto para a confirmação e crie o fluxo de trabalho.

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

${fileContent ? `\nDOCUMENTO ANEXADO PELO USUÁRIO:\n${fileContent}\n` : ''}`;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || 'Erro desconhecido';
    if (response.status === 401 || response.status === 403) {
      throw new Error('Chave da API OpenAI inválida ou expirada. Entre em contato com o suporte.');
    }
    if (response.status === 429) {
      throw new Error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.');
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

export default function PlanningCopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [platformContext, setPlatformContext] = useState<PlatformContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationHistory = useRef<{ role: string; content: string }[]>([]);

  // Carregar contexto da plataforma ao montar
  useEffect(() => {
    const init = async () => {
      setContextLoading(true);
      const ctx = await loadPlatformContext();
      setPlatformContext(ctx);
      setContextLoading(false);

      // Gerar mensagem inicial proativa baseada no contexto real
      try {
        const greeting = await callAIWithContext(
          [{ role: 'user', content: 'Me dê um resumo rápido do que preciso fazer hoje e esta semana. Seja proativo e direto.' }],
          ctx
        );
        setMessages([{ role: 'assistant', content: greeting }]);
        conversationHistory.current = [
          { role: 'user', content: 'Me dê um resumo rápido do que preciso fazer hoje e esta semana.' },
          { role: 'assistant', content: greeting }
        ];
      } catch (error) {
        console.error('Erro ao gerar saudação:', error);
        setMessages([{
          role: 'assistant',
          content: 'Olá! Sou seu Copiloto TaskMaster. Estou aqui para te ajudar com seus projetos, shows, tarefas e equipe. Me pergunte qualquer coisa ou anexe um documento para eu analisar!'
        }]);
      }
    };
    init();
  }, []);

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
      const aiResponse = await callAIWithContext([...conversationHistory.current], platformContext!);
      conversationHistory.current.push({ role: 'assistant', content: aiResponse });
      const processedMessage = processAIResponse(aiResponse);
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
        conversationHistory.current.slice(-12), // Últimas 12 mensagens para contexto
        platformContext,
        fileContent || undefined
      );

      conversationHistory.current.push({ role: 'assistant', content: aiResponse });

      // Função para processar resposta da IA e detectar criação de projeto
      const processedMessage = processAIResponse(aiResponse);
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

  // Função central para processar resposta da IA e detectar/criar projetos
  const processAIResponse = (aiResponse: string): Message => {
    // Tentar detectar JSON de criação de projeto - com tags ou sem tags
    let projectData: any = null;
    let cleanText = aiResponse;

    // 1. Tentar com tags [CRIAR_PROJETO]...[/CRIAR_PROJETO]
    const tagMatch = aiResponse.match(/\[CRIAR_PROJETO\]([\s\S]*?)\[\/CRIAR_PROJETO\]/);
    if (tagMatch) {
      try {
        const parsed = JSON.parse(tagMatch[1].trim());
        projectData = parsed.project || parsed;
        cleanText = aiResponse.replace(/\[CRIAR_PROJETO\][\s\S]*?\[\/CRIAR_PROJETO\]/, '').trim();
      } catch (e) { console.error('Erro ao parsear tag projeto:', e); }
    }

    // 2. Se não encontrou com tags, tentar JSON puro com "action": "create_project"
    if (!projectData) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*?"action"\s*:\s*"create_project"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          projectData = parsed.project || parsed;
          cleanText = aiResponse.replace(jsonMatch[0], '').trim();
        } catch (e) {
          // Tentar extrair JSON de dentro de blocos de código markdown
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

    // 3. Se não encontrou de nenhuma forma, tentar qualquer JSON com "phases" e "name"
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

    // Se detectou projeto, criar silenciosamente e mostrar mensagem amigável
    if (projectData && projectData.name) {
      try {
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

        // Criar o projeto via localDatabase
        const newProject = localDatabase.createProject({
          name: projectData.name || 'Novo Projeto',
          description: projectData.description || '',
          project_type: projectData.project_type || 'artist_management',
          status: 'active',
          startDate: new Date().toISOString(),
          budget: Number(projectData.budget) || 0,
          totalCost: 0,
          ownerId: 'user_1',
          members: [],
          phases: projectData.phases || [],
          whatsappGroup: '',
          tasks: []
        });

        // Criar tarefas para cada fase
        if (projectData.phases && newProject) {
          projectData.phases.forEach((phase: any, phaseIndex: number) => {
            if (phase.tasks) {
              phase.tasks.forEach((task: any, taskIndex: number) => {
                localDatabase.createTask({
                  title: task.title,
                  description: task.description || '',
                  status: 'pending',
                  priority: task.priority || 'medium',
                  category: task.category || 'conteudo',
                  projectId: newProject.id,
                  phase: phase.name,
                  order: taskIndex
                });
              });
            }
          });
        }

        toast.success(`Projeto criado com sucesso!`);

        // Montar mensagem amigável (SEM código, SEM JSON)
        const friendlyMessage = `✅ **Pronto! Seu projeto "${projectData.name}" foi transformado em um fluxo de trabalho completo dentro da plataforma!**

📊 **Resumo do que foi criado:**
• **${totalPhases} fases** de trabalho organizadas
• **${totalTasks} tarefas** distribuídas por categoria
${phaseNames.map((name, i) => `• Fase ${i + 1}: ${name}`).join('\n')}

Todas as tarefas já estão no seu Dashboard, organizadas por fase e prioridade.

📅 **A partir de que dia você quer começar a trabalhar nesse projeto?** Assim eu configuro as notificações e lembretes para você receber os avisos das atividades que precisam ser feitas em cada etapa.`;

        return {
          role: 'assistant' as const,
          content: friendlyMessage
        };
      } catch (createErr) {
        console.error('Erro ao criar projeto:', createErr);
        toast.error('Erro ao criar o projeto. Tente novamente.');
        return {
          role: 'assistant' as const,
          content: 'Desculpe, tive um problema ao criar o projeto na plataforma. Pode tentar novamente?'
        };
      }
    }

    // Se não é criação de projeto, retornar resposta normal
    return {
      role: 'assistant' as const,
      content: cleanText || aiResponse
    };
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
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={contextLoading}
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
