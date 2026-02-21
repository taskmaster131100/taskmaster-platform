import React, { useState, useRef, useEffect } from 'react';
import { Send, X, BrainCircuit, Mic, MicOff, Paperclip, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: Date;
  audioUrl?: string;
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
      content: `Olá! Sou Marcos Menezes, seu Mentor na plataforma TaskMaster. Estou aqui para ajudar você com qualquer dúvida sobre ${module || 'sua carreira na música'}. Pode falar, digitar ou mandar um áudio — estou ouvindo!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationHistory = useRef<{ role: string; content: string }[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
        if (audioBlob.size > 0) {
          await handleAudioMessage(audioBlob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleAudioMessage = async (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: '🎤 Mensagem de áudio...',
      timestamp: new Date(),
      audioUrl
    };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // Transcrever áudio
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const transcriptionRes = await fetch('/api/ai-transcribe', {
        method: 'POST',
        body: formData
      });

      if (!transcriptionRes.ok) throw new Error('Erro na transcrição');
      const transcriptionData = await transcriptionRes.json();
      const transcribedText = transcriptionData.text;

      if (!transcribedText || transcribedText.trim() === '') {
        throw new Error('Não foi possível entender o áudio');
      }

      // Atualizar mensagem do usuário com o texto transcrito
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id 
          ? { ...m, content: `🎤 "${transcribedText}"` }
          : m
      ));

      // Gerar resposta do mentor
      const mentorResponse = await callMentorAI(transcribedText, module);
      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'mentor',
        content: mentorResponse,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, mentorMessage]);
    } catch (error: any) {
      console.error('Erro ao processar áudio:', error);
      toast.error(error.message || 'Erro ao processar o áudio. Tente novamente.');
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id 
          ? { ...m, content: '🎤 Não foi possível transcrever o áudio. Tente novamente.' }
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  // Upload de ficheiro
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type.includes('text') || file.type.includes('word')) {
        setAttachedFile(file);
        toast.success(`Arquivo "${file.name}" anexado!`);
      } else {
        toast.error('Formato não suportado. Use PDF, Word ou Texto.');
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    let userText = input.trim();
    let fileContent = '';

    if (attachedFile) {
      userText = userText || `Analise este documento: ${attachedFile.name}`;
      try {
        if (attachedFile.type === 'application/pdf') {
          // Extrair texto do PDF
          const arrayBuffer = await attachedFile.arrayBuffer();
          const pdfjsLib = await loadPdfJs();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let text = '';
          for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ') + '\n';
          }
          fileContent = text.substring(0, 8000);
        } else {
          fileContent = await attachedFile.text();
          fileContent = fileContent.substring(0, 8000);
        }
      } catch (err) {
        console.error('Erro ao ler arquivo:', err);
      }
      setAttachedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const fullContent = fileContent 
        ? `${userText}\n\n[DOCUMENTO ANEXADO]:\n${fileContent}`
        : userText;
      
      const mentorResponse = await callMentorAI(fullContent, module);
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

  async function callMentorAI(userMessage: string, currentModule?: string): Promise<string> {
    conversationHistory.current.push({ role: 'user', content: userMessage });

    const systemPrompt = `Você é Marcos Menezes, mentor de carreira musical com mais de 20 anos de experiência na indústria musical brasileira.

SUA PERSONALIDADE:
- Você é direto, prático e orientado a resultados
- Fala como um profissional experiente, mas acessível e motivador
- Usa linguagem informal mas profissional
- Sempre dá exemplos práticos e acionáveis
- Adapta o nível da conversa ao conhecimento do artista

SUAS ÁREAS DE EXPERTISE:
1. Gestão de carreira artística (do iniciante ao profissional)
2. Produção e lançamento de música
3. Marketing digital e redes sociais para artistas
4. Booking e gestão de shows
5. Logística de turnês
6. Contratos e aspectos jurídicos
7. Finanças e split de cachê
8. Construção de equipe
9. Estratégia de conteúdo
10. Relacionamento com gravadoras e distribuidoras

REGRAS:
- Sempre responda em português brasileiro
- Seja proativo: sugira próximos passos concretos
- Quando o artista parecer iniciante, explique conceitos básicos com paciência
- Quando o artista parecer experiente, vá direto ao ponto avançado
- Se receber um documento/projeto, analise profundamente e dê feedback construtivo
- Sempre termine com uma pergunta ou sugestão de próximo passo
- Use a Metodologia 4 Pilares quando relevante: Conteúdo, Shows & Vendas, Logística, Estratégia
- Recomende funcionalidades da plataforma TaskMaster quando aplicável
${currentModule ? `\nO usuário está no módulo: ${currentModule}. Foque suas respostas nesse contexto.` : ''}`;

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.current.slice(-20).map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: apiMessages,
        temperature: 0.8,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro na API: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem. Pode tentar novamente?';
    
    conversationHistory.current.push({ role: 'assistant', content: assistantMessage });
    return assistantMessage;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            <p className="text-xs text-white/80">Mentor TaskMaster Online</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
              message.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            }`}>
              {message.audioUrl && (
                <audio controls src={message.audioUrl} className="mb-2 w-full max-w-[250px]" />
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl rounded-bl-sm">
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

      {/* Attached file indicator */}
      {attachedFile && (
        <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="text-sm text-indigo-700 flex-1 truncate">{attachedFile.name}</span>
          <button onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-indigo-400 hover:text-indigo-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-700">Gravando... {formatTime(recordingTime)}</span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Anexar documento"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              isRecording 
                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Fale com o Marcos Menezes..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            disabled={loading || isRecording}
          />
          <button
            type="submit"
            disabled={loading || isRecording || (!input.trim() && !attachedFile)}
            className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Carregar pdf.js dinamicamente
let pdfJsLoaded: any = null;
async function loadPdfJs() {
  if (pdfJsLoaded) return pdfJsLoaded;
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  document.head.appendChild(script);
  await new Promise(resolve => { script.onload = resolve; });
  const pdfjsLib = (window as any).pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  pdfJsLoaded = pdfjsLib;
  return pdfjsLib;
}
