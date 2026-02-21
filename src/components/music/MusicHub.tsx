import React, { useState } from 'react';
import { Music, Library, Calendar, List, Plus, X, Guitar, Piano, Mic2, Drum, Volume2, FileText, Clock, Hash, Edit3, Trash2, Eye, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Song {
  id: string;
  name: string;
  artist: string;
  key?: string;
  bpm?: number;
  duration?: string;
  genre?: string;
  lyrics?: string;
  chords?: string;
  notes?: string;
  createdAt: string;
}

interface Arrangement {
  id: string;
  name: string;
  songId?: string;
  songName?: string;
  key?: string;
  bpm?: number;
  timeSignature?: string;
  genre?: string;
  instruments: string[];
  sections?: ArrangementSection[];
  notes?: string;
  status: 'rascunho' | 'em_progresso' | 'finalizado';
  createdAt: string;
}

interface ArrangementSection {
  name: string;
  bars: number;
  notes: string;
}

interface Rehearsal {
  id: string;
  name: string;
  date: string;
  time: string;
  location?: string;
  duration?: string;
  songs: string[];
  notes?: string;
  status: 'agendado' | 'realizado' | 'cancelado';
  createdAt: string;
}

interface Setlist {
  id: string;
  name: string;
  event?: string;
  date?: string;
  songs: string[];
  totalDuration?: string;
  notes?: string;
  createdAt: string;
}

const INSTRUMENTS = [
  { id: 'violao', label: 'Violão', icon: '🎸' },
  { id: 'guitarra', label: 'Guitarra', icon: '🎸' },
  { id: 'baixo', label: 'Baixo', icon: '🎸' },
  { id: 'bateria', label: 'Bateria', icon: '🥁' },
  { id: 'teclado', label: 'Teclado', icon: '🎹' },
  { id: 'piano', label: 'Piano', icon: '🎹' },
  { id: 'voz', label: 'Voz Principal', icon: '🎤' },
  { id: 'backing', label: 'Backing Vocal', icon: '🎤' },
  { id: 'sax', label: 'Saxofone', icon: '🎷' },
  { id: 'trompete', label: 'Trompete', icon: '🎺' },
  { id: 'violino', label: 'Violino', icon: '🎻' },
  { id: 'percussao', label: 'Percussão', icon: '🪘' },
  { id: 'synth', label: 'Sintetizador', icon: '🎛️' },
  { id: 'acordeon', label: 'Acordeão', icon: '🪗' },
  { id: 'outro', label: 'Outro', icon: '🎵' },
];

const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];

const SECTIONS_TEMPLATES = [
  { name: 'Intro', bars: 4 },
  { name: 'Verso 1', bars: 8 },
  { name: 'Pré-Refrão', bars: 4 },
  { name: 'Refrão', bars: 8 },
  { name: 'Verso 2', bars: 8 },
  { name: 'Ponte', bars: 4 },
  { name: 'Solo', bars: 8 },
  { name: 'Outro/Final', bars: 4 },
];

