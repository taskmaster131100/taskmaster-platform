import React, { useState, useEffect } from 'react';
import { Music, Search, Plus } from 'lucide-react';
import { localDatabase } from '../services/localDatabase';

interface Artist {
  id: string;
  name: string;
  artisticName?: string;
  genre?: string;
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
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedArtists = localDatabase.getCollection<Artist>('artists');
    setArtists(Array.isArray(storedArtists) ? storedArtists : []);
  }, []);

  const filteredArtists = artists.filter(artist =>
    artist.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.artisticName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Artistas</h2>
          <p className="text-gray-600">{artists.length} artistas cadastrados</p>
        </div>
        <button
          onClick={onCreateArtist}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
        >
          + Novo Artista
        </button>
      </div>

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

      {filteredArtists.length === 0 ? (
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
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto`}>
                  {initials}
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">{artist.name}</h3>
                  {artist.artisticName && (
                    <p className="text-sm text-gray-600">"{artist.artisticName}"</p>
                  )}
                  {artist.genre && (
                    <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {artist.genre}
                    </span>
                  )}
                </div>

                <button
                  className="w-full mt-4 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
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
