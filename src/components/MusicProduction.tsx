import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Music, FileText, Upload, Download, Plus, Save, Eye, Edit3, Trash2,
  Play, Pause, Volume2, FileMusic, Guitar, Piano, Mic, Users, Share2,
  Copy, Check, X, ChevronDown, ChevronUp, Search, Filter, MoreVertical,
  Music2, ListMusic, FileAudio, FileUp, Printer, ZoomIn, ZoomOut
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import abcjs from 'abcjs';

interface Arrangement {
  id: string;
  title: string;
  artist: string;
  type: 'cifra' | 'partitura' | 'arranjo' | 'letra';
  content: string;
  abcNotation: string;
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
const INSTRUMENTS = ['Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Piano', 'Voz', 'Backing Vocal', 'Percussão', 'Metais', 'Cordas', 'Saxofone', 'Flauta', 'Violino', 'Viola', 'Cello'];

const CHORD_SUGGESTIONS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Am', 'Dm', 'Em', 'G7', 'C7', 'D7', 'Bb', 'Eb', 'F#m', 'Bm', 'A7', 'E7', 'B7'];

// Notas ABC para inserção rápida na partitura
const ABC_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'c', 'd', 'e', 'f', 'g', 'a', 'b'];
const ABC_DURATIONS = [
  { label: 'Semibreve', value: '4', symbol: '𝅝' },
  { label: 'Mínima', value: '2', symbol: '𝅗𝅥' },
  { label: 'Semínima', value: '', symbol: '♩' },
  { label: 'Colcheia', value: '/2', symbol: '♪' },
  { label: 'Semicolcheia', value: '/4', symbol: '𝅘𝅥𝅯' },
];
const ABC_RESTS = [
  { label: 'Pausa Semibreve', value: 'z4' },
  { label: 'Pausa Mínima', value: 'z2' },
  { label: 'Pausa Semínima', value: 'z' },
  { label: 'Pausa Colcheia', value: 'z/2' },
];

const DEFAULT_ABC = `X:1
T:Nova Partitura
M:4/4
L:1/4
K:C
C D E F | G A B c | c B A G | F E D C |`;

