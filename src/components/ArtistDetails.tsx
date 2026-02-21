import React, { useState, useEffect } from 'react';
import { ArrowLeft, Music, Loader2, Mail, Phone, Calendar, Globe, Instagram, Twitter, Youtube } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ArtistDetailsProps {
  artistId: string;
  onBack: () => void;
  onSelectProject?: (id: string) => void;
  onCreateProject?: () => void;
}

const ArtistDetails: React.FC<ArtistDetailsProps> = ({ artistId, onBack }) => {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtist = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .eq('id', artistId)
          .single();

        if (error) throw error;
        setArtist(data);
      } catch (error) {
        console.error('Erro ao carregar detalhes do artista:', error);
        toast.error('Erro ao carregar detalhes do artista');
      } finally {
        setLoading(false);
      }
    };

    if (artistId) {
      loadArtist();
    }
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Carregando detalhes do artista...</p>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Artista não encontrado</h2>
        <button onClick={onBack} className="text-purple-600 hover:underline">Voltar para a lista</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {artist.image_url ? (
                <img src={artist.image_url} alt={artist.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                artist.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-bold text-gray-900 mb-1">{artist.name}</h2>
              {artist.stage_name && (
                <p className="text-xl text-purple-600 font-medium mb-2">"{artist.stage_name}"</p>
              )}
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                {artist.genre && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-100">
                    {artist.genre}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  artist.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-700 border-gray-100'
                }`}>
                  {artist.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-400" />
                Contato e Redes
              </h3>
              <div className="space-y-4">
                {artist.contact_email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm truncate">{artist.contact_email}</span>
                  </div>
                )}
                {artist.contact_phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{artist.contact_phone}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-50 flex gap-4 justify-center">
                  <Instagram className="w-5 h-5 text-gray-400 hover:text-pink-600 cursor-pointer transition-colors" />
                  <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
                  <Youtube className="w-5 h-5 text-gray-400 hover:text-red-600 cursor-pointer transition-colors" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Contrato
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Início:</span>
                  <span className="text-gray-900 font-medium">{artist.contract_start_date || 'Não definida'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Término:</span>
                  <span className="text-gray-900 font-medium">{artist.contract_end_date || 'Não definido'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Comissão:</span>
                  <span className="text-gray-900 font-medium">{artist.commission_rate ? `${artist.commission_rate}%` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Biografia</h3>
              <p className="text-gray-600 leading-relaxed">
                {artist.bio || 'Nenhuma biografia cadastrada para este artista.'}
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Projetos e Planejamentos</h3>
                <button className="text-sm text-purple-600 font-bold hover:underline">Ver todos</button>
              </div>
              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-500 text-sm">Nenhum projeto vinculado no momento.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetails;
