import React, { useState, useEffect } from 'react';
import { Plus, Search, List, Calendar, MapPin, Lock, Edit2, Eye } from 'lucide-react';
import { setlistService, Setlist } from '../../services/music/setlistService';
import { useOrganization } from '../organization/OrganizationContext';
import { SetlistBuilder } from './SetlistBuilder';

interface SetlistManagerProps {
  artistId: string;
}

export function SetlistManager({ artistId }: SetlistManagerProps) {
  const { currentOrganization } = useOrganization();
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    show_date: '',
    venue: ''
  });

  useEffect(() => {
    loadSetlists();
  }, [artistId]);

  const loadSetlists = async () => {
    try {
      setLoading(true);
      const data = await setlistService.getByArtist(artistId);
      setSetlists(data);
    } catch (error) {
      console.error('Error loading setlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrganization) {
      alert('Selecione uma organização');
      return;
    }

    try {
      await setlistService.create({
        artist_id: artistId,
        organization_id: currentOrganization.id,
        ...formData
      });

      setShowCreateForm(false);
      setFormData({ title: '', description: '', show_date: '', venue: '' });
      loadSetlists();
    } catch (error) {
      console.error('Error creating setlist:', error);
      alert('Erro ao criar setlist');
    }
  };

  const handleEditSetlist = (setlist: Setlist) => {
    setSelectedSetlist(setlist);
    setShowBuilder(true);
  };

  const getStatusColor = (status: string, locked: boolean) => {
    if (locked) return 'bg-red-100 text-red-800';
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string, locked: boolean) => {
    if (locked) return 'Travado';
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'review': return 'Em Revisão';
      case 'draft': return 'Rascunho';
      default: return status;
    }
  };

  const filteredSetlists = setlists.filter(setlist =>
    setlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    setlist.venue?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showBuilder && selectedSetlist) {
    return (
      <SetlistBuilder
        setlist={selectedSetlist}
        onUpdate={loadSetlists}
        onClose={() => {
          setShowBuilder(false);
          setSelectedSetlist(null);
        }}
      />
    );
  }

  if (showCreateForm) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Novo Setlist</h2>

          <form onSubmit={handleCreateSetlist} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Setlist *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                placeholder="Ex: Show Acústico - Teatro Municipal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                placeholder="Descreva o show ou evento..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Data do Show
                </label>
                <input
                  type="datetime-local"
                  value={formData.show_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_date: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Local
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Nome do local"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ title: '', description: '', show_date: '', venue: '' });
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
              >
                Criar Setlist
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar setlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            />
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Setlist
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFAD85] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando setlists...</p>
        </div>
      ) : filteredSetlists.length === 0 ? (
        <div className="text-center py-12">
          <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'Nenhum setlist encontrado' : 'Nenhum setlist cadastrado'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? 'Tente buscar com outros termos' : 'Comece criando seu primeiro setlist'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Setlist
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSetlists.map((setlist) => (
            <div
              key={setlist.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <List className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate">{setlist.title}</h3>
                    {setlist.description && (
                      <p className="text-sm text-gray-500 truncate">{setlist.description}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(setlist.status, setlist.locked)}`}>
                  {getStatusLabel(setlist.status, setlist.locked)}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                {setlist.show_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(setlist.show_date).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {setlist.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{setlist.venue}</span>
                  </div>
                )}
                {setlist.total_duration_minutes > 0 && (
                  <div className="flex items-center gap-2">
                    <span>Duração: {setlist.total_duration_minutes} min</span>
                  </div>
                )}
                {setlist.locked && setlist.locked_at && (
                  <div className="flex items-center gap-2 text-red-600">
                    <Lock className="w-4 h-4" />
                    <span>Travado em {new Date(setlist.locked_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEditSetlist(setlist)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#FFAD85] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  {setlist.locked ? 'Visualizar' : 'Editar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
