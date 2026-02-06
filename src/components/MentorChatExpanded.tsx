import React, { useState, useRef, useEffect } from 'react';
import { Send, X, BrainCircuit, MessageCircle, Lightbulb, ArrowRight, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { generateMentorResponse, isValidQuestion, categorizeQuestion, MentorResponse } from '../services/mentorAIService';

interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: Date;
  category?: string;
  actionSuggestions?: string[];
}

interface MentorChatExpandedProps {
  mode?: 'general' | 'module'; // 'general' para bate-papo livre, 'module' para consultoria técnica
  module?: string;
  onClose?: () => void;
}

export default function MentorChatExpanded({ mode = 'general', module, onClose }: MentorChatExpandedProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'mentor',
      content: mode === 'general' 
        ? `Olá! Sou Marcos Menezes, seu mentor de carreira na música. Estou aqui para conversar sobre qualquer aspecto da sua jornada artística — desde criatividade e negócios até saúde mental e planejamento de futuro. Qual é o assunto que você gostaria de explorar hoje?`
        : `Olá! Sou Marcos Menezes. Estou aqui para ajudar você com ${module || 'sua carreira'}. Como posso ajudá-lo?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
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

    // Validar pergunta
    if (!isValidQuestion(input)) {
      toast.error('Por favor, faça uma pergunta mais clara e detalhada.');
      return;
    }

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
      // Gerar resposta do Mentor
      const mentorResponse = await generateMentorResponse(input);
      const category = categorizeQuestion(input);

      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: mentorResponse.message,
        timestamp: new Date(),
        category,
        actionSuggestions: mentorResponse.actionSuggestions
      };

      setMessages(prev => [...prev, mentorMessage]);
    } catch (error) {
      console.error('Erro ao gerar resposta:', error);
      toast.error('Erro ao conectar com o Mentor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Sugestões de tópicos para começar
  const startingTopics = [
    { emoji: '🎵', label: 'Criatividade', category: 'creativity' },
    { emoji: '💼', label: 'Negócios', category: 'business' },
    { emoji: '📱', label: 'Marketing', category: 'marketing' },
    { emoji: '🎤', label: 'Shows', category: 'shows' },
    { emoji: '🧠', label: 'Bem-estar', category: 'health' },
    { emoji: '🚀', label: 'Futuro', category: 'future' },
  ];

  const handleTopicClick = (topic: string) => {
    const prompts: Record<string, string> = {
      creativity: 'Como eu posso superar um bloqueio criativo e voltar a fazer música com paixão?',
      business: 'Como eu posso aumentar minha receita como artista mantendo a qualidade?',
      marketing: 'Qual é a melhor estratégia de marketing para artistas independentes?',
      shows: 'Como eu posso planejar uma turnê de forma sustentável?',
      health: 'Como eu posso evitar burnout e manter meu bem-estar na carreira musical?',
      future: 'Como eu posso planejar minha carreira para os próximos 5 anos?'
    };
    setInput(prompts[topic] || '');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold">Marcos Menezes</h3>
            <p className="text-xs text-white/80">
              {mode === 'general' ? 'Mentor de Carreira 360°' : `Consultoria - ${module || 'Geral'}`}
            </p>
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
        {messages.map((message, idx) => (
          <div key={message.id}>
            <div
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Action Suggestions */}
            {message.role === 'mentor' && message.actionSuggestions && message.actionSuggestions.length > 0 && (
              <div className="mt-3 ml-0 space-y-2">
                {message.actionSuggestions.map((suggestion, sidx) => (
                  <div
                    key={sidx}
                    className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 text-xs text-indigo-900 flex items-start gap-2"
                  >
                    <Lightbulb className="w-3 h-3 text-indigo-600 mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        {/* Starting Topics (mostrar apenas se não há mensagens além da inicial) */}
        {messages.length === 1 && !loading && mode === 'general' && (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-gray-500 font-bold uppercase">Tópicos para Começar:</p>
            <div className="grid grid-cols-2 gap-2">
              {startingTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTopicClick(topic.category)}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3 text-left hover:shadow-md transition-all text-xs font-bold text-indigo-900 flex items-center gap-2"
                >
                  <span className="text-lg">{topic.emoji}</span>
                  <span>{topic.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={mode === 'general' 
              ? "Converse sobre sua carreira, criatividade, negócios, bem-estar..." 
              : `Faça uma pergunta sobre ${module || 'sua carreira'}...`}
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
        <p className="text-xs text-gray-500 mt-2">
          💡 Marcos Menezes está aqui para conversar sobre qualquer aspecto da sua carreira artística
        </p>
      </div>
    </div>
  );
}
