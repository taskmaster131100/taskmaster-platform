import React from 'react';
import { ArrowLeft, Music } from 'lucide-react';

interface ArtistDetailsProps {
  artistId: string;
  onBack: () => void;
  onSelectProject?: (id: string) => void;
  onCreateProject?: () => void;
}

const ArtistDetails: React.FC<ArtistDetailsProps> = ({ artistId, onBack }) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-3xl font-bold">
            <Music className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Detalhes do Artista</h2>
            <p className="text-gray-600">ID: {artistId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Informações</h3>
            <p className="text-gray-600 text-sm">Dados do artista serão exibidos aqui</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Projetos</h3>
            <p className="text-gray-600 text-sm">Projetos do artista serão listados aqui</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetails;
