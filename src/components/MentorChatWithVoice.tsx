import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Loader, Volume2, Copy, Check } from 'lucide-react';
import {
  AudioRecorder,
  transcribeAudio,
  processVoiceMessage,
  formatDuration,
  validateAudio,
  createAudioUrl,
  revokeAudioUrl
} from '../services/voiceTranscriptionService';
import { toast } from 'sonner';

interface Message {
  id: string;
  type: 'user' | 'mentor';
  content: string;
  audioUrl?: string;
  timestamp: Date;
  isVoice?: boolean;
}

interface MentorChatWithVoiceProps {
  userId: string;
  mode?: 'general' | 'module';
  module?: string;
}

export default function MentorChatWithVoice({
  userId,
  mode = 'general',
  module
}: MentorChatWithVoiceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'mentor',
      content: 'Olá! Sou o Marcos Menezes. Você pode conversar comigo por texto ou por voz. Como posso ajudar você hoje?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicializar recorder
  useEffect(() => {
    recorderRef.current = new AudioRecorder();
  }, []);

  // Atualizar duração da gravação
  useEffect(() => {
    if (isRecording) {
      durationIntervalRef.current = setInterval(() => {
        if (recorderRef.current) {
          setRecordingDuration(recorderRef.current.getDuration());
        }
      }, 100);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Iniciar gravação
  const handleStartRecording = async () => {
    try {
      if (!recorderRef.current) {
        toast.error('Erro ao inicializar gravador');
        return;
      }

      await recorderRef.current.startRecording();
      setIsRecording(true);
      setRecordingDuration(0);
      toast.success('Gravação iniciada. Fale agora!');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar gravação');
    }
  };

  // Parar gravação e transcrever
  const handleStopRecording = async () => {
    try {
      if (!recorderRef.current) return;

      setIsRecording(false);
      const { blob, duration } = await recorderRef.current.stopRecording();

      // Validar áudio
      if (!validateAudio(blob, 1)) {
        toast.error('Áudio muito curto ou inválido');
        return;
      }

      // Transcrever
      setIsTranscribing(true);
      const result = await transcribeAudio(blob);

      if (!result.success) {
        toast.error(result.error || 'Erro ao transcrever áudio');
        return;
      }

      // Adicionar mensagem de voz do usuário
      const userMessageId = `msg-${Date.now()}`;
      const audioUrl = createAudioUrl(blob);

      setMessages(prev => [...prev, {
        id: userMessageId,
        type: 'user',
        content: result.text,
        audioUrl,
        timestamp: new Date(),
        isVoice: true
      }]);

      // Processar e obter resposta
      setIsProcessing(true);
      const response = await processVoiceMessage(result.text, userId, { mode, module });

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        type: 'mentor',
        content: response,
        timestamp: new Date()
      }]);

      toast.success('Resposta recebida!');
    } catch (error) {
      console.error('Erro ao processar áudio:', error);
      toast.error('Erro ao processar áudio');
    } finally {
      setIsTranscribing(false);
      setIsProcessing(false);
    }
  };

  // Enviar mensagem de texto
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      setIsProcessing(true);

      // Adicionar mensagem do usuário
      const userMessageId = `msg-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: userMessageId,
        type: 'user',
        content: inputText,
        timestamp: new Date()
      }]);

      setInputText('');

      // Processar e obter resposta
      const response = await processVoiceMessage(inputText, userId, { mode, module });

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        type: 'mentor',
        content: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsProcessing(false);
    }
  };

  // Copiar texto
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Conversa com Marcos Menezes</h2>
          <p className="text-white/80 text-sm">Chat com suporte a voz e texto</p>
        </div>
        <div className="text-3xl">🎤</div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              }`}
            >
              {/* Áudio (se houver) */}
              {message.audioUrl && (
                <div className="mb-2">
                  <audio
                    src={message.audioUrl}
                    controls
                    className="w-full h-8 rounded"
                  />
                </div>
              )}

              {/* Texto */}
              <p className="text-sm leading-relaxed break-words">{message.content}</p>

              {/* Ações */}
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="opacity-70">
                  {message.timestamp.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {message.type === 'mentor' && (
                  <button
                    onClick={() => handleCopyText(message.id, message.content)}
                    className={`p-1 rounded hover:opacity-70 transition-opacity ${
                      copiedId === message.id ? 'opacity-100' : 'opacity-50'
                    }`}
                    title="Copiar"
                  >
                    {copiedId === message.id ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de digitação */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 space-y-3">
        {/* Status de Gravação */}
        {isRecording && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-sm font-bold text-red-900">
                Gravando... {formatDuration(recordingDuration)}
              </span>
            </div>
          </div>
        )}

        {/* Status de Transcrição */}
        {isTranscribing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <Loader className="w-4 h-4 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-900">Transcrevendo áudio...</span>
          </div>
        )}

        {/* Controles de Áudio e Texto */}
        <div className="flex gap-2">
          {/* Botão de Voz */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isTranscribing || isProcessing}
              className="flex-shrink-0 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gravar áudio"
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleStopRecording}
              disabled={isTranscribing}
              className="flex-shrink-0 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
              title="Parar gravação"
            >
              <Square className="w-5 h-5" />
            </button>
          )}

          {/* Input de Texto */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Digite uma mensagem ou use o microfone..."
            disabled={isRecording || isTranscribing || isProcessing}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Botão de Envio */}
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isRecording || isTranscribing || isProcessing}
            className="flex-shrink-0 p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar mensagem"
          >
            {isProcessing ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Dicas */}
        <div className="text-xs text-gray-500 text-center">
          💡 Dica: Use o microfone para falar naturalmente, como em um WhatsApp. A IA transcreve e responde automaticamente.
        </div>
      </div>
    </div>
  );
}
