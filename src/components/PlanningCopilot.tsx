import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Bot, User, Loader2, CheckCircle2,
  Calendar, Music, Megaphone, Truck, DollarSign,
  Target, Zap, Paperclip, FileText, X, Users, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

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
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Chave da OpenAI não configurada');
  }

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

DADOS ATUAIS DA PLATAFORMA DO USUÁRIO:
${contextStr}

REGRAS:
- Sempre baseie suas respostas nos dados reais acima
- Se não há dados, incentive o usuário a cadastrar projetos, shows e equipe
- Quando mencionar membros da equipe, use os nomes reais cadastrados
- Sugira ações específicas com prazos concretos
- Se detectar tarefas atrasadas ou prazos próximos, avise IMEDIATAMENTE
- Quando o usuário anexar um arquivo, analise profundamente e gere um plano de ação completo
- Use os 4 Pilares (Conteúdo, Shows & Vendas, Logística, Estratégia) para organizar recomendações
- Seja proativo: "Vi que você tem um show em 5 dias e o rider técnico não está pronto. Quer que eu ajude?"
- Sugira contatar pessoas da equipe: "O ${platformContext.teamMembers[0]?.name || 'responsável de marketing'} precisa saber sobre isso. Quer que eu mande uma mensagem?"

${fileContent ? `\nDOCUMENTO ANEXADO PELO USUÁRIO:\n${fileContent}\n` : ''}`;

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
    throw new Error(`Erro na API: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
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
        } catch (err) {
          console.error('Erro ao extrair texto:', err);
          fileContent = `[Não foi possível extrair o texto do arquivo ${currentFile.name}]`;
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

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse
      };

      setMessages(prev => [...prev, assistantMessage]);
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
