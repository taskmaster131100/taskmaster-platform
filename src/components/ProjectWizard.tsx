import React, { useState, useRef } from 'react';
import { Upload, MessageSquare, FileText, Check, Loader2, Send, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

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

export function ProjectWizard({ onComplete, onCancel }: ProjectWizardProps) {
  const [step, setStep] = useState<'choice' | 'upload' | 'chat' | 'processing' | 'review'>('choice');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
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
    
    // Simular processamento do PDF com IA
    setTimeout(() => {
      // Dados extraídos do PDF (simulado - na versão real usaria API)
      const extractedData: ProjectData = {
        name: 'Projeto Artístico - ' + file.name.replace('.pdf', ''),
        artistName: 'Artista do Projeto',
        genre: 'A definir',
        objective: 'Lançamento e construção de marca',
        duration: '12 meses',
        phases: ['Fase 1 - Conteúdo', 'Fase 2 - Audiovisual', 'Fase 3 - Shows'],
        tasks: [
          'Gravação de áudio em estúdio',
          'Produção de 400-600 cortes curtos',
          'Gravação de imagem em locações',
          'Distribuição em 10 contas de apoio',
          'Vendas de shows'
        ],
        description: 'Projeto importado do arquivo: ' + file.name
      };
      
      setProjectData(extractedData);
      setStep('review');
    }, 2000);
  };

  // Processar projeto (chat ou upload)
  const processProject = async (source: 'chat' | 'upload') => {
    setStep('processing');
    
    // Gerar tarefas automaticamente baseado nos dados
    const generatedTasks = generateTasks(projectData);
    
    setTimeout(() => {
      setProjectData(prev => ({
        ...prev,
        name: prev.artistName ? `Projeto ${prev.artistName}` : prev.name,
        tasks: generatedTasks
      }));
      setStep('review');
    }, 2000);
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

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Assistente de Projeto
        </h2>
        <p className="text-white/80 mt-1">
          {step === 'choice' && 'Como você gostaria de criar seu projeto?'}
          {step === 'upload' && 'Faça upload do seu projeto'}
          {step === 'chat' && 'Vamos criar seu projeto juntos'}
          {step === 'processing' && 'Processando seu projeto...'}
          {step === 'review' && 'Seu projeto está pronto!'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Step: Choice */}
        {step === 'choice' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setStep('upload')}
              className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#FFAD85] hover:bg-orange-50 transition-all group"
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-[#FFAD85]" />
              <h3 className="font-semibold text-lg mb-2">Já tenho um projeto</h3>
              <p className="text-sm text-gray-500">
                Faça upload do PDF e a IA vai organizar tudo automaticamente
              </p>
            </button>

            <button
              onClick={startChat}
              className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#FFAD85] hover:bg-orange-50 transition-all group"
            >
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400 group-hover:text-[#FFAD85]" />
              <h3 className="font-semibold text-lg mb-2">Criar do zero</h3>
              <p className="text-sm text-gray-500">
                Responda algumas perguntas e criamos seu projeto juntos
              </p>
            </button>
          </div>
        )}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-[#FFAD85] hover:bg-orange-50 transition-all"
            >
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Clique para selecionar o arquivo</p>
              <p className="text-sm text-gray-500">PDF, DOC ou DOCX (máx. 10MB)</p>
            </div>

            <button
              onClick={() => setStep('choice')}
              className="mt-4 text-gray-500 hover:text-gray-700 flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>
        )}

        {/* Step: Chat */}
        {step === 'chat' && (
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-[#FFAD85] text-white'
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
              <button
                onClick={handleChatSubmit}
                disabled={!currentInput.trim()}
                className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#FFAD85] animate-spin" />
            <p className="text-lg font-medium mb-2">Processando seu projeto...</p>
            <p className="text-sm text-gray-500">
              A IA está analisando e organizando tudo para você
            </p>
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-6 h-6 text-green-600" />
              <p className="text-green-800 font-medium">Projeto organizado com sucesso!</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
                <input
                  type="text"
                  value={projectData.name || `Projeto ${projectData.artistName}`}
                  onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Artista</label>
                  <input
                    type="text"
                    value={projectData.artistName}
                    onChange={(e) => setProjectData(prev => ({ ...prev, artistName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                  <input
                    type="text"
                    value={projectData.genre}
                    onChange={(e) => setProjectData(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
                <input
                  type="text"
                  value={projectData.objective}
                  onChange={(e) => setProjectData(prev => ({ ...prev, objective: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                <input
                  type="text"
                  value={projectData.duration}
                  onChange={(e) => setProjectData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {projectData.phases.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fases do Projeto</label>
                  <div className="flex flex-wrap gap-2">
                    {projectData.phases.map((phase, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {phase}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {projectData.tasks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarefas Geradas ({projectData.tasks.length})
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                    {projectData.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-center gap-2 py-1">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
            className="px-6 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg hover:from-[#FF9B6A] hover:to-[#FF8A5A] flex items-center gap-2"
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
