import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Bot, User, Loader2, CheckCircle2, AlertCircle, 
  ArrowRight, Calendar, Music, Megaphone, Truck, DollarSign,
  Lightbulb, Target, ShieldAlert, Zap, Paperclip, FileText, X
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'plan' | 'suggestion' | 'alert' | 'file_analysis';
  metadata?: any;
}

const FOUR_PILLARS = [
  { id: 'content', label: 'Conteúdo', icon: Music, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'shows', label: 'Shows & Vendas', icon: Megaphone, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 'logistics', label: 'Logística', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'strategy', label: 'Estratégia', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50' }
];

export default function PlanningCopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Olá! Sou seu Copilot de Gestão Musical. Com base na metodologia de 10+ anos do Marcos Menezes, estou aqui para transformar sua carreira em um negócio profissional. Como posso te ajudar hoje? Você também pode anexar seu próprio projeto em PDF para eu analisar!',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        toast.success(`Arquivo "${file.name}" anexado com sucesso!`);
      } else {
        toast.error('Por favor, anexe apenas arquivos PDF, Word ou Texto.');
      }
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input || (attachedFile ? `Analise meu projeto: ${attachedFile.name}` : ''),
      metadata: attachedFile ? { fileName: attachedFile.name } : undefined
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const currentFile = attachedFile;
    setAttachedFile(null);
    setIsLoading(true);

    // Simulação de IA Avançada com Metodologia e Análise de Arquivo
    setTimeout(() => {
      let response: Message;
      
      if (currentFile) {
        response = {
          role: 'assistant',
          content: `Recebi seu projeto "${currentFile.name}". Analisei a estrutura administrativa que você já possui e identifiquei como podemos integrá-la aos 4 Pilares da TaskMaster para potencializar seus resultados:`,
          type: 'file_analysis',
          metadata: {
            analysis: [
              { title: 'Pontos Fortes', items: ['Estrutura de custos bem definida', 'Cronograma de ensaios claro'] },
              { title: 'Oportunidades (4 Pilares)', items: ['Falta estratégia de tráfego pago (Estratégia)', 'Rider técnico não detalhado (Logística)'] },
              { title: 'Ações Sugeridas', items: ['Importar cronograma para o Calendário', 'Gerar tarefas de marketing D-30'] }
            ]
          }
        };
      } else if (input.toLowerCase().includes('lançar') || input.toLowerCase().includes('single')) {
        response = {
          role: 'assistant',
          content: 'Entendido. Para um lançamento de single de alta performance, vamos aplicar a metodologia dos 4 Pilares:',
          type: 'plan',
          metadata: {
            pillars: [
              { title: 'Conteúdo', tasks: ['Mix/Master final', 'Capa do Single', 'Clipe/Visualizer'] },
              { title: 'Estratégia', tasks: ['Pitching Spotify', 'Campanha de Tráfego', 'Press Release'] },
              { title: 'Shows', tasks: ['Agenda de Lançamento', 'Venda de Datas Especiais'] },
              { title: 'Logística', tasks: ['Distribuição Digital (D-21)', 'Registro na UBC'] }
            ]
          }
        };
      } else {
        response = {
          role: 'assistant',
          content: 'Excelente pergunta. Analisando o cenário atual do mercado, minha recomendação proativa é focar na retenção de fãs através de conteúdos de "bastidores" (Pilar de Conteúdo) enquanto estruturamos a logística da próxima turnê. Deseja que eu detalhe o cronograma D-45 para isso?',
        };
      }

      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 2000);
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
            <h3 className="font-bold">Planning Copilot</h3>
            <p className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Metodologia 4 Pilares Ativada</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-bold">v2.1 PRO</div>
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
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#FFAD85] text-white' : 'bg-white shadow-sm text-purple-600'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className="space-y-2">
                <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#FFAD85] text-white rounded-tr-none' : 'bg-white shadow-sm border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                  {msg.content}
                  {msg.metadata?.fileName && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-white/10 rounded-lg border border-white/20">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-medium truncate">{msg.metadata.fileName}</span>
                    </div>
                  )}
                </div>
                
                {msg.type === 'file_analysis' && msg.metadata?.analysis && (
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {msg.metadata.analysis.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Target className="w-3 h-3 text-purple-500" /> {item.title}
                        </h4>
                        <ul className="space-y-1">
                          {item.items.map((text: string, ti: number) => (
                            <li key={ti} className="text-[11px] text-gray-600 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-green-500" /> {text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <button className="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-lg mt-2 hover:bg-purple-700 transition-all">
                      Importar Projeto para TaskMaster
                    </button>
                  </div>
                )}

                {msg.type === 'plan' && msg.metadata?.pillars && (
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {msg.metadata.pillars.map((p: any, pi: number) => (
                      <div key={pi} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Zap className="w-3 h-3 text-orange-500" /> {p.title}
                        </h4>
                        <ul className="space-y-1">
                          {p.tasks.map((t: string, ti: number) => (
                            <li key={ti} className="text-[11px] text-gray-600 flex items-center gap-2">
                              <CheckCircle2 className="w-3 h-3 text-green-500" /> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <button className="w-full py-2 bg-gray-900 text-white text-xs font-bold rounded-lg mt-2 hover:bg-gray-800 transition-all">
                      Aplicar este Plano ao Projeto
                    </button>
                  </div>
                )}
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
              placeholder="Pergunte ou peça para analisar seu anexo..."
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFAD85] outline-none text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !attachedFile)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <button className="text-[10px] font-bold text-gray-400 hover:text-[#FFAD85] uppercase tracking-wider">Sugestão de Lançamento</button>
          <button className="text-[10px] font-bold text-gray-400 hover:text-[#FFAD85] uppercase tracking-wider">Análise de Carreira</button>
          <button className="text-[10px] font-bold text-gray-400 hover:text-[#FFAD85] uppercase tracking-wider">Checklist de Show</button>
        </div>
      </div>
    </div>
  );
}
