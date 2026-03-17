import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Check, Loader2, Send, ArrowRight, Sparkles, AlertCircle, Mic, Square, Paperclip, ListChecks } from 'lucide-react';

interface ProjectWizardProps {
  onComplete: (projectData: any) => void;
  onCancel: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
  type?: 'text' | 'audio' | 'file';
  fileName?: string;
}

interface ProjectData {
  name: string;
  artistName: string;
  genre: string;
  objective: string;
  duration: string;
  phases: string[];
  tasks: string[];
  description: string;
}

// System prompt para o assistente conversacional
const PROJECT_CHAT_SYSTEM_PROMPT = `Você é Marcos Menezes, consultor estratégico musical com 20+ anos de experiência na indústria musical brasileira e internacional. Você é o criador da plataforma TaskMaster. Você está ajudando um artista/gestor a criar um projeto dentro da plataforma.

## SEU OBJETIVO
Conduzir uma conversa NATURAL e FLUIDA para entender completamente a ideia do projeto do artista. NÃO faça um questionário rígido — converse como um mentor de verdade que está genuinamente interessado na ideia.

## COMO CONDUZIR A CONVERSA
1. Comece com entusiasmo genuíno e pergunte o que o artista tem em mente
2. Faça perguntas de follow-up NATURAIS baseadas no que o artista acabou de dizer
3. Dê opiniões e sugestões durante a conversa ("Cara, isso é muito bom! E se a gente...")
4. Se o artista é iniciante, explique conceitos e dê exemplos práticos da indústria
5. Se o artista é experiente, vá direto ao ponto e aprofunde nos detalhes técnicos
6. Adapte suas perguntas ao que o artista já disse — NUNCA repita o que ele já falou
7. Quando sentir que tem informação suficiente, diga algo como "Beleza, acho que já tenho uma boa ideia do que você precisa. Deixa eu montar seu projeto..."
8. Se o artista mandar áudio transcrito, trate como conversa normal — não mencione que foi áudio

## INFORMAÇÕES QUE VOCÊ PRECISA COLETAR (naturalmente, ao longo da conversa):
- O que o artista quer fazer (lançamento, turnê, marca, gravação, etc.)
- Nome do artista/projeto
- Gênero musical
- Em que pé está (já tem material? está começando do zero?)
- Prazo/urgência
- Equipe envolvida (quem já tem, quem precisa contratar)
- Expectativas e metas
- Recursos disponíveis (mas não pressione se não quiser falar)

## SUA PERSONALIDADE
- Direto e prático — não enrola, vai ao ponto
- Fala como um amigo que entende do negócio, não como professor
- Usa linguagem natural, coloquial mas profissional
- É motivador mas NUNCA vende ilusão — fala a verdade com respeito
- Celebra vitórias, por menores que sejam
- Usa expressões como "olha só", "é o seguinte", "vou te falar uma coisa", "presta atenção nisso"

## REGRAS
- Máximo 2-3 parágrafos por mensagem — seja conciso e impactante
- Se o artista anexar um PDF, analise o conteúdo e use na conversa
- NÃO gere o projeto até ter informação suficiente
- Quando tiver informação suficiente, INCLUA no final da sua mensagem a tag especial: [PROJETO_PRONTO]
- Gere entre 10 e 25 tarefas ESPECÍFICAS e ACIONÁVEIS com responsável e prazo

## QUANDO INCLUIR [PROJETO_PRONTO]
Inclua essa tag SOMENTE quando você tiver pelo menos:
- O que o artista quer fazer
- Nome do artista ou do projeto
- Gênero musical ou tipo de projeto
- Alguma ideia de prazo ou escopo

Quando incluir [PROJETO_PRONTO], adicione também um bloco JSON no formato:
\`\`\`json
{
  "name": "Nome do Projeto",
  "artistName": "Nome do Artista",
  "genre": "Gênero",
  "objective": "Objetivo detalhado",
  "duration": "Duração estimada",
  "phases": ["Fase 1 - Descrição", "Fase 2 - Descrição"],
  "tasks": ["Tarefa 1 (Responsável) - Prazo", "Tarefa 2 (Responsável) - Prazo"],
  "description": "Descrição executiva do projeto"
}
\`\`\`
As tasks devem ter 10-25 itens específicos e acionáveis com responsável e prazo.
As phases devem ter 4-8 fases detalhadas e sequenciais.`;

