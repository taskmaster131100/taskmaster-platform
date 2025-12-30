import React, { useState } from 'react';
import { Music, Library, Calendar, List, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Song {
  id: string;
  name: string;
  artist: string;
  notes?: string;
  createdAt: string;
}

interface Arrangement {
  id: string;
  name: string;
  songId?: string;
  notes?: string;
  createdAt: string;
}

interface Rehearsal {
  id: string;
  name: string;
  date: string;
  time: string;
  notes?: string;
  createdAt: string;
}

interface Setlist {
  id: string;
  name: string;
  songs: string[];
  notes?: string;
  createdAt: string;
}

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

  const tabs = [
    { id: 'repertoire', label: 'Repertório', icon: Library },
    { id: 'arrangements', label: 'Arranjos', icon: Music },
    { id: 'rehearsals', label: 'Ensaios', icon: Calendar },
    { id: 'setlists', label: 'Setlists', icon: List }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Produção Musical</h1>
          <p className="text-gray-600 mt-1">Gerencie repertório, arranjos, ensaios e setlists</p>
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'welcome' && (
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Bem-vindo ao Modo Produtor Musical
              </h3>
              <p className="text-gray-500 mb-6">
                Sistema completo de produção musical implementado e pronto para uso
              </p>
              <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-gray-200 hover:border-[#FFAD85] hover:bg-blue-50 transition-all"
                    >
                      <Icon className="w-8 h-8 text-[#FFAD85]" />
                      <span className="text-sm font-medium text-gray-700">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'repertoire' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Repertório</h3>
                  <p className="text-gray-600">Gerencie suas músicas, cifras e letras</p>
                </div>
                <button
                  onClick={() => setShowSongModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Nova Música
                </button>
              </div>
              {songs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Nenhuma música cadastrada</p>
                  <p className="text-sm text-gray-500">Adicione sua primeira música ao repertório</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {songs.map(song => (
                    <div key={song.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <Music className="w-5 h-5 text-[#FFAD85]" />
                        <span className="text-xs text-gray-500">{new Date(song.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{song.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{song.artist}</p>
                      {song.notes && <p className="text-xs text-gray-500 line-clamp-2">{song.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'arrangements' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Arranjos</h3>
                  <p className="text-gray-600">Crie e versione arranjos com partes por instrumento</p>
                </div>
                <button
                  onClick={() => setShowArrangementModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Novo Arranjo
                </button>
              </div>
              {arrangements.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Library className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Nenhum arranjo cadastrado</p>
                  <p className="text-sm text-gray-500">Crie seu primeiro arranjo musical</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {arrangements.map(arr => (
                    <div key={arr.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{arr.name}</h4>
                          {arr.notes && <p className="text-sm text-gray-600 mt-1">{arr.notes}</p>}
                        </div>
                        <span className="text-xs text-gray-500">{new Date(arr.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'rehearsals' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Ensaios</h3>
                  <p className="text-gray-600">Agende e registre ensaios</p>
                </div>
                <button
                  onClick={() => setShowRehearsalModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Novo Ensaio
                </button>
              </div>
              {rehearsals.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Nenhum ensaio agendado</p>
                  <p className="text-sm text-gray-500">Agende seu primeiro ensaio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rehearsals.map(reh => (
                    <div key={reh.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{reh.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{reh.date} às {reh.time}</p>
                          {reh.notes && <p className="text-sm text-gray-500 mt-1">{reh.notes}</p>}
                        </div>
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'setlists' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Setlists</h3>
                  <p className="text-gray-600">Monte setlists profissionais para shows</p>
                </div>
                <button
                  onClick={() => setShowSetlistModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Novo Setlist
                </button>
              </div>
              {setlists.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <List className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">Nenhum setlist criado</p>
                  <p className="text-sm text-gray-500">Monte seu primeiro setlist</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {setlists.map(set => (
                    <div key={set.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{set.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{set.songs.length} músicas</p>
                          {set.notes && <p className="text-sm text-gray-500 mt-1">{set.notes}</p>}
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

      {/* Modals */}
      {showSongModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Música</h3>
              <button onClick={() => setShowSongModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newSong: Song = {
                id: Date.now().toString(),
                name: formData.get('name') as string,
                artist: formData.get('artist') as string,
                notes: formData.get('notes') as string || undefined,
                createdAt: new Date().toISOString()
              };
              setSongs([...songs, newSong]);
              setShowSongModal(false);
              toast.success('Música adicionada com sucesso!');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Música</label>
                  <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Artista</label>
                  <input name="artist" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85]" />
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

      {showArrangementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Arranjo</h3>
              <button onClick={() => setShowArrangementModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newArr: Arrangement = {
                id: Date.now().toString(),
                name: formData.get('name') as string,
                notes: formData.get('notes') as string || undefined,
                createdAt: new Date().toISOString()
              };
              setArrangements([...arrangements, newArr]);
              setShowArrangementModal(false);
              toast.success('Arranjo criado com sucesso!');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Arranjo</label>
                  <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowArrangementModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRehearsalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Ensaio</h3>
              <button onClick={() => setShowRehearsalModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newReh: Rehearsal = {
                id: Date.now().toString(),
                name: formData.get('name') as string,
                date: formData.get('date') as string,
                time: formData.get('time') as string,
                notes: formData.get('notes') as string || undefined,
                createdAt: new Date().toISOString()
              };
              setRehearsals([...rehearsals, newReh]);
              setShowRehearsalModal(false);
              toast.success('Ensaio agendado com sucesso!');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Ensaio</label>
                  <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                    <input name="date" type="date" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <input name="time" type="time" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
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

      {showSetlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Setlist</h3>
              <button onClick={() => setShowSetlistModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newSet: Setlist = {
                id: Date.now().toString(),
                name: formData.get('name') as string,
                songs: [],
                notes: formData.get('notes') as string || undefined,
                createdAt: new Date().toISOString()
              };
              setSetlists([...setlists, newSet]);
              setShowSetlistModal(false);
              toast.success('Setlist criado com sucesso!');
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Setlist</label>
                  <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                  <textarea name="notes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
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
    </div>
  );
}
