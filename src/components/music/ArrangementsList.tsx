import React, { useState, useEffect } from 'react';
import { Plus, Search, Music, Upload, FileMusic, CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { songService, Song } from '../../services/music/songService';
import { arrangementService, Arrangement } from '../../services/music/arrangementService';
import { ArrangementEditor } from './ArrangementEditor';
import { ArrangementViewer } from './ArrangementViewer';

interface ArrangementsListProps {
  artistId: string;
  songs: Song[];
}

export function ArrangementsList({ artistId, songs }: ArrangementsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredSongs = songs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (selectedSong) {
      loadArrangements(selectedSong.id);
    }
  }, [selectedSong]);

  const loadArrangements = async (songId: string) => {
    try {
      setLoading(true);
      const data = await arrangementService.getArrangementsBySong(songId);
      setArrangements(data);
    } catch (error) {
      console.error('Error loading arrangements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setShowEditor(false);
    setShowViewer(false);
  };

  const handleCreateArrangement = () => {
    if (!selectedSong) return;
    setSelectedArrangement(null);
    setShowEditor(true);
  };

  const handleEditArrangement = (arrangement: Arrangement) => {
    setSelectedArrangement(arrangement);
    setShowEditor(true);
  };

  const handleViewArrangement = (arrangement: Arrangement) => {
    setSelectedArrangement(arrangement);
    setShowViewer(true);
  };

  const handleSaveComplete = () => {
    setShowEditor(false);
    setSelectedArrangement(null);
    if (selectedSong) {
      loadArrangements(selectedSong.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'review': return 'Em Revisão';
      case 'draft': return 'Rascunho';
      case 'rejected': return 'Rejeitado';
      case 'archived': return 'Arquivado';
      default: return status;
    }
  };

  if (showEditor && selectedSong) {
    return (
      <ArrangementEditor
        song={selectedSong}
        arrangement={selectedArrangement}
        onSave={handleSaveComplete}
        onCancel={() => {
          setShowEditor(false);
          setSelectedArrangement(null);
        }}
      />
    );
  }

  if (showViewer && selectedArrangement) {
    return (
      <ArrangementViewer
        arrangement={selectedArrangement}
        onClose={() => {
          setShowViewer(false);
          setSelectedArrangement(null);
        }}
        onEdit={() => {
          setShowViewer(false);
          setShowEditor(true);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      {!selectedSong ? (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Arranjos e Partes</h2>
            <p className="text-gray-600">Selecione uma música para gerenciar seus arranjos</p>
          </div>

          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar músicas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {filteredSongs.length === 0 ? (
            <div className="text-center py-12">
              <FileMusic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Nenhuma música encontrada' : 'Nenhuma música cadastrada'}
              </h3>
              <p className="text-gray-500">
                {searchQuery ? 'Tente buscar com outros termos' : 'Cadastre músicas no repertório primeiro'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSongs.map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleSelectSong(song)}
                  className="text-left border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Music className="w-5 h-5 text-gray-400" />
                    <h3 className="font-medium text-gray-900 truncate">{song.title}</h3>
                  </div>
                  {song.artist_name && (
                    <p className="text-sm text-gray-500 truncate mb-2">{song.artist_name}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    {song.original_key && <span>Tom: {song.original_key}</span>}
                    {song.bpm && <span>BPM: {song.bpm}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={() => setSelectedSong(null)}
                className="text-blue-600 hover:text-blue-700 text-sm mb-2"
              >
                ← Voltar para lista
              </button>
              <h2 className="text-xl font-semibold text-gray-900">{selectedSong.title}</h2>
              <p className="text-gray-600">
                {selectedSong.artist_name} • Tom: {selectedSong.original_key} • BPM: {selectedSong.bpm}
              </p>
            </div>
            <button
              onClick={handleCreateArrangement}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Arranjo
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando arranjos...</p>
            </div>
          ) : arrangements.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum arranjo cadastrado</h3>
              <p className="text-gray-500 mb-4">
                Comece adicionando o primeiro arranjo desta música
              </p>
              <button
                onClick={handleCreateArrangement}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Adicionar Primeiro Arranjo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {arrangements.map((arrangement) => (
                <div
                  key={arrangement.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{arrangement.title}</h3>
                        {arrangement.is_current && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            Atual
                          </span>
                        )}
                      </div>
                      {arrangement.description && (
                        <p className="text-sm text-gray-600 mb-2">{arrangement.description}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(arrangement.status)}`}>
                      {getStatusLabel(arrangement.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1">
                      <FileMusic className="w-4 h-4" />
                      Versão {arrangement.version}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(arrangement.created_at || '').toLocaleDateString('pt-BR')}
                    </span>
                    {arrangement.status === 'approved' && arrangement.approved_at && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        Aprovado em {new Date(arrangement.approved_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {arrangement.status === 'rejected' && (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle className="w-4 h-4" />
                        Rejeitado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleViewArrangement(arrangement)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Visualizar
                    </button>
                    <button
                      onClick={() => handleEditArrangement(arrangement)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