// Função para extrair texto de PDF usando pdf.js
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
          script.onerror = () => reject(new Error('Não foi possível carregar o leitor de PDF'));
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
    fullText += pageText + '\n';
  }
  return fullText;
}

// Classe simples de gravação de áudio
class SimpleAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.mediaRecorder.start(1000);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.mediaRecorder?.stream.getTracks().forEach(t => t.stop());
        resolve(blob);
      };
      this.mediaRecorder.stop();
    });
  }
}

export function ProjectWizard({ onComplete, onCancel }: ProjectWizardProps) {
  const [step, setStep] = useState<'choice' | 'chat' | 'review' | 'error' | 'manual'>('choice');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '', artistName: '', genre: '', objective: '',
    duration: '', phases: [], tasks: [], description: ''
  });

  const conversationHistory = useRef<Array<{ role: string; content: string }>>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<SimpleAudioRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Chamar a IA via proxy
  const callAI = async (userContent: string, fileContent?: string): Promise<string> => {
    const fullContent = fileContent
      ? `${userContent}\n\n[Conteúdo do documento anexado]:\n${fileContent.substring(0, 10000)}`
      : userContent;

    conversationHistory.current.push({ role: 'user', content: fullContent });

    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: PROJECT_CHAT_SYSTEM_PROMPT },
          ...conversationHistory.current.slice(-16)
        ],
        temperature: 0.8,
        max_tokens: 1500
      })
    });

    if (!response.ok) throw new Error('Erro ao comunicar com a IA');

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Desculpe, tive um problema. Pode repetir?';
    conversationHistory.current.push({ role: 'assistant', content: aiMessage });
    return aiMessage;
  };

  // Verificar se a IA indicou que o projeto está pronto
  const checkProjectReady = (aiResponse: string): ProjectData | null => {
    if (!aiResponse.includes('[PROJETO_PRONTO]')) return null;
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          name: parsed.name || 'Novo Projeto',
          artistName: parsed.artistName || 'A definir',
          genre: parsed.genre || 'A definir',
          objective: parsed.objective || '',
          duration: parsed.duration || '6 meses',
          phases: Array.isArray(parsed.phases) ? parsed.phases : ['Planejamento', 'Execução', 'Lançamento'],
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
          description: parsed.description || ''
        };
      }
    } catch (e) {
      console.error('Erro ao parsear projeto da IA:', e);
    }
    return null;
  };

  // Limpar tag e JSON da mensagem visível
  const cleanAIMessage = (msg: string): string => {
    return msg.replace('[PROJETO_PRONTO]', '').replace(/```json[\s\S]*?```/, '').trim();
  };

  // Salvar rascunho da conversa no localStorage
  const saveDraft = (msgs: typeof messages) => {
    try {
      localStorage.setItem('project_wizard_draft', JSON.stringify({
        messages: msgs,
        history: conversationHistory.current,
        savedAt: new Date().toISOString()
      }));
    } catch {}
  };

  // Processar resposta da IA (texto, áudio ou ficheiro)
  const processAIResponse = async (userText: string, fileContent?: string) => {
    setIsLoading(true);
    try {
      const aiResponse = await callAI(userText, fileContent);
      const project = checkProjectReady(aiResponse);
      if (project) {
        const newMsgs = [...messages, { role: 'assistant' as const, content: cleanAIMessage(aiResponse) }];
        setMessages(newMsgs);
        saveDraft(newMsgs);
        setTimeout(() => { setProjectData(project); setStep('review'); }, 2000);
      } else {
        const newMsgs = [...messages, { role: 'assistant' as const, content: aiResponse }];
        setMessages(newMsgs);
        saveDraft(newMsgs);
      }
    } catch (error) {
      console.error('Erro:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ops, tive um problema ao me conectar. Você pode repetir? Se o problema persistir, clique em "Criar manualmente" abaixo.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Iniciar conversa
  const startChat = (withFile?: boolean) => {
    setStep('chat');
    if (!withFile) {
      const greeting: Message = {
        role: 'assistant',
        content: 'E aí! Sou o Marcos, vou te ajudar a montar seu projeto aqui na plataforma. Me conta — o que você tem em mente? Pode ser um lançamento, uma turnê, construção de marca, gravação... qualquer coisa. Me fala o que tá rolando que a gente vai montando juntos!'
      };
      setMessages([greeting]);
      conversationHistory.current = [{ role: 'assistant', content: greeting.content }];
    }
  };

  // Enviar mensagem de texto
  const handleSend = async () => {
    if (!currentInput.trim() || isLoading) return;
    const userText = currentInput.trim();
    setCurrentInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText, type: 'text' }]);
    await processAIResponse(userText);
  };

  // Gravar áudio
  const startRecording = async () => {
    try {
      recorderRef.current = new SimpleAudioRecorder();
      await recorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Não consegui acessar o microfone. Verifique as permissões do navegador e tente novamente, ou digite sua mensagem.'
      }]);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) return;
    try {
      const blob = await recorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

      if (!blob || blob.size === 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Não captei nenhum áudio. Tenta de novo ou digita sua mensagem.' }]);
        return;
      }

      const duration = recordingDuration;
      setMessages(prev => [...prev, { role: 'user', content: `🎤 Áudio (${duration}s) — Transcrevendo...`, type: 'audio' }]);
      setIsLoading(true);

      // Transcrever via proxy
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const transcribeResponse = await fetch('/api/ai-transcribe', {
        method: 'POST',
        body: formData
      });

      if (!transcribeResponse.ok) throw new Error('Erro na transcrição');
      const transcription = await transcribeResponse.json();

      if (!transcription.text || transcription.text.trim().length === 0) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'user', content: '🎤 Áudio — Não consegui entender. Tenta de novo?', type: 'audio' };
          return updated;
        });
        setIsLoading(false);
        return;
      }

      // Atualizar mensagem com transcrição
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'user', content: `🎤 "${transcription.text}"`, type: 'audio' };
        return updated;
      });

      // Enviar para IA
      setIsLoading(false);
      await processAIResponse(transcription.text);
    } catch (error) {
      console.error('Erro na gravação/transcrição:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Tive um problema ao processar o áudio. Pode tentar de novo ou digitar sua mensagem.' }]);
      setIsLoading(false);
      setRecordingDuration(0);
    }
  };

  // Upload de arquivo no chat
  const handleFileInChat = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    setMessages(prev => [...prev, { role: 'user', content: `📎 ${file.name} — Analisando...`, type: 'file', fileName: file.name }]);
    setIsLoading(true);

    try {
      let fileContent = '';
      if (file.type === 'application/pdf') {
        fileContent = await extractTextFromPDF(file);
      } else {
        fileContent = await file.text();
      }

      if (!fileContent || fileContent.trim().length < 30) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Não consegui ler o conteúdo desse arquivo. Se for um PDF escaneado (imagem), infelizmente não consigo ler. Pode me contar sobre o projeto por texto ou áudio?' }]);
        setIsLoading(false);
        return;
      }

      setMessages(prev => {
        const updated = [...prev];
        const idx = updated.length - 1;
        if (updated[idx]?.type === 'file') {
          updated[idx] = { role: 'user', content: `📎 ${file.name} — Documento anexado`, type: 'file', fileName: file.name };
        }
        return updated;
      });

      setIsLoading(false);
      await processAIResponse(`Analise meu projeto que está neste documento: ${file.name}`, fileContent);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Tive um problema ao ler o arquivo. Pode me contar sobre o projeto por texto ou áudio?' }]);
      setIsLoading(false);
    }
  };

  // Upload direto (tela inicial → vai para chat com arquivo)
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startChat(true);

    setTimeout(async () => {
      const greeting: Message = { role: 'assistant', content: 'Boa! Recebi seu documento. Deixa eu analisar aqui...' };
      setMessages([greeting]);
      conversationHistory.current = [{ role: 'assistant', content: greeting.content }];

      setMessages(prev => [...prev, { role: 'user', content: `📎 ${file.name} — Analisando...`, type: 'file', fileName: file.name }]);
      setIsLoading(true);

      try {
        let fileContent = '';
        if (file.type === 'application/pdf') {
          fileContent = await extractTextFromPDF(file);
        } else {
          fileContent = await file.text();
        }

        if (!fileContent || fileContent.trim().length < 30) {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Hmm, não consegui extrair texto desse arquivo. Se for um PDF escaneado, infelizmente não consigo ler. Me conta sobre o projeto por texto ou áudio que a gente monta juntos!' }]);
          setIsLoading(false);
          return;
        }

        setMessages(prev => {
          const updated = [...prev];
          const fileIdx = updated.findIndex(m => m.type === 'file');
          if (fileIdx >= 0) {
            updated[fileIdx] = { role: 'user', content: `📎 ${file.name} — Documento anexado`, type: 'file', fileName: file.name };
          }
          return updated;
        });

        setIsLoading(false);
        await processAIResponse(
          `O artista enviou um documento de projeto para análise: ${file.name}. Analise o conteúdo, faça um resumo do que entendeu, e se tiver informação suficiente, monte o projeto. Se faltar algo, pergunte naturalmente.`,
          fileContent
        );
      } catch (error) {
        console.error('Erro:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Tive um problema ao processar o arquivo. Pode me contar sobre o projeto por texto ou áudio?' }]);
        setIsLoading(false);
      }
    }, 300);
  };

  // Finalizar projeto
  const handleComplete = () => {
    onComplete({
      name: projectData.name || `Projeto ${projectData.artistName}`,
      description: projectData.description || `Projeto de ${projectData.objective} para ${projectData.artistName}`,
      artistName: projectData.artistName,
      genre: projectData.genre,
      objective: projectData.objective,
      duration: projectData.duration,
      phases: projectData.phases,
      tasks: projectData.tasks,
      project_type: 'artist_management',
      status: 'active'
    });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-xl font-bold">Assistente de Projeto</h2>
        </div>
        <p className="text-orange-100 mt-1 text-sm">
          {step === 'choice' && 'Como você quer criar seu projeto?'}
          {step === 'chat' && 'Converse comigo — texto, áudio ou documento'}
          {step === 'review' && 'Revise e confirme seu projeto'}
          {step === 'error' && 'Ops! Algo deu errado'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Escolha inicial */}
        {step === 'choice' && (
          <div className="p-6 space-y-5 overflow-y-auto" style={{ maxHeight: '75vh' }}>
            {/* Templates rápidos */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Começar com template</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    emoji: '🎵',
                    label: 'Lançamento Musical',
                    desc: 'Single, EP ou álbum',
                    data: {
                      name: 'Lançamento Musical',
                      artistName: '',
                      genre: '',
                      objective: 'Lançar nova música nas plataformas digitais com campanha de divulgação',
                      duration: '12 semanas',
                      phases: ['1. Pré-produção (semanas 1-2)', '2. Gravação e Mixagem (semanas 3-6)', '3. Masterização (semana 7)', '4. Distribuição (semanas 8-9)', '5. Divulgação e Marketing (semanas 10-12)'],
                      tasks: ['Definir repertório', 'Contratar produtor/estúdio', 'Gravar as faixas', 'Fazer mixagem', 'Masterização', 'Criar artes (capa, stories, posts)', 'Enviar para distribuidora (CD Baby, ONErpm, DistroKid)', 'Planejar campanha de lançamento', 'Agendar pitching em playlists', 'Planejar live de lançamento', 'Produzir clipe ou lyric video', 'Redigir press release', 'Enviar para blogs e imprensa', 'Acompanhar métricas pós-lançamento'],
                      description: 'Projeto de lançamento musical com linha editorial, distribuição e campanha de divulgação.'
                    }
                  },
                  {
                    emoji: '🎤',
                    label: 'Turnê / Shows',
                    desc: 'Agenda de apresentações',
                    data: {
                      name: 'Planejamento de Shows',
                      artistName: '',
                      genre: '',
                      objective: 'Organizar agenda de shows e turnê com riders, contratos e logística',
                      duration: '8 semanas',
                      phases: ['1. Prospecção e Negociação (semanas 1-2)', '2. Fechamento e Contratos (semanas 3-4)', '3. Pré-produção Técnica (semanas 5-6)', '4. Execução e Pós-show (semanas 7-8)'],
                      tasks: ['Mapear cidades e venues', 'Contato com produtoras locais', 'Negociar cachês e splits', 'Elaborar rider técnico', 'Elaborar rider de hospitalidade', 'Assinar contratos', 'Confirmar logística de viagem', 'Montar setlist', 'Ensaios de preparação', 'Divulgação dos shows', 'Checklist pré-show', 'Relatório financeiro pós-show'],
                      description: 'Planejamento completo de agenda de shows com contratos, riders e logística.'
                    }
                  },
                  {
                    emoji: '🎛️',
                    label: 'Gravação de Álbum',
                    desc: 'Projeto de produção musical',
                    data: {
                      name: 'Gravação de Álbum',
                      artistName: '',
                      genre: '',
                      objective: 'Produzir e gravar álbum completo em estúdio',
                      duration: '6 meses',
                      phases: ['1. Pré-produção e Composição (mês 1)', '2. Pré-gravações e Demos (mês 2)', '3. Gravação Principal (meses 3-4)', '4. Mixagem e Masterização (mês 5)', '5. Arte e Distribuição (mês 6)'],
                      tasks: ['Selecionar faixas do álbum', 'Definir conceito e direção artística', 'Contratar produtor musical', 'Gravar demos de todas as faixas', 'Gravar instrumentais base', 'Gravar vocais', 'Gravar instrumentos extras', 'Mixagem por faixa', 'Mastering do álbum', 'Criar identidade visual (capa, booklet)', 'Definir distribuidora', 'Planejar campanha de lançamento'],
                      description: 'Projeto de produção de álbum completo com controle de cronograma, orçamento e entregas.'
                    }
                  }
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    onClick={() => { setProjectData({ ...tpl.data }); setStep('review'); }}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="text-2xl mb-1">{tpl.emoji}</div>
                    <h3 className="font-semibold text-gray-800 text-sm">{tpl.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{tpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Criar com IA ou documento</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => startChat()}
                  className="p-4 border-2 border-dashed border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group text-center"
                >
                  <Sparkles className="w-8 h-8 mx-auto text-orange-400 group-hover:text-orange-500 mb-1" />
                  <h3 className="font-semibold text-gray-800 text-sm">Criar conversando</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Texto ou áudio com IA</p>
                </button>

                <label className="p-4 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group text-center cursor-pointer">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleDirectUpload} className="hidden" />
                  <Upload className="w-8 h-8 mx-auto text-blue-400 group-hover:text-blue-500 mb-1" />
                  <h3 className="font-semibold text-gray-800 text-sm">Tenho um documento</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Upload e a IA organiza</p>
                </label>

                <button
                  onClick={() => setStep('manual')}
                  className="p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all group text-center"
                >
                  <ListChecks className="w-8 h-8 mx-auto text-gray-400 group-hover:text-gray-500 mb-1" />
                  <h3 className="font-semibold text-gray-800 text-sm">Criar manualmente</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Preencher sem IA</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulário manual — fallback sem IA */}
        {step === 'manual' && (
          <div className="p-6 overflow-y-auto space-y-4" style={{ maxHeight: '65vh' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Projeto *</label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="Ex: Lançamento Verão 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Artista *</label>
                <input
                  type="text"
                  value={projectData.artistName}
                  onChange={(e) => setProjectData(prev => ({ ...prev, artistName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="Nome do artista"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gênero Musical</label>
                <input
                  type="text"
                  value={projectData.genre}
                  onChange={(e) => setProjectData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="Ex: MPB, Pop, Sertanejo"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duração Estimada</label>
                <input
                  type="text"
                  value={projectData.duration}
                  onChange={(e) => setProjectData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="Ex: 3 meses"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Objetivo do Projeto</label>
              <textarea
                value={projectData.objective}
                onChange={(e) => setProjectData(prev => ({ ...prev, objective: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                placeholder="Descreva o objetivo principal deste projeto..."
              />
            </div>
          </div>
        )}

        {/* Chat conversacional */}
        {step === 'chat' && (
          <>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '50vh' }}>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-xs font-semibold text-orange-600">Marcos</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                      <span className="text-xs text-gray-500">Marcos está pensando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="border-t p-3">
              {isRecording ? (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-red-700 font-medium flex-1">Gravando... {formatTime(recordingDuration)}</span>
                  <button onClick={stopRecording} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" title="Parar gravação">
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileInChat} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-50" title="Anexar documento">
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <div className="flex-1">
                    <textarea
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Digite sua mensagem..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      rows={1}
                      disabled={isLoading}
                      style={{ minHeight: '42px', maxHeight: '120px' }}
                    />
                  </div>

                  <button onClick={startRecording} disabled={isLoading} className="p-2 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50" title="Gravar áudio">
                    <Mic className="w-5 h-5" />
                  </button>

                  <button onClick={handleSend} disabled={isLoading || !currentInput.trim()} className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Erro */}
        {step === 'error' && (
          <div className="p-6 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
            <p className="text-gray-800 font-medium">Erro ao processar</p>
            <p className="text-sm text-gray-500 mt-2">{errorMessage}</p>
            <button onClick={() => { setStep('choice'); setErrorMessage(''); }} className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Review */}
        {step === 'review' && (
          <div className="p-6 overflow-y-auto space-y-5" style={{ maxHeight: '60vh' }}>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-700 font-medium text-sm">Projeto montado! Revise e ajuste o que quiser.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Projeto</label>
                <input type="text" value={projectData.name} onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Artista</label>
                <input type="text" value={projectData.artistName} onChange={(e) => setProjectData(prev => ({ ...prev, artistName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gênero</label>
                <input type="text" value={projectData.genre} onChange={(e) => setProjectData(prev => ({ ...prev, genre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duração</label>
                <input type="text" value={projectData.duration} onChange={(e) => setProjectData(prev => ({ ...prev, duration: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Objetivo</label>
              <textarea value={projectData.objective} onChange={(e) => setProjectData(prev => ({ ...prev, objective: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm" rows={2} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Fases do Projeto ({projectData.phases.length})</label>
              <div className="flex flex-wrap gap-2">
                {projectData.phases.map((phase, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">{phase}</span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Tarefas ({projectData.tasks.length})</label>
              <div className="max-h-36 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
                {projectData.tasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600 py-0.5">
                    <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-3 flex justify-between items-center">
        <button
          onClick={step === 'manual' ? () => setStep('choice') : onCancel}
          className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
        >
          {step === 'manual' ? 'Voltar' : 'Cancelar'}
        </button>
        {step === 'chat' && (
          <button
            onClick={() => setStep('manual')}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg"
          >
            Criar manualmente
          </button>
        )}
        {step === 'manual' && (
          <button
            onClick={() => {
              if (!projectData.name.trim() || !projectData.artistName.trim()) {
                return;
              }
              setStep('review');
            }}
            disabled={!projectData.name.trim() || !projectData.artistName.trim()}
            className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            Revisar Projeto <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {step === 'review' && (
          <button onClick={handleComplete} className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 text-sm font-medium">
            Criar Projeto <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ProjectWizard;
