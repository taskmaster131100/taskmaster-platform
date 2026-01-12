import { useState, useRef } from 'react';
import { Upload, MessageSquare, FileText, Check, Loader2, Send, ArrowRight, ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';

interface ProjectWizardProps {
  onComplete: (projectData: any) => void;
  onCancel: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
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

// Função para extrair texto de PDF usando pdf.js
async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // Usar pdf.js via CDN
        const pdfjsLib = (window as any).pdfjsLib;
        if (!pdfjsLib) {
          // Carregar pdf.js dinamicamente
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

// Função para analisar projeto com IA
async function analyzeProjectWithAI(text: string): Promise<ProjectData> {
  try {
    // Usar a API do OpenAI via proxy ou diretamente
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em gestão de projetos musicais. 
            Analise o texto do projeto e extraia as informações em formato JSON com os seguintes campos:
            - name: nome do projeto
            - artistName: nome do artista
            - genre: gênero musical
            - objective: objetivo principal
            - duration: duração prevista
            - phases: array com as fases do projeto
            - tasks: array com as principais tarefas identificadas
            - description: descrição resumida do projeto
            
            Responda APENAS com o JSON, sem markdown ou explicações.`
          },
          {
            role: 'user',
            content: `Analise este projeto artístico e extraia as informações:\n\n${text.substring(0, 8000)}`
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error('Erro na API');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Tentar parsear o JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Resposta inválida');
  } catch (error) {
    console.error('Erro ao analisar com IA:', error);
    // Fallback: extrair informações básicas do texto
    return extractBasicInfo(text);
  }
}

// Fallback: extrair informações básicas do texto sem IA
function extractBasicInfo(text: string): ProjectData {
  const lines = text.split('\n').filter(l => l.trim());
  
  // Tentar encontrar nome do artista
  let artistName = 'Artista';
  const artistMatch = text.match(/artista[:\s]+([^\n]+)/i) || 
                      text.match(/projeto[:\s]+([^\n]+)/i) ||
                      text.match(/nome[:\s]+([^\n]+)/i);
  if (artistMatch) artistName = artistMatch[1].trim();
  
  // Tentar encontrar gênero
  let genre = 'A definir';
  const genreMatch = text.match(/gênero[:\s]+([^\n]+)/i) ||
                     text.match(/estilo[:\s]+([^\n]+)/i);
  if (genreMatch) genre = genreMatch[1].trim();
  
  // Identificar fases
  const phases: string[] = [];
  const phaseMatches = text.match(/fase\s*\d+[:\s-]+([^\n]+)/gi);
  if (phaseMatches) {
    phaseMatches.forEach(m => {
      const phaseName = m.replace(/fase\s*\d+[:\s-]+/i, '').trim();
      if (phaseName) phases.push(phaseName);
    });
  }
  
  // Identificar tarefas/atividades
  const tasks: string[] = [];
  const taskKeywords = ['gravação', 'produção', 'lançamento', 'show', 'conteúdo', 'distribuição', 'marketing', 'audiovisual'];
  taskKeywords.forEach(keyword => {
    const regex = new RegExp(`[^.]*${keyword}[^.]*`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      matches.slice(0, 2).forEach(m => {
        const task = m.trim().substring(0, 100);
        if (task && !tasks.includes(task)) tasks.push(task);
      });
    }
  });
  
  // Adicionar tarefas padrão se não encontrou
  if (tasks.length === 0) {
    tasks.push('Definir cronograma do projeto');
    tasks.push('Montar equipe de trabalho');
    tasks.push('Criar estratégia de divulgação');
  }
  
  return {
    name: `Projeto ${artistName}`,
    artistName,
    genre,
    objective: 'Desenvolvimento artístico e lançamento',
    duration: '12 meses',
    phases: phases.length > 0 ? phases : ['Pré-produção', 'Produção', 'Lançamento'],
    tasks,
    description: lines.slice(0, 3).join(' ').substring(0, 200)
  };
}

export function ProjectWizard({ onComplete, onCancel }: ProjectWizardProps) {
  const [step, setStep] = useState<'choice' | 'upload' | 'chat' | 'processing' | 'review' | 'error'>('choice');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [projectData, setProjectData] = useState<ProjectData>({
    name: '',
    artistName: '',
    genre: '',
    objective: '',
    duration: '',
    phases: [],
    tasks: [],
    description: ''
  });
  const [chatStep, setChatStep] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatQuestions = [
    { question: "Olá! Vamos criar seu projeto juntos. Qual é o nome do artista ou projeto?", field: 'artistName' },
    { question: "Qual é o gênero musical principal?", field: 'genre' },
    { question: "Qual é o objetivo principal deste projeto? (Ex: lançamento de álbum, turnê, construção de marca...)", field: 'objective' },
    { question: "Em quanto tempo você pretende executar este projeto? (Ex: 3 meses, 6 meses, 1 ano)", field: 'duration' },
    { question: "Quais são as principais fases ou etapas que você imagina? (Pode listar separado por vírgula)", field: 'phases' },
    { question: "Tem mais alguma informação importante sobre o projeto que gostaria de adicionar?", field: 'description' }
  ];

  // Iniciar chat
  const startChat = () => {
    setStep('chat');
    setMessages([{ role: 'assistant', content: chatQuestions[0].question }]);
  };

  // Processar resposta do chat
  const handleChatSubmit = async () => {
    if (!currentInput.trim()) return;

    const userMessage = currentInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setCurrentInput('');

    // Salvar resposta no campo correspondente
    const currentQuestion = chatQuestions[chatStep];
    if (currentQuestion.field === 'phases') {
      setProjectData(prev => ({
        ...prev,
        [currentQuestion.field]: userMessage.split(',').map(s => s.trim())
      }));
    } else {
      setProjectData(prev => ({
        ...prev,
        [currentQuestion.field]: userMessage
      }));
    }

    // Próxima pergunta ou finalizar
    if (chatStep < chatQuestions.length - 1) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: chatQuestions[chatStep + 1].question 
        }]);
        setChatStep(chatStep + 1);
      }, 500);
    } else {
      // Finalizar e processar
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Perfeito! Estou organizando seu projeto... 🎯" 
        }]);
        setTimeout(() => processProject('chat'), 1000);
      }, 500);
    }
  };

  // Upload de arquivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setStep('processing');
    setProcessingStatus('Lendo arquivo...');
    
    try {
      // Extrair texto do PDF
      setProcessingStatus('Extraindo texto do documento...');
      let text = '';
      
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        // Para DOC/DOCX, ler como texto
        text = await file.text();
      }
      
      if (!text || text.trim().length < 50) {
        throw new Error('Não foi possível extrair texto suficiente do documento');
      }
      
      // Analisar com IA
      setProcessingStatus('Analisando projeto com IA...');
      const extractedData = await analyzeProjectWithAI(text);
      
      setProcessingStatus('Organizando informações...');
      
      // Garantir que temos dados válidos
      const validatedData: ProjectData = {
        name: extractedData.name || `Projeto - ${file.name.replace(/\.[^/.]+$/, '')}`,
        artistName: extractedData.artistName || 'A definir',
        genre: extractedData.genre || 'A definir',
        objective: extractedData.objective || 'Desenvolvimento artístico',
        duration: extractedData.duration || '12 meses',
        phases: Array.isArray(extractedData.phases) && extractedData.phases.length > 0 
          ? extractedData.phases 
          : ['Pré-produção', 'Produção', 'Lançamento'],
        tasks: Array.isArray(extractedData.tasks) && extractedData.tasks.length > 0
          ? extractedData.tasks
          : ['Definir cronograma', 'Montar equipe', 'Criar estratégia'],
        description: extractedData.description || `Projeto importado de: ${file.name}`
      };
      
      setProjectData(validatedData);
      setStep('review');
      
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao processar o arquivo');
      setStep('error');
    }
  };

  // Processar projeto (chat ou upload)
  const processProject = async (source: 'chat' | 'upload') => {
    setStep('processing');
    setProcessingStatus('Gerando tarefas automaticamente...');
    
    // Gerar tarefas automaticamente baseado nos dados
    const generatedTasks = generateTasks(projectData);
    
    setTimeout(() => {
      setProjectData(prev => ({
        ...prev,
        name: prev.artistName ? `Projeto ${prev.artistName}` : prev.name,
        tasks: generatedTasks
      }));
      setStep('review');
    }, 1500);
  };

  // Gerar tarefas automaticamente
  const generateTasks = (data: ProjectData): string[] => {
    const tasks: string[] = [];
    
    // Tarefas baseadas no objetivo
    if (data.objective.toLowerCase().includes('lançamento')) {
      tasks.push('Definir data de lançamento');
      tasks.push('Preparar material de divulgação');
      tasks.push('Criar estratégia de pré-lançamento');
    }
    
    if (data.objective.toLowerCase().includes('marca') || data.objective.toLowerCase().includes('construção')) {
      tasks.push('Definir identidade visual');
      tasks.push('Criar perfis em redes sociais');
      tasks.push('Desenvolver estratégia de conteúdo');
    }
    
    if (data.objective.toLowerCase().includes('show') || data.objective.toLowerCase().includes('turnê')) {
      tasks.push('Mapear casas de show');
      tasks.push('Preparar rider técnico');
      tasks.push('Criar material de divulgação de shows');
    }
    
    // Tarefas baseadas nas fases
    data.phases.forEach(phase => {
      tasks.push(`Planejar: ${phase}`);
      tasks.push(`Executar: ${phase}`);
    });
    
    // Tarefas padrão
    tasks.push('Definir orçamento do projeto');
    tasks.push('Montar equipe de trabalho');
    tasks.push('Criar cronograma detalhado');
    
    return tasks;
  };

  // Finalizar e criar projeto
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

  // Tentar novamente após erro
  const handleRetry = () => {
    setStep('choice');
    setErrorMessage('');
    setUploadedFile(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-xl font-bold">Assistente de Projeto</h2>
        </div>
        <p className="text-orange-100 mt-1">
          {step === 'choice' && 'Como você gostaria de criar seu projeto?'}
          {step === 'upload' && 'Faça upload do seu projeto'}
          {step === 'chat' && 'Vamos criar juntos!'}
          {step === 'processing' && processingStatus}
          {step === 'review' && 'Revise seu projeto'}
          {step === 'error' && 'Ops! Algo deu errado'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Escolha inicial */}
        {step === 'choice' && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setStep('upload')}
              className="p-6 border-2 border-dashed border-orange-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group"
            >
              <Upload className="w-12 h-12 mx-auto text-orange-400 group-hover:text-orange-500 mb-3" />
              <h3 className="font-semibold text-gray-800">Já tenho um projeto</h3>
              <p className="text-sm text-gray-500 mt-1">
                Faça upload do PDF e a IA vai organizar tudo automaticamente
              </p>
            </button>
            
            <button
              onClick={startChat}
              className="p-6 border-2 border-dashed border-blue-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <MessageSquare className="w-12 h-12 mx-auto text-blue-400 group-hover:text-blue-500 mb-3" />
              <h3 className="font-semibold text-gray-800">Criar do zero</h3>
              <p className="text-sm text-gray-500 mt-1">
                Responda algumas perguntas e criamos seu projeto juntos
              </p>
            </button>
          </div>
        )}

        {/* Upload */}
        {step === 'upload' && (
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="project-file-upload"
            />
            <label
              htmlFor="project-file-upload"
              className="block p-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer"
            >
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Clique para selecionar o arquivo</p>
              <p className="text-sm text-gray-400 mt-1">PDF, DOC ou DOCX (máx. 10MB)</p>
            </label>
            
            <button
              onClick={() => setStep('choice')}
              className="mt-4 text-gray-500 hover:text-gray-700 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        )}

        {/* Chat */}
        {step === 'chat' && (
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                placeholder="Digite sua resposta..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={handleChatSubmit}
                disabled={!currentInput.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto text-orange-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">{processingStatus}</p>
            <p className="text-sm text-gray-400 mt-2">Isso pode levar alguns segundos...</p>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <p className="text-gray-800 font-medium">Erro ao processar o arquivo</p>
            <p className="text-sm text-gray-500 mt-2">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-6 h-6 text-green-500" />
              <p className="text-green-700 font-medium">Projeto analisado com sucesso!</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artista</label>
                <input
                  type="text"
                  value={projectData.artistName}
                  onChange={(e) => setProjectData(prev => ({ ...prev, artistName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                <input
                  type="text"
                  value={projectData.genre}
                  onChange={(e) => setProjectData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                <input
                  type="text"
                  value={projectData.duration}
                  onChange={(e) => setProjectData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
              <input
                type="text"
                value={projectData.objective}
                onChange={(e) => setProjectData(prev => ({ ...prev, objective: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fases do Projeto ({projectData.phases.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {projectData.phases.map((phase, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                    {phase}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarefas Identificadas ({projectData.tasks.length})
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {projectData.tasks.map((task, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    {task}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t p-4 flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </button>
        
        {step === 'review' && (
          <button
            onClick={handleComplete}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
          >
            Criar Projeto
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ProjectWizard;
