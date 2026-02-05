import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, FileText, Upload, Download, Plus, Save, Eye, Edit3, Trash2,
  Play, Pause, Volume2, FileMusic, Guitar, Piano, Mic, Users, Share2,
  Copy, Check, X, ChevronDown, ChevronUp, Search, Filter, MoreVertical,
  Music2, ListMusic, FileAudio, FileUp
} from 'lucide-react';
import { toast } from 'sonner';

interface Arrangement {
  id: string;
  title: string;
  artist: string;
  type: 'cifra' | 'partitura' | 'arranjo' | 'letra';
  content: string;
  key: string;
  tempo: number;
  timeSignature: string;
  instruments: string[];
  fileUrl?: string;
  fileName?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'rascunho' | 'finalizado' | 'compartilhado';
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'];
const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '12/8'];
const INSTRUMENTS = ['Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Piano', 'Voz', 'Backing Vocal', 'Percussão', 'Metais', 'Cordas'];

const CHORD_SUGGESTIONS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Dm', 'Em', 'G7', 'C7', 'D7', 'Bb', 'Eb'];

export default function MusicProduction() {
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Editor States
  const [editorTitle, setEditorTitle] = useState('');
  const [editorArtist, setEditorArtist] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorKey, setEditorKey] = useState('C');
  const [editorTempo, setEditorTempo] = useState(120);
  const [editorType, setEditorType] = useState<'cifra' | 'partitura' | 'arranjo' | 'letra'>('cifra');
  const [editorInstruments, setEditorInstruments] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Mock initial data
    const sampleData: Arrangement[] = [
      {
        id: '1', title: 'Exemplo de Cifra', artist: 'Artista Exemplo', type: 'cifra',
        content: '[Intro]\nC G Am F\n\n[Verso]\nC          G\nMinha música começa aqui\nAm         F\nCom um arranjo especial',
        key: 'C', tempo: 90, timeSignature: '4/4', instruments: ['Violão', 'Voz'],
        createdAt: new Date(), updatedAt: new Date(), status: 'finalizado'
      }
    ];
    setArrangements(sampleData);
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setEditorTitle('');
    setEditorArtist('');
    setEditorContent('');
    setEditorKey('C');
    setEditorTempo(120);
    setEditorType('cifra');
    setEditorInstruments([]);
    setUploadedFile(null);
    setSelectedArrangement(null);
  };

  const handleEdit = (arr: Arrangement) => {
    setSelectedArrangement(arr);
    setIsEditing(true);
    setIsCreating(false);
    setEditorTitle(arr.title);
    setEditorArtist(arr.artist);
    setEditorContent(arr.content);
    setEditorKey(arr.key);
    setEditorTempo(arr.tempo);
    setEditorType(arr.type);
    setEditorInstruments(arr.instruments);
    setUploadedFile(arr.fileUrl ? { name: arr.fileName || 'Arquivo', url: arr.fileUrl } : null);
  };

  const handleSave = () => {
    if (!editorTitle) {
      toast.error('Por favor, insira um título');
      return;
    }

    const newArr: Arrangement = {
      id: isCreating ? Math.random().toString(36).substr(2, 9) : selectedArrangement!.id,
      title: editorTitle,
      artist: editorArtist || 'Desconhecido',
      type: editorType,
      content: editorContent,
      key: editorKey,
      tempo: editorTempo,
      timeSignature: '4/4',
      instruments: editorInstruments,
      fileUrl: uploadedFile?.url,
      fileName: uploadedFile?.name,
      createdAt: isCreating ? new Date() : selectedArrangement!.createdAt,
      updatedAt: new Date(),
      status: 'rascunho'
    };

    if (isCreating) {
      setArrangements([newArr, ...arrangements]);
    } else {
      setArrangements(arrangements.map(a => a.id === newArr.id ? newArr : a));
    }

    setIsEditing(false);
    setIsCreating(false);
    setSelectedArrangement(newArr);
    toast.success('Arranjo salvo com sucesso!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, we would upload to Supabase Storage here
      const fakeUrl = URL.createObjectURL(file);
      setUploadedFile({ name: file.name, url: fakeUrl });
      toast.success(`Arquivo ${file.name} carregado!`);
    }
  };

  const insertChord = (chord: string) => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      const text = editorContent;
      const before = text.substring(0, start);
      const after = text.substring(end);
      setEditorContent(before + chord + ' ' + after);
      
      // Focus back to editor
      setTimeout(() => {
        editorRef.current?.focus();
        const newPos = start + chord.length + 1;
        editorRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Music2 className="w-10 h-10 text-[#FFAD85]" />
            Produção Musical
          </h1>
          <p className="text-gray-600 mt-1">Escreva partituras, cifras ou importe arquivos de arranjo</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-[#FFAD85] text-white rounded-xl hover:bg-[#FF9B6A] transition-all shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Novo Arranjo / Cifra
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: List of Arrangements */}
        {!isEditing && (
          <div className="lg:col-span-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar músicas..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#FFAD85] outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Meus Arranjos</span>
                <ListMusic className="w-4 h-4 text-gray-400" />
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {arrangements.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Nenhum arranjo criado ainda.</div>
                ) : (
                  arrangements.map(arr => (
                    <button
                      key={arr.id}
                      onClick={() => setSelectedArrangement(arr)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-4 ${selectedArrangement?.id === arr.id ? 'bg-blue-50/50 border-l-4 border-[#FFAD85]' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[#FFAD85]">
                        {arr.type === 'cifra' ? <Guitar className="w-5 h-5" /> : <FileMusic className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{arr.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{arr.artist}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-400 block">{arr.key}</span>
                        <span className="text-[10px] text-gray-400">{arr.tempo} BPM</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content: Editor or Viewer */}
        <div className={`${isEditing ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
          {isEditing ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[800px]">
              {/* Editor Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[300px] space-y-4">
                  <input
                    type="text"
                    placeholder="Título da Música"
                    className="text-2xl font-bold bg-transparent border-none focus:ring-0 w-full placeholder:text-gray-300"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">Artista:</span>
                      <input
                        type="text"
                        className="text-sm border-b border-gray-200 focus:border-[#FFAD85] outline-none bg-transparent"
                        value={editorArtist}
                        onChange={(e) => setEditorArtist(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">Tom:</span>
                      <select 
                        className="text-sm bg-transparent border-none focus:ring-0 font-bold text-[#FFAD85]"
                        value={editorKey}
                        onChange={(e) => setEditorKey(e.target.value)}
                      >
                        {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">BPM:</span>
                      <input
                        type="number"
                        className="w-16 text-sm bg-transparent border-none focus:ring-0 font-bold text-[#FFAD85]"
                        value={editorTempo}
                        onChange={(e) => setEditorTempo(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setIsEditing(false); setIsCreating(false); }}
                    className="px-4 py-2 text-gray-500 font-semibold hover:bg-gray-100 rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-all font-bold shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Tudo
                  </button>
                </div>
              </div>

              {/* Editor Toolbar */}
              <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Tipo:</span>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['cifra', 'letra', 'arranjo', 'partitura'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setEditorType(t)}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${editorType === t ? 'bg-white text-[#FFAD85] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Acordes:</span>
                  <div className="flex gap-1">
                    {CHORD_SUGGESTIONS.map(chord => (
                      <button
                        key={chord}
                        onClick={() => insertChord(chord)}
                        className="px-2 py-1 bg-blue-50 text-[#FFAD85] text-xs font-bold rounded hover:bg-[#FFAD85] hover:text-white transition-all"
                      >
                        {chord}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 p-6 flex flex-col">
                  <textarea
                    ref={editorRef}
                    className="flex-1 w-full p-4 font-mono text-lg border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#FFAD85] outline-none resize-none leading-relaxed"
                    placeholder={editorType === 'cifra' ? "Escreva a letra e insira os acordes acima...\n\nExemplo:\nC          G\nMinha música começa aqui" : "Escreva as notas do arranjo ou estrutura da música..."}
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                  />
                </div>

                {/* Editor Sidebar: Files & Instruments */}
                <div className="w-72 border-l border-gray-100 bg-gray-50/30 p-6 space-y-8 overflow-y-auto">
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                      <FileUp className="w-4 h-4" /> Arquivos / Guia
                    </h4>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#FFAD85] hover:bg-white cursor-pointer transition-all group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload}
                        accept=".pdf,.mp3,.wav,.doc,.docx,.txt"
                      />
                      {uploadedFile ? (
                        <div className="space-y-2">
                          <FileAudio className="w-8 h-8 text-[#FFAD85] mx-auto" />
                          <p className="text-xs font-bold text-gray-600 truncate">{uploadedFile.name}</p>
                          <button className="text-[10px] text-red-500 font-bold" onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}>Remover</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-gray-300 mx-auto group-hover:text-[#FFAD85]" />
                          <p className="text-xs text-gray-400">PDF, MP3 ou Guia</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Instrumentação
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {INSTRUMENTS.map(inst => (
                        <button
                          key={inst}
                          onClick={() => {
                            setEditorInstruments(prev => 
                              prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${editorInstruments.includes(inst) ? 'bg-[#FFAD85] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#FFAD85]'}`}
                        >
                          {inst}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Viewer Mode */
            <div className="space-y-6">
              {selectedArrangement ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-50 text-[#FFAD85] text-[10px] font-bold uppercase rounded-full">
                          {selectedArrangement.type}
                        </span>
                        <span className="text-sm text-gray-400 font-medium">Criado em {selectedArrangement.createdAt.toLocaleDateString()}</span>
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">{selectedArrangement.title}</h2>
                      <p className="text-lg text-gray-500 font-medium">{selectedArrangement.artist}</p>
                      
                      <div className="flex gap-6 pt-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Tom</span>
                          <span className="text-xl font-bold text-[#FFAD85]">{selectedArrangement.key}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Tempo</span>
                          <span className="text-xl font-bold text-gray-700">{selectedArrangement.tempo} <span className="text-xs text-gray-400">BPM</span></span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Compasso</span>
                          <span className="text-xl font-bold text-gray-700">{selectedArrangement.timeSignature}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(selectedArrangement)}
                        className="p-3 text-gray-400 hover:text-[#FFAD85] hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar"
                      >
                        <Edit3 className="w-6 h-6" />
                      </button>
                      <button
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Conteúdo / Letra & Cifra</h4>
                      <pre className="bg-gray-50 p-8 rounded-2xl font-mono text-lg leading-relaxed text-gray-800 whitespace-pre-wrap border border-gray-100">
                        {selectedArrangement.content || "Nenhum conteúdo escrito."}
                      </pre>
                    </div>
                    <div className="space-y-8">
                      {selectedArrangement.fileUrl && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Arquivo Anexo</h4>
                          <a 
                            href={selectedArrangement.fileUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 group hover:bg-[#FFAD85] transition-all"
                          >
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#FFAD85]">
                              <FileAudio className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-700 truncate group-hover:text-white">{selectedArrangement.fileName}</p>
                              <span className="text-[10px] text-gray-400 group-hover:text-blue-100">Clique para abrir</span>
                            </div>
                            <Download className="w-4 h-4 text-gray-400 group-hover:text-white" />
                          </a>
                        </div>
                      )}

                      <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Instrumentação</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedArrangement.instruments.map(inst => (
                            <span key={inst} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">
                              {inst}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                        <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg">
                          <Share2 className="w-4 h-4" />
                          Compartilhar com a Banda
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Music className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione um arranjo</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Escolha uma música na lista ao lado para visualizar ou editar os detalhes da produção.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
