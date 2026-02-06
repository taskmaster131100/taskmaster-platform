import React, { useState, useRef, useEffect } from 'react';
import { Send, X, BrainCircuit, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: Date;
}

interface MentorChatProps {
  module?: string;
  onClose?: () => void;
}

export default function MentorChat({ module, onClose }: MentorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'mentor',
      content: `Olá! Sou Marcos Menezes, seu Mentor FlexMax. Estou aqui para ajudar você com qualquer dúvida sobre ${module || 'sua carreira na música'}. Como posso ajudá-lo?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Simular resposta do Mentor (em produção, isso seria uma chamada à API OpenAI)
      const mentorResponse = await generateMentorResponse(input, module);

      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: mentorResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, mentorMessage]);
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      toast.error('Erro ao conectar com o Mentor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Marcos Menezes</h3>
            <p className="text-xs text-white/80">Mentor FlexMax Online</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-white/70' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Faça uma pergunta ao Marcos Menezes..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Gera resposta do Mentor baseado na pergunta do usuário
 * Em produção, isso seria uma chamada à API OpenAI com system prompt customizado
 */
async function generateMentorResponse(userQuestion: string, module?: string): Promise<string> {
  // Simular delay de resposta
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Respostas pré-configuradas baseadas em palavras-chave
  const lowerQuestion = userQuestion.toLowerCase();

  if (lowerQuestion.includes('split') || lowerQuestion.includes('cachê') || lowerQuestion.includes('financeiro')) {
    return `Ótima pergunta! Sobre o split financeiro: recomendo sempre manter uma margem mínima de 20% para a produção cobrir custos operacionais. Se o artista pedir mais de 85%, negocie reduzindo custos de logística ou aumentando o cachê total. Qual é a situação específica que você está enfrentando?`;
  }

  if (lowerQuestion.includes('logística') || lowerQuestion.includes('roadmap') || lowerQuestion.includes('viagem')) {
    return `Excelente! Para a logística: sempre detalhe horários de saída, paradas e chegada. Considere o tempo de descanso da equipe entre shows. Documente hotéis, refeições e pontos de parada. Isso evita atrasos e mantém a equipe confortável. Precisa de ajuda para estruturar seu RoadMap?`;
  }

  if (lowerQuestion.includes('marketing') || lowerQuestion.includes('reel') || lowerQuestion.includes('engajamento')) {
    return `Ótimo! Para marketing: comece a promover com 2 semanas de antecedência. Use Reels e Stories para conteúdo viral. Engaje com fãs nos comentários para aumentar alcance. Crie uma hashtag única para cada show. Quer que eu gere alguns roteiros de Reels para você?`;
  }

  if (lowerQuestion.includes('contrato') || lowerQuestion.includes('jurídico') || lowerQuestion.includes('legal')) {
    return `Segurança jurídica é fundamental! Sempre tenha um contrato assinado antes do show. Defina claramente responsabilidades, inclua cláusulas de cancelamento e força maior. Documente todos os acordos verbais por escrito. Você já tem um modelo de contrato pronto?`;
  }

  if (lowerQuestion.includes('setlist') || lowerQuestion.includes('músicas') || lowerQuestion.includes('repertório')) {
    return `Para o setlist: escolha músicas que conectem com o público local. Varie o ritmo e energia ao longo do show. Reserve tempo para interação. Tenha um plano B para imprevistos. Qual é o público-alvo do seu próximo show?`;
  }

  // Resposta genérica
  return `Ótima pergunta! Estou aqui para ajudar você a tomar as melhores decisões para sua carreira. Você pode me perguntar sobre financeiro, logística, marketing, produção, contratos ou qualquer outro aspecto da sua gestão. O que mais te preocupa no momento?`;
}