export default function MusicHub() {
  const [activeTab, setActiveTab] = useState('repertoire');
  const [songs, setSongs] = useState<Song[]>([]);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);

  const [showSongModal, setShowSongModal] = useState(false);
  const [showArrangementModal, setShowArrangementModal] = useState(false);
  const [showRehearsalModal, setShowRehearsalModal] = useState(false);
  const [showSetlistModal, setShowSetlistModal] = useState(false);
  const [viewingArrangement, setViewingArrangement] = useState<Arrangement | null>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [arrangementSections, setArrangementSections] = useState<ArrangementSection[]>([]);

  const tabs = [
    { id: 'repertoire', label: 'Repertório', icon: Library, count: songs.length },
    { id: 'arrangements', label: 'Arranjos', icon: Music, count: arrangements.length },
    { id: 'rehearsals', label: 'Ensaios', icon: Calendar, count: rehearsals.length },
    { id: 'setlists', label: 'Setlists', icon: List, count: setlists.length }
  ];

  const toggleInstrument = (id: string) => {
    setSelectedInstruments(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const addSection = (template?: { name: string; bars: number }) => {
    setArrangementSections(prev => [...prev, {
      name: template?.name || 'Nova Seção',
      bars: template?.bars || 4,
      notes: ''
    }]);
  };

  const removeSection = (index: number) => {
    setArrangementSections(prev => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: keyof ArrangementSection, value: any) => {
    setArrangementSections(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const deleteArrangement = (id: string) => {
    setArrangements(prev => prev.filter(a => a.id !== id));
    toast.success('Arranjo removido');
  };

  const deleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    toast.success('Música removida');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Produção Musical</h1>
          <p className="text-gray-600 mt-1">Gerencie repertório, arranjos, ensaios e setlists</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-[#FFAD85]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{songs.length}</p>
                <p className="text-xs text-gray-500">Músicas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{arrangements.length}</p>
                <p className="text-xs text-gray-500">Arranjos</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rehearsals.length}</p>
                <p className="text-xs text-gray-500">Ensaios</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <List className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{setlists.length}</p>
                <p className="text-xs text-gray-500">Setlists</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#FFAD85] text-[#FFAD85]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">

          {/* ===== REPERTÓRIO ===== */}
          {activeTab === 'repertoire' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Repertório</h3>
                  <p className="text-gray-600 text-sm">Gerencie suas músicas, cifras e letras</p>
                </div>
                <button onClick={() => setShowSongModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors">
                  <Plus className="w-5 h-5" />
                  Nova Música
                </button>
              </div>
              {songs.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Nenhuma música cadastrada</h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Adicione suas músicas ao repertório para organizar cifras, letras, tonalidades e criar arranjos profissionais.</p>
                  <button onClick={() => setShowSongModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors">
                    <Plus className="w-5 h-5" />
                    Adicionar Primeira Música
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {songs.map(song => (
                    <div key={song.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                            <Music className="w-4 h-4 text-[#FFAD85]" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{song.name}</h4>
                            <p className="text-xs text-gray-500">{song.artist}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteSong(song.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {song.key && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Tom: {song.key}</span>}
                        {song.bpm && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{song.bpm} BPM</span>}
                        {song.duration && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{song.duration}</span>}
                        {song.genre && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{song.genre}</span>}
                      </div>
                      {song.notes && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{song.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ARRANJOS ===== */}
          {activeTab === 'arrangements' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Arranjos</h3>
                  <p className="text-gray-600 text-sm">Crie arranjos completos com instrumentos, seções e estrutura</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedInstruments([]);
                    setArrangementSections([]);
                    setShowArrangementModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Novo Arranjo
                </button>
              </div>
              {arrangements.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Nenhum arranjo criado</h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Crie arranjos profissionais com instrumentação, estrutura por seções (intro, verso, refrão, etc.), tonalidade e BPM.</p>
                  <button
                    onClick={() => {
                      setSelectedInstruments([]);
                      setArrangementSections([]);
                      setShowArrangementModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Criar Primeiro Arranjo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {arrangements.map(arr => (
                    <div key={arr.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900">{arr.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              arr.status === 'finalizado' ? 'bg-green-100 text-green-700' :
                              arr.status === 'em_progresso' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {arr.status === 'finalizado' ? 'Finalizado' : arr.status === 'em_progresso' ? 'Em Progresso' : 'Rascunho'}
                            </span>
                          </div>
                          {arr.songName && <p className="text-sm text-gray-500 mb-2">Música: {arr.songName}</p>}
                          <div className="flex flex-wrap gap-2 mb-2">
                            {arr.key && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Tom: {arr.key}</span>}
                            {arr.bpm && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{arr.bpm} BPM</span>}
                            {arr.timeSignature && <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{arr.timeSignature}</span>}
                            {arr.genre && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{arr.genre}</span>}
                          </div>
                          {arr.instruments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {arr.instruments.map(inst => {
                                const instrument = INSTRUMENTS.find(i => i.id === inst);
                                return (
                                  <span key={inst} className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full border border-gray-100">
                                    {instrument?.icon} {instrument?.label || inst}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {arr.sections && arr.sections.length > 0 && (
                            <p className="text-xs text-gray-400">{arr.sections.length} seções • {arr.sections.reduce((acc, s) => acc + s.bars, 0)} compassos</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setViewingArrangement(arr)} className="p-2 hover:bg-blue-50 rounded-lg" title="Ver detalhes">
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          <button onClick={() => deleteArrangement(arr.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Remover">
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== ENSAIOS ===== */}
          {activeTab === 'rehearsals' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Ensaios</h3>
                  <p className="text-gray-600 text-sm">Agende ensaios com local, horário e repertório</p>
                </div>
                <button onClick={() => setShowRehearsalModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  Novo Ensaio
                </button>
              </div>
              {rehearsals.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Nenhum ensaio agendado</h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Agende ensaios com data, horário, local e repertório para manter a banda organizada.</p>
                  <button onClick={() => setShowRehearsalModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Plus className="w-5 h-5" />
                    Agendar Primeiro Ensaio
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {rehearsals.map(reh => (
                    <div key={reh.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{reh.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              reh.status === 'realizado' ? 'bg-green-100 text-green-700' :
                              reh.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {reh.status === 'realizado' ? 'Realizado' : reh.status === 'cancelado' ? 'Cancelado' : 'Agendado'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{reh.date} às {reh.time}</p>
                          {reh.location && <p className="text-xs text-gray-500 mt-1">📍 {reh.location}</p>}
                          {reh.duration && <p className="text-xs text-gray-500">⏱ Duração: {reh.duration}</p>}
                          {reh.notes && <p className="text-xs text-gray-400 mt-1">{reh.notes}</p>}
                        </div>
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== SETLISTS ===== */}
          {activeTab === 'setlists' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-1">Setlists</h3>
                  <p className="text-gray-600 text-sm">Monte setlists profissionais para shows e eventos</p>
                </div>
                <button onClick={() => setShowSetlistModal(true)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  <Plus className="w-5 h-5" />
                  Novo Setlist
                </button>
              </div>
              {setlists.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <List className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Nenhum setlist criado</h4>
                  <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Monte setlists organizados para seus shows com ordem das músicas, duração estimada e observações.</p>
                  <button onClick={() => setShowSetlistModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    <Plus className="w-5 h-5" />
                    Criar Primeiro Setlist
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {setlists.map(set => (
                    <div key={set.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{set.name}</h4>
                          {set.event && <p className="text-sm text-gray-600 mt-1">🎤 {set.event}</p>}
                          {set.date && <p className="text-xs text-gray-500">📅 {set.date}</p>}
                          <p className="text-xs text-gray-500 mt-1">{set.songs.length} músicas{set.totalDuration ? ` • ${set.totalDuration}` : ''}</p>
                          {set.notes && <p className="text-xs text-gray-400 mt-1">{set.notes}</p>}
                        </div>
                        <List className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL: NOVA MÚSICA ===== */}
      {showSongModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Música</h3>
              <button onClick={() => setShowSongModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const newSong: Song = {
                id: Date.now().toString(),
                name: fd.get('name') as string,
                artist: fd.get('artist') as string,
                key: fd.get('key') as string || undefined,
                bpm: fd.get('bpm') ? Number(fd.get('bpm')) : undefined,
                duration: fd.get('duration') as string || undefined,
                genre: fd.get('genre') as string || undefined,
                lyrics: fd.get('lyrics') as string || undefined,
                chords: fd.get('chords') as string || undefined,
                notes: fd.get('notes') as string || undefined,
                createdAt: new Date().toISOString()
              };
              setSongs([...songs, newSong]);
              setShowSongModal(false);
              toast.success('Música adicionada com sucesso!');
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Música *</label>
                    <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Artista *</label>
                    <input name="artist" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tonalidade</label>
                    <select name="key" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]">
                      <option value="">Selecione</option>
                      {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BPM</label>
                    <input name="bpm" type="number" min="40" max="300" placeholder="120" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                    <input name="duration" type="text" placeholder="3:45" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                    <input name="genre" type="text" placeholder="Pop, Rock..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cifra / Acordes</label>
                  <textarea name="chords" rows={2} placeholder="Am  G  F  E..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Letra</label>
                  <textarea name="lyrics" rows={3} placeholder="Escreva a letra da música..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="notes" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowSongModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: NOVO ARRANJO (MELHORADO) ===== */}
      {showArrangementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Arranjo</h3>
              <button onClick={() => setShowArrangementModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const newArr: Arrangement = {
                id: Date.now().toString(),
                name: fd.get('name') as string,
                songName: fd.get('songName') as string || undefined,
                key: fd.get('key') as string || undefined,
                bpm: fd.get('bpm') ? Number(fd.get('bpm')) : undefined,
                timeSignature: fd.get('timeSignature') as string || '4/4',
                genre: fd.get('genre') as string || undefined,
                instruments: selectedInstruments,
                sections: arrangementSections.length > 0 ? arrangementSections : undefined,
                notes: fd.get('notes') as string || undefined,
                status: (fd.get('status') as Arrangement['status']) || 'rascunho',
                createdAt: new Date().toISOString()
              };
              setArrangements([...arrangements, newArr]);
              setShowArrangementModal(false);
              setSelectedInstruments([]);
              setArrangementSections([]);
              toast.success('Arranjo criado com sucesso!');
            }}>
              <div className="space-y-5">
                {/* Info básica */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Arranjo *</label>
                    <input name="name" type="text" required placeholder="Ex: Arranjo Acústico - Sem Limites" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Música (referência)</label>
                    <input name="songName" type="text" placeholder="Nome da música" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tonalidade</label>
                    <select name="key" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      <option value="">Selecione</option>
                      {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">BPM</label>
                    <input name="bpm" type="number" min="40" max="300" placeholder="120" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compasso</label>
                    <select name="timeSignature" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      <option value="4/4">4/4</option>
                      <option value="3/4">3/4</option>
                      <option value="6/8">6/8</option>
                      <option value="2/4">2/4</option>
                      <option value="7/8">7/8</option>
                      <option value="5/4">5/4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                    <input name="genre" type="text" placeholder="Pop, Rock, MPB..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                      <option value="rascunho">Rascunho</option>
                      <option value="em_progresso">Em Progresso</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>

                {/* Instrumentos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instrumentação</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {INSTRUMENTS.map(inst => (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => toggleInstrument(inst.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs ${
                          selectedInstruments.includes(inst.id)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span className="text-lg">{inst.icon}</span>
                        <span className="truncate w-full text-center">{inst.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seções do Arranjo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Estrutura / Seções</label>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => {
                        SECTIONS_TEMPLATES.forEach(t => addSection(t));
                      }} className="text-xs text-green-600 hover:text-green-700 px-2 py-1 bg-green-50 rounded">
                        + Estrutura Padrão
                      </button>
                      <button type="button" onClick={() => addSection()} className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 bg-blue-50 rounded">
                        + Seção
                      </button>
                    </div>
                  </div>
                  {arrangementSections.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Clique em "+ Estrutura Padrão" para adicionar intro, verso, refrão, etc.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {arrangementSections.map((section, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                          <span className="text-xs text-gray-400 w-5">{idx + 1}</span>
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) => updateSection(idx, 'name', e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-green-500"
                          />
                          <input
                            type="number"
                            value={section.bars}
                            onChange={(e) => updateSection(idx, 'bars', Number(e.target.value))}
                            className="w-16 px-2 py-1 text-sm border border-gray-200 rounded text-center focus:ring-1 focus:ring-green-500"
                            min="1"
                          />
                          <span className="text-xs text-gray-400">comp.</span>
                          <input
                            type="text"
                            value={section.notes}
                            onChange={(e) => updateSection(idx, 'notes', e.target.value)}
                            placeholder="Notas..."
                            className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-green-500"
                          />
                          <button type="button" onClick={() => removeSection(idx)} className="p-1 hover:bg-red-50 rounded">
                            <X className="w-3 h-3 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações Gerais</label>
                  <textarea name="notes" rows={3} placeholder="Dinâmica, referências, detalhes de produção..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowArrangementModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Criar Arranjo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: NOVO ENSAIO ===== */}
      {showRehearsalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Ensaio</h3>
              <button onClick={() => setShowRehearsalModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const newReh: Rehearsal = {
                id: Date.now().toString(),
                name: fd.get('name') as string,
                date: fd.get('date') as string,
                time: fd.get('time') as string,
                location: fd.get('location') as string || undefined,
                duration: fd.get('duration') as string || undefined,
                songs: [],
                notes: fd.get('notes') as string || undefined,
                status: 'agendado',
                createdAt: new Date().toISOString()
              };
              setRehearsals([...rehearsals, newReh]);
              setShowRehearsalModal(false);
              toast.success('Ensaio agendado com sucesso!');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Ensaio *</label>
                  <input name="name" type="text" required placeholder="Ex: Ensaio geral - Show dia 15" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                    <input name="date" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                    <input name="time" type="time" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
                  <input name="location" type="text" placeholder="Estúdio, sala de ensaio..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duração Prevista</label>
                  <input name="duration" type="text" placeholder="2 horas" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="notes" rows={2} placeholder="Repertório, foco do ensaio..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowRehearsalModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: NOVO SETLIST ===== */}
      {showSetlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Setlist</h3>
              <button onClick={() => setShowSetlistModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const newSet: Setlist = {
                id: Date.now().toString(),
                name: fd.get('name') as string,
                event: fd.get('event') as string || undefined,
                date: fd.get('date') as string || undefined,
                songs: [],
                totalDuration: fd.get('totalDuration') as string || undefined,
                notes: fd.get('notes') as string || undefined,
                createdAt: new Date().toISOString()
              };
              setSetlists([...setlists, newSet]);
              setShowSetlistModal(false);
              toast.success('Setlist criado com sucesso!');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Setlist *</label>
                  <input name="name" type="text" required placeholder="Ex: Show Acústico - Bar do Blues" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Evento / Show</label>
                  <input name="event" type="text" placeholder="Nome do evento ou show" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input name="date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração Total</label>
                    <input name="totalDuration" type="text" placeholder="1h30" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="notes" rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowSetlistModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: VER ARRANJO ===== */}
      {viewingArrangement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{viewingArrangement.name}</h3>
              <button onClick={() => setViewingArrangement(null)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {viewingArrangement.key && <span className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">Tom: {viewingArrangement.key}</span>}
                {viewingArrangement.bpm && <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full">{viewingArrangement.bpm} BPM</span>}
                {viewingArrangement.timeSignature && <span className="text-sm bg-orange-50 text-orange-700 px-3 py-1 rounded-full">{viewingArrangement.timeSignature}</span>}
                {viewingArrangement.genre && <span className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">{viewingArrangement.genre}</span>}
                <span className={`text-sm px-3 py-1 rounded-full ${
                  viewingArrangement.status === 'finalizado' ? 'bg-green-100 text-green-700' :
                  viewingArrangement.status === 'em_progresso' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {viewingArrangement.status === 'finalizado' ? 'Finalizado' : viewingArrangement.status === 'em_progresso' ? 'Em Progresso' : 'Rascunho'}
                </span>
              </div>

              {viewingArrangement.instruments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Instrumentação</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingArrangement.instruments.map(inst => {
                      const instrument = INSTRUMENTS.find(i => i.id === inst);
                      return (
                        <span key={inst} className="text-sm bg-gray-50 text-gray-700 px-3 py-1 rounded-full border border-gray-200">
                          {instrument?.icon} {instrument?.label || inst}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewingArrangement.sections && viewingArrangement.sections.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Estrutura ({viewingArrangement.sections.reduce((a, s) => a + s.bars, 0)} compassos)</h4>
                  <div className="space-y-1">
                    {viewingArrangement.sections.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                        <span className="text-xs text-gray-400 w-5">{idx + 1}</span>
                        <span className="font-medium text-sm text-gray-800 w-28">{section.name}</span>
                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border">{section.bars} comp.</span>
                        {section.notes && <span className="text-xs text-gray-500 italic">{section.notes}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingArrangement.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Observações</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{viewingArrangement.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6">
              <button onClick={() => setViewingArrangement(null)} className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
