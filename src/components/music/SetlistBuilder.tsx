import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, GripVertical, Trash2, Music, Clock, Lock, Unlock, Download, Share2 } from 'lucide-react';
import { setlistService, Setlist, SetlistItem } from '../../services/music/setlistService';
import { songService, Song } from '../../services/music/songService';

interface SetlistBuilderProps {
  setlist: Setlist;
  onUpdate: () => void;
  onClose: () => void;
}

export function SetlistBuilder({ setlist, onUpdate, onClose }: SetlistBuilderProps) {
  const [items, setItems] = useState<SetlistItem[]>([]);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    loadData();
  }, [setlist]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, songsData] = await Promise.all([
        setlistService.getItems(setlist.id),
        songService.getByOrganization(setlist.organization_id)
      ]);

      setItems(itemsData);
      setAvailableSongs(songsData);
      calculateTotalDuration(itemsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalDuration = (currentItems: SetlistItem[]) => {
    const total = currentItems.reduce((sum, item) => sum + (item.estimated_duration_seconds || 0), 0);
    setTotalDuration(total);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || setlist.locked) return;

    const newItems = Array.from(items);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);

    const reorderedItems = newItems.map((item, index) => ({
      id: item.id,
      position: index + 1
    }));

    setItems(newItems);

    try {
      await setlistService.reorderItems(setlist.id, reorderedItems);
    } catch (error) {
      console.error('Error reordering items:', error);
      loadData();
    }
  };

  const handleAddSong = async (song: Song) => {
    if (setlist.locked) return;

    try {
      await setlistService.addItem({
        setlist_id: setlist.id,
        song_id: song.id,
        position: items.length + 1,
        estimated_duration_seconds: song.duration_seconds || 180
      });
      loadData();
    } catch (error) {
      console.error('Error adding song:', error);
      alert('Erro ao adicionar música');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (setlist.locked) return;
    if (!confirm('Remover esta música do setlist?')) return;

    try {
      await setlistService.removeItem(itemId);
      loadData();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Erro ao remover música');
    }
  };

  const handleLockSetlist = async () => {
    if (setlist.locked) {
      if (!confirm('Desbloquear este setlist permitirá edições. Tem certeza?')) return;
      try {
        await setlistService.unlock(setlist.id);
        onUpdate();
      } catch (error) {
        console.error('Error unlocking setlist:', error);
        alert('Erro ao desbloquear setlist');
      }
    } else {
      if (!confirm('Travar o setlist impedirá novas edições. Confirma?')) return;
      try {
        await setlistService.lock(setlist.id);
        onUpdate();
      } catch (error) {
        console.error('Error locking setlist:', error);
        alert('Erro ao travar setlist');
      }
    }
  };

  const filteredSongs = availableSongs.filter(song =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando setlist...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{setlist.title}</h2>
          <p className="text-gray-600">
            {setlist.show_date && new Date(setlist.show_date).toLocaleDateString('pt-BR')}
            {setlist.venue && ` • ${setlist.venue}`}
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Music className="w-4 h-4" />
              {items.length} músicas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {Math.floor(totalDuration / 60)} minutos
            </span>
            {setlist.locked && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <Lock className="w-4 h-4" />
                Travado
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLockSetlist}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              setlist.locked
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
          >
            {setlist.locked ? (
              <>
                <Unlock className="w-5 h-5" />
                Desbloquear
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Travar D-1
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setlist</h3>

            {items.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Nenhuma música no setlist</p>
                <p className="text-sm text-gray-500">Adicione músicas da biblioteca ao lado</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="setlist">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {items.map((item, index) => (
                        <Draggable
                          key={item.id}
                          draggableId={item.id}
                          index={index}
                          isDragDisabled={setlist.locked}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'border-gray-200'
                              } ${setlist.locked ? 'opacity-75' : ''}`}
                            >
                              {!setlist.locked && (
                                <div {...provided.dragHandleProps}>
                                  <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                                </div>
                              )}

                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-700">
                                {index + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {item.song_id}
                                </p>
                                {item.notes && (
                                  <p className="text-sm text-gray-500 truncate">{item.notes}</p>
                                )}
                              </div>

                              {item.estimated_duration_seconds && (
                                <span className="text-sm text-gray-600">
                                  {formatDuration(item.estimated_duration_seconds)}
                                </span>
                              )}

                              {!setlist.locked && (
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Biblioteca</h3>

            <input
              type="text"
              placeholder="Buscar músicas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={setlist.locked}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredSongs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {searchQuery ? 'Nenhuma música encontrada' : 'Nenhuma música disponível'}
                </p>
              ) : (
                filteredSongs.map((song) => (
                  <button
                    key={song.id}
                    onClick={() => handleAddSong(song)}
                    disabled={setlist.locked}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <p className="font-medium text-gray-900 text-sm truncate">{song.title}</p>
                    {song.artist_name && (
                      <p className="text-xs text-gray-500 truncate">{song.artist_name}</p>
                    )}
                    {song.duration_seconds && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDuration(song.duration_seconds)}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
