import React, { useState, useEffect } from 'react';
import { Music, Search, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface Artist {
  id: string;
  name: string;
  stage_name?: string;
  genre?: string;
  image_url?: string;
  [key: string]: any;
}

interface ArtistManagerProps {
  onSelectArtist?: (id: string) => void;
  onCreateArtist?: () => void;
  onSelectProject?: (id: string) => void;
}

const ArtistManager: React.FC<ArtistManagerProps> = ({
  onSelectArtist,
  onCreateArtist,
  onSelectProject
}) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadArtists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error('Erro ao carregar artistas:', error);
      toast.error('Erro ao carregar lista de artistas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();

    // Inscrever para mudanças em tempo real
    const channel = supabase
      .channel('artists_changes')
      .on('postgres_changes', { event: '*', table: 'artists', schema: 'public' }, () => {
        loadArtists();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredArtists = artists.filter(artist =>
    artist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.stage_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.genre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AA';
  };

  const genreColors: Record<string, string> = {
    'Pop': 'from-pink-500 to-purple-500',
    'Rock': 'from-red-500 to-orange-500',
    'Hip Hop': 'from-purple-500 to-indigo-500',
    'Eletrônica': 'from-cyan-500 to-blue-500',
    'MPB': 'from-green-500 to-teal-500',
    'Samba': 'from-yellow-500 to-orange-500',
    'Funk': 'from-purple-500 to-pink-500',
    'Sertanejo': 'from-orange-500 to-red-500'
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen pb-24 sm:pb-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Artistas</h2>
          <p className="text-gray-600 text-sm">{artists.length} talentos na sua organização</p>
        </div>
        <button
          onClick={onCreateArtist}
          className="hidden sm:flex px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl items-center gap-2 font-bold"
        >
          <Plus className="w-5 h-5" />
          Novo Artista
        </button>
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={onCreateArtist}
        className="sm:hidden fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar artistas por nome, nome artístico ou gênero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-sm">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
          <p className="text-gray-600">Carregando artistas...</p>
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum artista encontrado' : 'Nenhum artista cadastrado'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Tente buscar por outro termo' : 'Comece adicionando seu primeiro artista'}
          </p>
          {!searchTerm && onCreateArtist && (
            <button
              onClick={onCreateArtist}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              + Adicionar Artista
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map(artist => {
            const initials = getInitials(artist.name);
            const colorClass = genreColors[artist.genre || ''] || 'from-gray-500 to-gray-600';

            return (
              <div
                key={artist.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 cursor-pointer"
                onClick={() => onSelectArtist?.(artist.id)}
              >
                <div className="flex items-center gap-4 sm:block sm:text-center">
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-xl sm:text-2xl font-bold sm:mb-4 sm:mx-auto shrink-0 shadow-inner`}>
                    {initials}
                  </div>

                  <div className="flex-1 sm:text-center">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{artist.name}</h3>
                    {artist.stage_name && (
                      <p className="text-sm text-gray-600 line-clamp-1">"{artist.stage_name}"</p>
                    )}
                    {artist.genre && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {artist.genre}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  className="w-full mt-4 px-4 py-2 text-[#FFAD85] hover:bg-[#FFF8F3] rounded-lg transition-colors text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectArtist?.(artist.id);
                  }}
                >
                  Ver Detalhes
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArtistManager;
