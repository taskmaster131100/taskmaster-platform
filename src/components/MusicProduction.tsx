import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, FileText, Upload, Download, Plus, Save, Eye, Edit3, Trash2,
  Play, Pause, Volume2, FileMusic, Guitar, Piano, Mic, Users, Share2,
  Copy, Check, X, ChevronDown, ChevronUp, Search, Filter, MoreVertical
} from 'lucide-react';

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
  createdAt: Date;
  updatedAt: Date;
  sharedWith: string[];
  status: 'rascunho' | 'finalizado' | 'compartilhado';
}

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Am', 'A#m', 'Bm', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m'];
const TIME_SIGNATURES = ['4/4', '3/4', '6/8', '2/4', '12/8'];
const INSTRUMENTS = ['Violão', 'Guitarra', 'Baixo', 'Bateria', 'Teclado', 'Piano', 'Violino', 'Saxofone', 'Trompete', 'Flauta', 'Voz', 'Backing Vocal', 'Percussão'];

const COMMON_CHORDS: { [key: string]: string[] } = {
  'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
  'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
  'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#dim'],
  'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#dim'],
  'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#dim'],
  'Am': ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G'],
  'Em': ['Em', 'F#dim', 'G', 'Am', 'Bm', 'C', 'D'],
};

export function MusicProduction() {
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [editorKey, setEditorKey] = useState('C');
  const [editorTempo, setEditorTempo] = useState(120);
  const [editorTimeSignature, setEditorTimeSignature] = useState('4/4');
  const [editorType, setEditorType] = useState<'cifra' | 'partitura' | 'arranjo' | 'letra'>('cifra');
  const [editorInstruments, setEditorInstruments] = useState<string[]>([]);
  const [editorArtist, setEditorArtist] = useState('');
  
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const sampleArrangements: Arrangement[] = [
      {
        id: '1', title: 'Amor de Verdade', artist: 'João Silva', type: 'cifra',
        content: '[Intro] C  G  Am  F\n\n[Verso 1]\nC                G\nQuando eu te vi pela primeira vez\nAm               F\nMeu coração disparou\n\n[Refrão]\nF               G\nAmor de verdade\nC               Am\nÉ o que eu sinto por você',
        key: 'C', tempo: 90, timeSignature: '4/4', instruments: ['Violão', 'Voz', 'Baixo'],
        createdAt: new Date(), updatedAt: new Date(), sharedWith: [], status: 'finalizado'
      },
      {
        id: '2', title: 'Noite de Samba', artist: 'Maria Oliveira', type: 'arranjo',
        content: 'ARRANJO - NOITE DE SAMBA\n\nFORMAÇÃO:\n- Cavaquinho (base)\n- Violão 7 cordas\n- Pandeiro\n- Surdo\n- Voz principal\n\nESTRUTURA:\n1. Intro (8 compassos)\n2. Verso 1 (16 compassos)\n3. Refrão (8 compassos)',
        key: 'G', tempo: 100, timeSignature: '2/4', instruments: ['Cavaquinho', 'Violão', 'Pandeiro'],
        createdAt: new Date(), updatedAt: new Date(), sharedWith: ['musico@email.com'], status: 'compartilhado'
      }
    ];
    setArrangements(sampleArrangements);
  }, []);

  const filteredArrangements = arrangements.filter(arr => {
    const matchesSearch = arr.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || arr.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setEditorContent('');
    setEditorTitle('');
    setEditorKey('C');
    setEditorTempo(120);
    setEditorType('cifra');
    setEditorInstruments([]);
    setSelectedArrangement(null);
  };

  const handleEdit = (arr: Arrangement) => {
    setSelectedArrangement(arr);
    setIsEditing(true);
    setEditorContent(arr.content);
    setEditorTitle(arr.title);
    setEditorKey(arr.key);
    setEditorTempo(arr.tempo);
    setEditorType(arr.type);
    setEditorInstruments(arr.instruments);
    setEditorArtist(arr.artist);
  };

  const handleSave = () => {
    if (!editorTitle.trim()) return alert('Insira um título');
    if (isCreating) {
      const newArr: Arrangement = {
        id: Date.now().toString(), title: editorTitle, artist: editorArtist || 'Não definido',
        type: editorType, content: editorContent, key: editorKey, tempo: editorTempo,
        timeSignature: editorTimeSignature, instruments: editorInstruments,
        createdAt: new Date(), updatedAt: new Date(), sharedWith: [], status: 'rascunho'
      };
      setArrangements([newArr, ...arrangements]);
      setSelectedArrangement(newArr);
    } else if (selectedArrangement) {
      setArrangements(arrangements.map(a => a.id === selectedArrangement.id ? {...a, title: editorTitle, content: editorContent, key: editorKey, tempo: editorTempo, type: editorType, instruments: editorInstruments, updatedAt: new Date()} : a));
    }
    setIsEditing(false);
    setIsCreating(false);
  };

  const insertChord = (chord: string) => {
    if (editorRef.current) {
      const start = editorRef.current.selectionStart;
      setEditorContent(editorContent.substring(0, start) + chord + ' ' + editorContent.substring(start));
    }
  };

  const toggleInstrument = (inst: string) => {
    setEditorInstruments(editorInstruments.includes(inst) ? editorInstruments.filter(i => i !== inst) : [...editorInstruments, inst]);
  };

  const renderTypeIcon = (type: string) => {
    switch(type) {
      case 'cifra': return <Guitar className="w-4 h-4" />;
      case 'partitura': return <FileMusic className="w-4 h-4" />;
      case 'arranjo': return <Music className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const renderStatus = (status: string) => {
    const colors: any = { rascunho: 'bg-gray-100 text-gray-600', finalizado: 'bg-green-100 text-green-600', compartilhado: 'bg-blue-100 text-blue-600' };
    return <span className={`px-2 py-1 rounded-full text-xs ${colors[status]}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Music className="w-7 h-7 text-[#FFAD85]" /> Produção Musical
            </h1>
            <p className="text-gray-500 mt-1">Crie e gerencie arranjos, cifras e partituras</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50">
              <Upload className="w-4 h-4" /> Upload
            </button>
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#ff9b6a]">
              <Plus className="w-4 h-4" /> Novo Arranjo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Buscar arranjos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'cifra', 'partitura', 'arranjo', 'letra'].map(type => (
                  <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1 text-xs rounded-full ${filterType === type ? 'bg-[#FFAD85] text-white' : 'bg-gray-100'}`}>
                    {type === 'all' ? 'Todos' : type}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredArrangements.map(arr => (
                <div key={arr.id} onClick={() => { setSelectedArrangement(arr); setIsEditing(false); }}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedArrangement?.id === arr.id ? 'bg-[#FFAD85]/10 border-l-4 border-l-[#FFAD85]' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">{renderTypeIcon(arr.type)}</div>
                      <div><h3 className="font-medium">{arr.title}</h3><p className="text-sm text-gray-500">{arr.artist}</p></div>
                    </div>
                    {renderStatus(arr.status)}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Tom: {arr.key}</span><span>{arr.tempo} BPM</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
            {isEditing ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <input type="text" placeholder="Título do arranjo..." value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} className="text-xl font-bold bg-transparent border-none focus:outline-none w-full" />
                    <div className="flex gap-2">
                      <button onClick={() => { setIsEditing(false); setIsCreating(false); }} className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded-lg">Cancelar</button>
                      <button onClick={handleSave} className="flex items-center gap-2 px-4 py-1 bg-[#FFAD85] text-white rounded-lg"><Save className="w-4 h-4" /> Salvar</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div><label className="text-xs text-gray-500 block mb-1">Artista</label><input type="text" value={editorArtist} onChange={(e) => setEditorArtist(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs text-gray-500 block mb-1">Tipo</label><select value={editorType} onChange={(e) => setEditorType(e.target.value as any)} className="w-full px-3 py-1.5 border rounded-lg text-sm"><option value="cifra">Cifra</option><option value="partitura">Partitura</option><option value="arranjo">Arranjo</option><option value="letra">Letra</option></select></div>
                    <div><label className="text-xs text-gray-500 block mb-1">Tom</label><select value={editorKey} onChange={(e) => setEditorKey(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-sm">{KEYS.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
                    <div><label className="text-xs text-gray-500 block mb-1">Tempo</label><input type="number" value={editorTempo} onChange={(e) => setEditorTempo(parseInt(e.target.value))} className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
                    <div><label className="text-xs text-gray-500 block mb-1">Compasso</label><select value={editorTimeSignature} onChange={(e) => setEditorTimeSignature(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-sm">{TIME_SIGNATURES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                  </div>
                  <div className="mt-3"><label className="text-xs text-gray-500 block mb-2">Instrumentos</label><div className="flex flex-wrap gap-2">{INSTRUMENTS.map(i => <button key={i} onClick={() => toggleInstrument(i)} className={`px-2 py-1 text-xs rounded-full ${editorInstruments.includes(i) ? 'bg-[#FFAD85] text-white' : 'bg-gray-100'}`}>{i}</button>)}</div></div>
                  {editorType === 'cifra' && <div className="mt-3"><label className="text-xs text-gray-500 block mb-2">Acordes em {editorKey}</label><div className="flex flex-wrap gap-2">{(COMMON_CHORDS[editorKey] || COMMON_CHORDS['C']).map(c => <button key={c} onClick={() => insertChord(c)} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg font-mono">{c}</button>)}</div></div>}
                </div>
                <div className="flex-1 p-4"><textarea ref={editorRef} value={editorContent} onChange={(e) => setEditorContent(e.target.value)} placeholder="Digite aqui..." className="w-full h-full min-h-[400px] p-4 border rounded-lg font-mono text-sm resize-none" /></div>
              </div>
            ) : selectedArrangement ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div><h2 className="text-xl font-bold">{selectedArrangement.title}</h2><p className="text-gray-500">{selectedArrangement.artist}</p></div>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.clipboard.writeText(selectedArrangement.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-2 hover:bg-gray-200 rounded-lg">{copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}</button>
                      <button onClick={() => handleEdit(selectedArrangement)} className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg"><Edit3 className="w-4 h-4" /> Editar</button>
                      <button onClick={() => { if(confirm('Excluir?')) setArrangements(arrangements.filter(a => a.id !== selectedArrangement.id)); setSelectedArrangement(null); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-3 text-sm text-gray-600">{renderTypeIcon(selectedArrangement.type)} <span>Tom: {selectedArrangement.key}</span> <span>{selectedArrangement.tempo} BPM</span> {renderStatus(selectedArrangement.status)}</div>
                  {selectedArrangement.instruments.length > 0 && <div className="flex flex-wrap gap-2 mt-3">{selectedArrangement.instruments.map(i => <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-xs">{i}</span>)}</div>}
                </div>
                <div className="flex-1 p-4 overflow-auto"><pre className="whitespace-pre-wrap font-mono text-sm">{selectedArrangement.content}</pre></div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <Music className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Selecione um arranjo</h3>
                  <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg mx-auto"><Plus className="w-4 h-4" /> Novo Arranjo</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between mb-4"><h3 className="text-lg font-bold">Upload de Arranjo</h3><button onClick={() => setShowUploadModal(false)}><X className="w-5 h-5" /></button></div>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-2">Arraste arquivos ou clique para selecionar</p>
                <p className="text-sm text-gray-400">PDF, TXT, MusicXML, MIDI</p>
                <button className="mt-4 px-4 py-2 bg-[#FFAD85] text-white rounded-lg">Selecionar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MusicProduction;
