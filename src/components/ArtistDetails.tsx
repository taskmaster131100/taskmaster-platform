import React, { useState, useEffect } from 'react';
import { ArrowLeft, Music, Loader2, Mail, Phone, Calendar, Globe, Instagram, Twitter, Youtube, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ArtistDetailsProps {
  artistId: string;
  onBack: () => void;
  onSelectProject?: (id: string) => void;
  onCreateProject?: () => void;
}

const GENRES = [
  'Pop', 'Rock', 'Hip Hop', 'MPB', 'Sertanejo', 'Samba', 'Pagode', 'Funk',
  'Eletrônica', 'Jazz', 'Blues', 'Reggae', 'Country', 'Gospel', 'Forró',
  'Bossa Nova', 'Rap', 'Trap', 'R&B', 'Soul', 'Indie', 'Metal', 'Punk',
  'Folk', 'Clássica', 'Outro'
];

const ArtistDetails: React.FC<ArtistDetailsProps> = ({ artistId, onBack }) => {
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<any>({});

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
        populateEditData(data);
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

  const populateEditData = (data: any) => {
    setEditData({
      name: data.name || '',
      stage_name: data.stage_name || '',
      genre: data.genre || '',
      bio: data.bio || '',
      contact_email: data.contact_email || '',
      contact_phone: data.contact_phone || '',
      commission_rate: data.commission_rate ?? '',
      contract_start_date: data.contract_start_date || '',
      contract_end_date: data.contract_end_date || '',
      status: data.status || 'active',
    });
  };

  const handleSave = async () => {
    if (!editData.name?.trim()) {
      toast.error('O nome do artista é obrigatório');
      return;
    }
    if (editData.commission_rate !== '' && (Number(editData.commission_rate) < 0 || Number(editData.commission_rate) > 100)) {
      toast.error('A comissão deve ser entre 0% e 100%');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editData,
        commission_rate: editData.commission_rate === '' ? null : Number(editData.commission_rate),
      };
      const { error } = await supabase
        .from('artists')
        .update(payload)
        .eq('id', artistId);
      if (error) throw error;
      setArtist({ ...artist, ...payload });
      setIsEditing(false);
      toast.success('Artista atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    populateEditData(artist);
    setIsEditing(false);
  };

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
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg flex-shrink-0">
              {artist.image_url ? (
                <img src={artist.image_url} alt={artist.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                (artist.stage_name || artist.name)?.charAt(0)?.toUpperCase()
              )}
            </div>
            <div className="text-center md:text-left flex-1 w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nome Completo *</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg font-bold"
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Nome Artístico</label>
                    <input
                      type="text"
                      value={editData.stage_name}
                      onChange={(e) => setEditData({ ...editData, stage_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Nome artístico"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Gênero</label>
                      <select
                        value={editData.genre}
                        onChange={(e) => setEditData({ ...editData, genre: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Selecionar gênero</option>
                        {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Status</label>
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
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
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Email</label>
                    <input
                      type="email"
                      value={editData.contact_email}
                      onChange={(e) => setEditData({ ...editData, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Telefone</label>
                    <input
                      type="tel"
                      value={editData.contact_phone}
                      onChange={(e) => setEditData({ ...editData, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {artist.contact_email ? (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{artist.contact_email}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Sem email cadastrado</p>
                  )}
                  {artist.contact_phone && (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">{artist.contact_phone}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-50 flex gap-4 justify-center">
                    <Instagram className="w-5 h-5 text-gray-400 hover:text-pink-600 cursor-pointer transition-colors" />
                    <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-400 cursor-pointer transition-colors" />
                    <Youtube className="w-5 h-5 text-gray-400 hover:text-red-600 cursor-pointer transition-colors" />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                Contrato
              </h3>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Comissão (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editData.commission_rate}
                      onChange={(e) => setEditData({ ...editData, commission_rate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                      placeholder="Ex: 20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Início do Contrato</label>
                    <input
                      type="date"
                      value={editData.contract_start_date}
                      onChange={(e) => setEditData({ ...editData, contract_start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Término do Contrato</label>
                    <input
                      type="date"
                      value={editData.contract_end_date}
                      onChange={(e) => setEditData({ ...editData, contract_end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                  </div>
                </div>
              ) : (
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
                    <span className="text-gray-900 font-medium">{artist.commission_rate != null ? `${artist.commission_rate}%` : 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Biografia</h3>
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="Escreva uma breve biografia do artista..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed">
                  {artist.bio || 'Nenhuma biografia cadastrada para este artista.'}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Projetos e Planejamentos</h3>
                <button className="text-sm text-purple-600 font-bold hover:underline">Ver todos</button>
              </div>
              <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                <Music className="w-8 h-8 text-gray-300 mx-auto mb-2" />
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