export default function MusicProduction() {
  const { user } = useAuth();
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Editor States
  const [editorTitle, setEditorTitle] = useState('');
  const [editorArtist, setEditorArtist] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorAbcNotation, setEditorAbcNotation] = useState('');
  const [editorKey, setEditorKey] = useState('C');
  const [editorTempo, setEditorTempo] = useState(120);
  const [editorTimeSignature, setEditorTimeSignature] = useState('4/4');
  const [editorType, setEditorType] = useState<'cifra' | 'partitura' | 'arranjo' | 'letra'>('cifra');
  const [editorInstruments, setEditorInstruments] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string, type: string} | null>(null);
  const [selectedDuration, setSelectedDuration] = useState('');
  const [showAbcHelp, setShowAbcHelp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const abcEditorRef = useRef<HTMLTextAreaElement>(null);
  const sheetMusicRef = useRef<HTMLDivElement>(null);
  const viewerSheetRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadArrangements();
  }, [user]);

  // Renderizar partitura quando o ABC muda (editor)
  useEffect(() => {
    if (editorType === 'partitura' && sheetMusicRef.current && editorAbcNotation) {
      try {
        abcjs.renderAbc(sheetMusicRef.current, editorAbcNotation, {
          responsive: 'resize',
          staffwidth: 700,
          paddingtop: 10,
          paddingbottom: 10,
          add_classes: true,
        });
      } catch (e) {
        console.error('Erro ao renderizar ABC:', e);
      }
    }
  }, [editorAbcNotation, editorType]);

  // Renderizar partitura no viewer
  useEffect(() => {
    if (selectedArrangement?.type === 'partitura' && viewerSheetRef.current && selectedArrangement.abcNotation) {
      try {
        abcjs.renderAbc(viewerSheetRef.current, selectedArrangement.abcNotation, {
          responsive: 'resize',
          staffwidth: 700,
          paddingtop: 10,
          paddingbottom: 10,
        });
      } catch (e) {
        console.error('Erro ao renderizar ABC viewer:', e);
      }
    }
  }, [selectedArrangement]);

  const loadArrangements = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_arrangements')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setArrangements(data.map((d: any) => ({
          id: d.id,
          title: d.title,
          artist: d.artist || '',
          type: d.type || 'cifra',
          content: d.content || '',
          abcNotation: d.abc_notation || '',
          key: d.key || 'C',
          tempo: d.tempo || 120,
          timeSignature: d.time_signature || '4/4',
          instruments: d.instruments || [],
          fileUrl: d.file_url,
          fileName: d.file_name,
          createdAt: new Date(d.created_at),
          updatedAt: new Date(d.updated_at),
          status: d.status || 'rascunho'
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar arranjos:', error);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setEditorTitle('');
    setEditorArtist('');
    setEditorContent('');
    setEditorAbcNotation('');
    setEditorKey('C');
    setEditorTempo(120);
    setEditorTimeSignature('4/4');
    setEditorType('cifra');
    setEditorInstruments([]);
    setUploadedFile(null);
    setSelectedArrangement(null);
  };

  const handleCreatePartitura = () => {
    handleCreate();
    setEditorType('partitura');
    setEditorAbcNotation(DEFAULT_ABC);
  };

  const handleEdit = (arr: Arrangement) => {
    setSelectedArrangement(arr);
    setIsEditing(true);
    setIsCreating(false);
    setEditorTitle(arr.title);
    setEditorArtist(arr.artist);
    setEditorContent(arr.content);
    setEditorAbcNotation(arr.abcNotation || '');
    setEditorKey(arr.key);
    setEditorTempo(arr.tempo);
    setEditorTimeSignature(arr.timeSignature);
    setEditorType(arr.type);
    setEditorInstruments(arr.instruments);
    setUploadedFile(arr.fileUrl ? { name: arr.fileName || 'Arquivo', url: arr.fileUrl, type: 'file' } : null);
  };

  const handleSave = async () => {
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
      abcNotation: editorAbcNotation,
      key: editorKey,
      tempo: editorTempo,
      timeSignature: editorTimeSignature,
      instruments: editorInstruments,
      fileUrl: uploadedFile?.url,
      fileName: uploadedFile?.name,
      createdAt: isCreating ? new Date() : selectedArrangement!.createdAt,
      updatedAt: new Date(),
      status: 'rascunho'
    };

    try {
      const dbData = {
        title: newArr.title,
        artist: newArr.artist,
        type: newArr.type,
        content: newArr.content,
        abc_notation: newArr.abcNotation,
        key: newArr.key,
        tempo: newArr.tempo,
        time_signature: newArr.timeSignature,
        instruments: newArr.instruments,
        file_url: newArr.fileUrl,
        file_name: newArr.fileName,
        status: newArr.status,
        user_id: user?.id,
        updated_at: new Date().toISOString()
      };

      if (isCreating) {
        const { data, error } = await supabase
          .from('user_arrangements')
          .insert({ ...dbData, created_at: new Date().toISOString() })
          .select()
          .single();
        
        if (error) throw error;
        if (data) newArr.id = data.id;
        setArrangements([newArr, ...arrangements]);
      } else {
        const { error } = await supabase
          .from('user_arrangements')
          .update(dbData)
          .eq('id', selectedArrangement!.id);
        
        if (error) throw error;
        setArrangements(arrangements.map(a => a.id === newArr.id ? newArr : a));
      }
      toast.success('Salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      if (isCreating) {
        setArrangements([newArr, ...arrangements]);
      } else {
        setArrangements(arrangements.map(a => a.id === newArr.id ? newArr : a));
      }
      toast.success('Salvo localmente!');
    }

    setIsEditing(false);
    setIsCreating(false);
    setSelectedArrangement(newArr);
  };

  const handleDelete = async (arr: Arrangement) => {
    if (!confirm('Tem certeza que deseja excluir este arranjo?')) return;
    try {
      if (!arr.id.startsWith('sample-')) {
        await supabase.from('user_arrangements').delete().eq('id', arr.id);
      }
      setArrangements(arrangements.filter(a => a.id !== arr.id));
      if (selectedArrangement?.id === arr.id) setSelectedArrangement(null);
      toast.success('Arranjo excluído!');
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir arranjo');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload para Supabase Storage
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('arrangements')
        .upload(fileName, file);
      
      if (error) {
        // Fallback para URL local
        const localUrl = URL.createObjectURL(file);
        setUploadedFile({ name: file.name, url: localUrl, type: file.type });
        toast.success(`${file.name} carregado localmente!`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('arrangements')
        .getPublicUrl(fileName);

      setUploadedFile({ name: file.name, url: urlData.publicUrl, type: file.type });
      toast.success(`${file.name} carregado com sucesso!`);
    } catch (error) {
      const localUrl = URL.createObjectURL(file);
      setUploadedFile({ name: file.name, url: localUrl, type: file.type });
      toast.success(`${file.name} carregado localmente!`);
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
      setTimeout(() => {
        editorRef.current?.focus();
        const newPos = start + chord.length + 1;
        editorRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  const insertAbcNote = (note: string) => {
    if (abcEditorRef.current) {
      const start = abcEditorRef.current.selectionStart;
      const end = abcEditorRef.current.selectionEnd;
      const text = editorAbcNotation;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const noteWithDuration = note + selectedDuration;
      setEditorAbcNotation(before + noteWithDuration + ' ' + after);
      setTimeout(() => {
        abcEditorRef.current?.focus();
        const newPos = start + noteWithDuration.length + 1;
        abcEditorRef.current?.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  const insertAbcRest = (rest: string) => {
    if (abcEditorRef.current) {
      const start = abcEditorRef.current.selectionStart;
      const text = editorAbcNotation;
      const before = text.substring(0, start);
      const after = text.substring(start);
      setEditorAbcNotation(before + rest + ' ' + after);
    }
  };

  const insertBarline = () => {
    if (abcEditorRef.current) {
      const start = abcEditorRef.current.selectionStart;
      const text = editorAbcNotation;
      const before = text.substring(0, start);
      const after = text.substring(start);
      setEditorAbcNotation(before + '| ' + after);
    }
  };

  const updateAbcHeader = () => {
    const lines = editorAbcNotation.split('\n');
    const newLines = lines.map(line => {
      if (line.startsWith('T:')) return `T:${editorTitle}`;
      if (line.startsWith('M:')) return `M:${editorTimeSignature}`;
      if (line.startsWith('K:')) return `K:${editorKey.replace('m', 'min').replace('#', '^')}`;
      if (line.startsWith('Q:')) return `Q:1/4=${editorTempo}`;
      return line;
    });
    // Adicionar Q: se não existir
    if (!newLines.some(l => l.startsWith('Q:'))) {
      const kIndex = newLines.findIndex(l => l.startsWith('K:'));
      if (kIndex >= 0) {
        newLines.splice(kIndex, 0, `Q:1/4=${editorTempo}`);
      }
    }
    setEditorAbcNotation(newLines.join('\n'));
  };

  const playAbc = () => {
    if (!editorAbcNotation) return;
    try {
      if (isPlaying && synthRef.current) {
        synthRef.current.stop();
        setIsPlaying(false);
        return;
      }
      
      const synth = new abcjs.synth.CreateSynth();
      const visualObj = abcjs.renderAbc('*', editorAbcNotation)[0];
      
      synth.init({ visualObj }).then(() => {
        synth.prime().then(() => {
          synth.start();
          synthRef.current = synth;
          setIsPlaying(true);
          // Auto-stop quando terminar
          setTimeout(() => setIsPlaying(false), (visualObj.getTotalTime() || 10) * 1000);
        });
      });
    } catch (e) {
      console.error('Erro ao reproduzir:', e);
      toast.error('Erro ao reproduzir partitura');
    }
  };

  const filteredArrangements = arrangements.filter(arr => {
    const matchesSearch = arr.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          arr.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || arr.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Music2 className="w-10 h-10 text-[#FFAD85]" />
            Produção Musical
          </h1>
          <p className="text-gray-600 mt-1">Escreva partituras, cifras, arranjos ou importe arquivos PDF</p>
        </div>
        {!isEditing && (
          <div className="flex gap-3">
            <button
              onClick={handleCreatePartitura}
              className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg font-semibold"
            >
              <FileMusic className="w-5 h-5" />
              Nova Partitura
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-3 bg-[#FFAD85] text-white rounded-xl hover:bg-[#FF9B6A] transition-all shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nova Cifra / Arranjo
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Lista de Arranjos */}
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

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'Todos' },
                { value: 'cifra', label: 'Cifras' },
                { value: 'partitura', label: 'Partituras' },
                { value: 'arranjo', label: 'Arranjos' },
                { value: 'letra', label: 'Letras' }
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterType(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterType === f.value 
                      ? 'bg-[#FFAD85] text-white' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {filteredArrangements.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Music className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum arranjo encontrado.</p>
                    <p className="text-xs mt-1">Crie uma nova cifra ou partitura para começar.</p>
                  </div>
                ) : (
                  filteredArrangements.map(arr => (
                    <button
                      key={arr.id}
                      onClick={() => setSelectedArrangement(arr)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-4 ${
                        selectedArrangement?.id === arr.id ? 'bg-blue-50/50 border-l-4 border-[#FFAD85]' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        {arr.type === 'cifra' ? <Guitar className="w-5 h-5 text-[#FFAD85]" /> : 
                         arr.type === 'partitura' ? <FileMusic className="w-5 h-5 text-purple-600" /> :
                         arr.type === 'arranjo' ? <ListMusic className="w-5 h-5 text-blue-600" /> :
                         <FileText className="w-5 h-5 text-green-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{arr.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{arr.artist}</p>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{arr.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#FFAD85] block">{arr.key}</span>
                        <span className="text-[10px] text-gray-400">{arr.tempo} BPM</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo Principal: Editor ou Visualizador */}
        <div className={`${isEditing ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
          {isEditing ? (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col" style={{ minHeight: '800px' }}>
              {/* Header do Editor */}
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
                        onChange={(e) => setEditorTempo(parseInt(e.target.value) || 120)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">Compasso:</span>
                      <select 
                        className="text-sm bg-transparent border-none focus:ring-0 font-bold text-[#FFAD85]"
                        value={editorTimeSignature}
                        onChange={(e) => setEditorTimeSignature(e.target.value)}
                      >
                        {TIME_SIGNATURES.map(ts => <option key={ts} value={ts}>{ts}</option>)}
                      </select>
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
                    Salvar
                  </button>
                </div>
              </div>

              {/* Toolbar do Editor */}
              <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-4 overflow-x-auto">
                <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Tipo:</span>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['cifra', 'letra', 'arranjo', 'partitura'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          setEditorType(t);
                          if (t === 'partitura' && !editorAbcNotation) {
                            setEditorAbcNotation(DEFAULT_ABC);
                          }
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                          editorType === t 
                            ? 'bg-white text-[#FFAD85] shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {editorType === 'partitura' ? (
                  <>
                    <div className="flex items-center gap-2 pr-4 border-r border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Duração:</span>
                      <div className="flex gap-1">
                        {ABC_DURATIONS.map(d => (
                          <button
                            key={d.value}
                            onClick={() => setSelectedDuration(d.value)}
                            className={`px-2 py-1 text-sm rounded transition-all ${
                              selectedDuration === d.value 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                            }`}
                            title={d.label}
                          >
                            {d.symbol}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap mr-1">Notas:</span>
                      {ABC_NOTES.map(note => (
                        <button
                          key={note}
                          onClick={() => insertAbcNote(note)}
                          className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded hover:bg-purple-600 hover:text-white transition-all"
                        >
                          {note}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={insertBarline}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-300 transition-all"
                      title="Barra de compasso"
                    >
                      |
                    </button>
                    <button
                      onClick={playAbc}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                        isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isPlaying ? <><Pause className="w-3 h-3" /> Parar</> : <><Play className="w-3 h-3" /> Ouvir</>}
                    </button>
                    <button
                      onClick={() => setShowAbcHelp(!showAbcHelp)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100 transition-all"
                    >
                      ? Ajuda
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase whitespace-nowrap">Acordes:</span>
                    <div className="flex gap-1 flex-wrap">
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
                )}
              </div>

              {/* Ajuda ABC */}
              {showAbcHelp && editorType === 'partitura' && (
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 text-sm text-blue-800">
                  <h4 className="font-bold mb-2">Guia Rápido de Notação ABC:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <strong>Notas graves:</strong> C D E F G A B
                    </div>
                    <div>
                      <strong>Notas agudas:</strong> c d e f g a b
                    </div>
                    <div>
                      <strong>Sustenido:</strong> ^C (Dó#)
                    </div>
                    <div>
                      <strong>Bemol:</strong> _B (Sib)
                    </div>
                    <div>
                      <strong>Semínima:</strong> C (padrão)
                    </div>
                    <div>
                      <strong>Mínima:</strong> C2
                    </div>
                    <div>
                      <strong>Colcheia:</strong> C/2
                    </div>
                    <div>
                      <strong>Barra:</strong> | (compasso)
                    </div>
                    <div>
                      <strong>Pausa:</strong> z (semínima)
                    </div>
                    <div>
                      <strong>Acorde:</strong> [CEG]
                    </div>
                    <div>
                      <strong>Ligadura:</strong> (CDE)
                    </div>
                    <div>
                      <strong>Oitava acima:</strong> c' d' e'
                    </div>
                  </div>
                </div>
              )}

              {/* Corpo do Editor */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col">
                  {editorType === 'partitura' ? (
                    <>
                      {/* Visualização da Partitura */}
                      <div className="p-4 border-b border-gray-100 bg-white overflow-auto" style={{ minHeight: '250px' }}>
                        <div ref={sheetMusicRef} className="sheet-music-container" />
                      </div>
                      {/* Editor ABC */}
                      <div className="flex-1 p-4">
                        <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                          Código ABC (edite abaixo para atualizar a partitura em tempo real)
                        </label>
                        <textarea
                          ref={abcEditorRef}
                          className="w-full h-full p-4 font-mono text-sm border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none resize-none leading-relaxed bg-gray-50"
                          value={editorAbcNotation}
                          onChange={(e) => setEditorAbcNotation(e.target.value)}
                          placeholder="X:1&#10;T:Título&#10;M:4/4&#10;L:1/4&#10;K:C&#10;C D E F | G A B c |"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 p-6">
                      <textarea
                        ref={editorRef}
                        className="w-full h-full p-4 font-mono text-lg border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#FFAD85] outline-none resize-none leading-relaxed"
                        placeholder={
                          editorType === 'cifra' 
                            ? "Escreva a letra e insira os acordes acima...\n\nExemplo:\n[Intro]\nC G Am F\n\n[Verso 1]\nC          G\nMinha música começa aqui\nAm         F\nCom um arranjo especial\n\n[Refrão]\nF          G\nEsse é o refrão\nAm         C\nQue todos vão cantar" 
                            : editorType === 'arranjo'
                            ? "Descreva o arranjo completo...\n\n[Introdução - 4 compassos]\nViolão: Arpejo em C - G - Am - F\nBaixo: Nota fundamental em semínimas\n\n[Verso - 8 compassos]\nViolão: Dedilhado suave\nBateria: Hi-hat + bumbo leve\nBaixo: Walking bass"
                            : "Escreva a letra da música aqui...\n\n[Verso 1]\nAs palavras fluem como um rio\nQue corre sem parar\n\n[Refrão]\nE eu canto para o mundo ouvir\nA melodia do meu coração"
                        }
                        value={editorContent}
                        onChange={(e) => setEditorContent(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Sidebar do Editor: Ficheiros & Instrumentos */}
                <div className="w-72 border-l border-gray-100 bg-gray-50/30 p-6 space-y-6 overflow-y-auto">
                  {/* Upload de Ficheiro */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">
                      <FileUp className="w-4 h-4" /> Anexar Arquivo (PDF, MP3, etc.)
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
                        accept=".pdf,.mp3,.wav,.doc,.docx,.txt,.mid,.midi,.musicxml,.mxl"
                      />
                      {uploadedFile ? (
                        <div className="space-y-2">
                          <FileAudio className="w-8 h-8 text-[#FFAD85] mx-auto" />
                          <p className="text-xs font-bold text-gray-600 truncate">{uploadedFile.name}</p>
                          {uploadedFile.type === 'application/pdf' && (
                            <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer" 
                               className="text-[10px] text-blue-500 font-bold hover:underline block">
                              Visualizar PDF
                            </a>
                          )}
                          <button 
                            className="text-[10px] text-red-500 font-bold" 
                            onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-gray-300 mx-auto group-hover:text-[#FFAD85]" />
                          <p className="text-xs text-gray-400">Clique para enviar</p>
                          <p className="text-[10px] text-gray-300">PDF, MP3, WAV, MIDI, MusicXML</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instrumentação */}
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
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            editorInstruments.includes(inst) 
                              ? 'bg-[#FFAD85] text-white shadow-sm' 
                              : 'bg-white border border-gray-200 text-gray-500 hover:border-[#FFAD85]'
                          }`}
                        >
                          {inst}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pausas (para partitura) */}
                  {editorType === 'partitura' && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Pausas</h4>
                      <div className="flex flex-wrap gap-2">
                        {ABC_RESTS.map(r => (
                          <button
                            key={r.value}
                            onClick={() => insertAbcRest(r.value)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white border border-gray-200 text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-all"
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Modo Visualizador */
            <div className="space-y-6">
              {selectedArrangement ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-8 border-b border-gray-50 flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${
                          selectedArrangement.type === 'partitura' 
                            ? 'bg-purple-50 text-purple-600' 
                            : 'bg-blue-50 text-[#FFAD85]'
                        }`}>
                          {selectedArrangement.type}
                        </span>
                        <span className="text-sm text-gray-400 font-medium">
                          {selectedArrangement.updatedAt.toLocaleDateString('pt-BR')}
                        </span>
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
                        onClick={() => handleDelete(selectedArrangement)}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  <div className="p-8">
                    {/* Renderização de Partitura Visual */}
                    {selectedArrangement.type === 'partitura' && selectedArrangement.abcNotation && (
                      <div className="mb-8">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Partitura</h4>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 overflow-auto">
                          <div ref={viewerSheetRef} className="sheet-music-viewer" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="md:col-span-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">
                          {selectedArrangement.type === 'partitura' ? 'Código ABC' : 'Conteúdo / Letra & Cifra'}
                        </h4>
                        <pre className="bg-gray-50 p-8 rounded-2xl font-mono text-lg leading-relaxed text-gray-800 whitespace-pre-wrap border border-gray-100">
                          {selectedArrangement.type === 'partitura' 
                            ? selectedArrangement.abcNotation 
                            : selectedArrangement.content || "Nenhum conteúdo escrito."}
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
                            {selectedArrangement.instruments.length > 0 ? (
                              selectedArrangement.instruments.map(inst => (
                                <span key={inst} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-lg">
                                  {inst}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">Nenhum instrumento definido</span>
                            )}
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
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Music className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Selecione um arranjo</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Escolha uma música na lista ao lado ou crie uma nova cifra, arranjo ou partitura.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
