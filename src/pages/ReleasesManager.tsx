import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Music, Search, Filter, X, Calendar, Upload, FileText, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import { useSubscription } from '../hooks/useSubscription';
import PlanLimitModal from '../components/PlanLimitModal';
import {
  Release,
  ReleasePhase,
  ReleaseAttachment,
  ReleaseType,
  ReleaseStatus,
  FileType,
  RELEASE_TYPES,
  RELEASE_STATUSES,
  createRelease,
  updateRelease,
  deleteRelease,
  listReleases,
  getReleaseById,
  listPhases,
  updatePhase,
  uploadAttachment,
  listAttachments,
  formatDate,
  getStatusColor
} from '../services/releaseService';

// Mapeamento de fases para o fluxo real de lançamento
const PHASE_TABS = [
  { id: 'all', label: 'Todos' },
  { id: 'pre_launch', label: 'Pré-Lançamento' },
  { id: 'launch', label: 'Em Lançamento' },
  { id: 'divulgacao', label: 'Divulgação' },
];

const PRE_LAUNCH_STATUSES: ReleaseStatus[] = ['pre_production', 'production', 'mixing', 'mastering'];
const LAUNCH_STATUSES: ReleaseStatus[] = ['distribution'];
const DIVULGACAO_STATUSES: ReleaseStatus[] = ['released'];

function getPhaseForRelease(status: ReleaseStatus): string {
  if (PRE_LAUNCH_STATUSES.includes(status)) return 'pre_launch';
  if (LAUNCH_STATUSES.includes(status)) return 'launch';
  if (DIVULGACAO_STATUSES.includes(status)) return 'divulgacao';
  return 'pre_launch';
}

export default function ReleasesManager() {
  const location = useLocation();
  const { organizationId } = useAuth();
  const { limits: planLimits } = useSubscription(organizationId || undefined);
  const [releases, setReleases] = useState<Release[]>([]);
  const [releaseLimitModal, setReleaseLimitModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [phases, setPhases] = useState<ReleasePhase[]>([]);
  const [attachments, setAttachments] = useState<ReleaseAttachment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseTab, setPhaseTab] = useState<string>('all');
  const [artistFilter, setArtistFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<ReleaseType | ''>('');
  const [uploading, setUploading] = useState(false);
  // Artista vindo da navegação — persiste para pré-preencher o form mesmo após resetForm
  const [navArtistName, setNavArtistName] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    artist_name: '',
    release_type: 'single' as ReleaseType,
    release_date: '',
    isrc: '',
    upc: '',
    distributor: '',
    status: 'pre_production' as ReleaseStatus,
    notes: ''
  });

  const [navArtistId, setNavArtistId] = useState<string | undefined>(undefined);

  // Pré-filtrar pelo artista se a navegação veio do contexto do artista
  useEffect(() => {
    const artistFromNav = (location.state as any)?.artist;
    if (artistFromNav?.name) {
      setNavArtistName(artistFromNav.name);
      setArtistFilter(artistFromNav.name);
      setFormData(prev => ({ ...prev, artist_name: artistFromNav.name }));
    }
    if (artistFromNav?.id) {
      setNavArtistId(artistFromNav.id);
    }
  }, []);

  useEffect(() => {
    loadReleases();
  }, [typeFilter, navArtistId]);

  const loadReleases = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (typeFilter) filters.type = typeFilter;
      if (navArtistId) filters.artist_id = navArtistId;
      else if (navArtistName) filters.artist = navArtistName;
      const data = await listReleases(filters);
      setReleases(data);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.release_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const releaseDate = new Date(formData.release_date + 'T00:00:00');
      if (releaseDate < today && !selectedRelease) {
        const confirmed = window.confirm(
          `A data de lançamento (${new Date(formData.release_date + 'T00:00:00').toLocaleDateString('pt-BR')}) é no passado.\n\nDeseja continuar mesmo assim?`
        );
        if (!confirmed) return;
      }
    }
    try {
      if (selectedRelease) {
        await updateRelease(selectedRelease.id, formData);
      } else {
        await createRelease(formData);
      }
      setShowModal(false);
      resetForm();
      loadReleases();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
    }
  };

  const handleEdit = (release: Release) => {
    setSelectedRelease(release);
    setFormData({
      title: release.title,
      artist_name: release.artist_name,
      release_type: release.release_type,
      release_date: release.release_date,
      isrc: release.isrc || '',
      upc: release.upc || '',
      distributor: release.distributor || '',
      status: release.status,
      notes: release.notes || ''
    });
    setShowModal(true);
  };

  const handleViewDetails = async (release: Release) => {
    try {
      setSelectedRelease(release);
      const [phasesData, attachmentsData] = await Promise.all([
        listPhases(release.id),
        listAttachments(release.id)
      ]);
      setPhases(phasesData);
      setAttachments(attachmentsData);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      try {
        await deleteRelease(id);
        loadReleases();
      } catch (error) {
        console.error('Erro ao excluir lançamento:', error);
      }
    }
  };

  const handlePhaseStatusChange = async (phaseId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      await updatePhase(phaseId, { status: newStatus });
      const updatedPhases = await listPhases(selectedRelease!.id);
      setPhases(updatedPhases);
    } catch (error) {
      console.error('Erro ao atualizar fase:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: FileType) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRelease) return;

    try {
      setUploading(true);
      await uploadAttachment(selectedRelease.id, file, fileType);
      const updatedAttachments = await listAttachments(selectedRelease.id);
      setAttachments(updatedAttachments);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      artist_name: navArtistName, // preserva artista do contexto de navegação
      release_type: 'single',
      release_date: '',
      isrc: '',
      upc: '',
      distributor: '',
      status: 'pre_production',
      notes: ''
    });
    setSelectedRelease(null);
  };

  const filteredReleases = releases.filter(release => {
    const matchesSearch = release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      release.artist_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = phaseTab === 'all' || getPhaseForRelease(release.status) === phaseTab;
    const matchesArtist = !artistFilter || release.artist_name.toLowerCase().includes(artistFilter.toLowerCase());
    return matchesSearch && matchesPhase && matchesArtist;
  });

  // Artistas únicos para o filtro
  const uniqueArtists = Array.from(new Set(releases.map(r => r.artist_name))).sort();

  const getStatusBadge = (status: ReleaseStatus) => {
    const statusInfo = RELEASE_STATUSES.find(s => s.value === status);
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      orange: 'bg-orange-100 text-orange-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo?.color as keyof typeof colorClasses]}`}>
        {statusInfo?.label}
      </span>
    );
  };

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Circle className="w-5 h-5 text-[#FFAD85] animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getWeeksUntilRelease = (releaseDate: string): number => {
    const now = new Date();
    const release = new Date(releaseDate);
    const diffTime = release.getTime() - now.getTime();
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAD85]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lançamentos Musicais</h1>
          <p className="text-gray-600 mt-1">Gerencie seus singles, EPs e álbuns</p>
        </div>
        <button
          onClick={() => {
            if (planLimits.maxReleases !== -1 && releases.length >= planLimits.maxReleases) {
              setReleaseLimitModal(true);
              return;
            }
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Lançamento
        </button>
      </div>

      {/* Tabs de fase */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
        {PHASE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setPhaseTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              phaseTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.id !== 'all' && (
              <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                {releases.filter(r => getPhaseForRelease(r.status) === tab.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chip de artista ativo (quando navegação veio de um artista) */}
      {artistFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">Filtrando por artista:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
            {artistFilter}
            <button
              onClick={() => setArtistFilter('')}
              className="ml-1 text-purple-500 hover:text-purple-800 transition-colors"
              aria-label="Limpar filtro de artista"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar lançamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
          />
        </div>

        <select
          value={uniqueArtists.includes(artistFilter) ? artistFilter : ''}
          onChange={(e) => setArtistFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
        >
          <option value="">Todos os Artistas</option>
          {uniqueArtists.map(artist => (
            <option key={artist} value={artist}>{artist}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ReleaseType | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
        >
          <option value="">Todos os Tipos</option>
          {RELEASE_TYPES.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {filteredReleases.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {artistFilter
              ? `Nenhum lançamento encontrado para "${artistFilter}"`
              : 'Nenhum lançamento encontrado'}
          </h3>
          <p className="text-gray-600 mb-4">
            {artistFilter
              ? 'Clique em "Novo Lançamento" para criar o primeiro lançamento deste artista.'
              : 'Crie seu primeiro lançamento para começar'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReleases.map(release => {
            const weeksUntil = getWeeksUntilRelease(release.release_date);
            return (
              <div
                key={release.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(release)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Music className="w-5 h-5 text-[#FFAD85]" />
                      <span className="text-sm text-gray-600">
                        {RELEASE_TYPES.find(t => t.value === release.release_type)?.label}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{release.title}</h3>
                    <p className="text-gray-600">{release.artist_name}</p>
                  </div>
                </div>

                <div className="mb-4">{getStatusBadge(release.status)}</div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(release.release_date)}</span>
                  </div>

                  {weeksUntil > 0 && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{weeksUntil} semanas restantes</span>
                    </div>
                  )}

                  {release.distributor && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{release.distributor}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(release);
                    }}
                    className="flex-1 px-3 py-2 text-sm text-[#FFAD85] hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(release.id);
                    }}
                    className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedRelease ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Lançamento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    placeholder="Ex: Meu Novo Single"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artista *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.artist_name}
                    onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    placeholder="Nome do artista"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formData.release_type}
                    onChange={(e) => setFormData({ ...formData, release_type: e.target.value as ReleaseType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  >
                    {RELEASE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Lançamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ReleaseStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  >
                    {RELEASE_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ISRC
                  </label>
                  <input
                    type="text"
                    value={formData.isrc}
                    onChange={(e) => setFormData({ ...formData, isrc: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    placeholder="BR-XXX-XX-XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UPC / EAN
                  </label>
                  <input
                    type="text"
                    value={formData.upc}
                    onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    placeholder="000000000000"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribuidora
                  </label>
                  <input
                    type="text"
                    value={formData.distributor}
                    onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    placeholder="Ex: CD Baby, DistroKid, ONErpm"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    placeholder="Anotações sobre o lançamento..."
                  />
                </div>
              </div>

              {!selectedRelease && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>🎯 Timeline automática:</strong> Ao criar o lançamento, serão geradas automaticamente 6 fases de produção (pré-produção até divulgação) com datas calculadas a partir da data de lançamento.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
                >
                  {selectedRelease ? 'Atualizar' : 'Criar'} Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && selectedRelease && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedRelease.title}</h2>
                <p className="text-gray-600">{selectedRelease.artist_name}</p>
                <div className="mt-2">{getStatusBadge(selectedRelease.status)}</div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRelease(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Data de Lançamento</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(selectedRelease.release_date)}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {getWeeksUntilRelease(selectedRelease.release_date) > 0
                      ? `${getWeeksUntilRelease(selectedRelease.release_date)} semanas restantes`
                      : 'Já lançado'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Tipo</p>
                  <p className="text-lg font-bold text-gray-900">
                    {RELEASE_TYPES.find(t => t.value === selectedRelease.release_type)?.label}
                  </p>
                </div>

                {selectedRelease.isrc && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">ISRC</p>
                    <p className="text-lg font-mono text-gray-900">{selectedRelease.isrc}</p>
                  </div>
                )}

                {selectedRelease.upc && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">UPC / EAN</p>
                    <p className="text-lg font-mono text-gray-900">{selectedRelease.upc}</p>
                  </div>
                )}

                {selectedRelease.distributor && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Distribuidora</p>
                    <p className="text-lg font-bold text-gray-900">{selectedRelease.distributor}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Timeline de Produção (12 semanas)
                </h3>
                <div className="space-y-3">
                  {phases.map((phase, index) => (
                    <div key={phase.id} className="relative">
                      {index < phases.length - 1 && (
                        <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      <div className="flex items-start gap-4 bg-gray-50 rounded-lg p-4">
                        <div className="flex-shrink-0 mt-0.5">
                          {getPhaseIcon(phase.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-gray-900">{phase.name}</h4>
                            <select
                              value={phase.status}
                              onChange={(e) => handlePhaseStatusChange(phase.id, e.target.value as any)}
                              className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#FFAD85]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">Pendente</option>
                              <option value="in_progress">Em Andamento</option>
                              <option value="completed">Concluída</option>
                            </select>
                          </div>
                          {phase.description && (
                            <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                          )}
                          {(phase.start_date || phase.end_date) && (
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {phase.start_date && <span>Início: {formatDate(phase.start_date)}</span>}
                              {phase.start_date && phase.end_date && <span>•</span>}
                              {phase.end_date && <span>Fim: {formatDate(phase.end_date)}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checklist de Materiais */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Checklist de Materiais
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  {[
                    { label: 'Áudio master finalizado', detail: 'WAV 24bit/44.1kHz ou superior', required: true },
                    { label: 'Capa do lançamento', detail: '3000x3000px JPG/PNG, sem texto de terceiros', required: true },
                    { label: 'ISRC registrado', detail: selectedRelease.isrc ? `✓ ${selectedRelease.isrc}` : 'Ainda não informado', required: true, done: !!selectedRelease.isrc },
                    { label: 'UPC / EAN', detail: selectedRelease.upc ? `✓ ${selectedRelease.upc}` : 'Ainda não informado', required: true, done: !!selectedRelease.upc },
                    { label: 'Distribuidora definida', detail: selectedRelease.distributor ? `✓ ${selectedRelease.distributor}` : 'Ainda não informada', required: true, done: !!selectedRelease.distributor },
                    { label: 'Press release / bio atualizada', detail: 'Texto para assessoria de imprensa e plataformas', required: false },
                    { label: 'Autorizações de imagem / participações', detail: 'Para clipes, features e colabs', required: false },
                    { label: 'Letras cadastradas (ECAD/distribuição)', detail: 'Para garantir royalties', required: false },
                    { label: 'Pré-save configurado', detail: 'Link de pré-save para campanha de lançamento', required: false },
                    { label: 'Pitch para playlists editoriais', detail: 'Enviar com 7+ dias de antecedência via distribuição', required: false },
                  ].map((item, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-2 rounded-lg ${item.done ? 'bg-green-50' : ''}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${item.done ? 'bg-green-500 border-green-500' : item.required ? 'border-orange-400' : 'border-gray-300'}`}>
                        {item.done && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${item.done ? 'text-green-800' : 'text-gray-900'}`}>
                          {item.label}
                          {item.required && !item.done && <span className="ml-1 text-xs text-orange-500 font-normal">obrigatório</span>}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Anexos
                </h3>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#FFAD85] transition-colors">
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-gray-600">Capa</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'cover')}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#FFAD85] transition-colors">
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-gray-600">Press Kit</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'press_kit')}
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#FFAD85] transition-colors">
                    <label className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-sm text-gray-600">Áudio</span>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'track')}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                {uploading && (
                  <p className="text-sm text-[#FFAD85] mb-4">Enviando arquivo...</p>
                )}

                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                            <p className="text-xs text-gray-600">
                              {attachment.file_type} • {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#FFAD85] hover:text-[#FF9B6A]"
                        >
                          Baixar
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-600 py-4">Nenhum anexo adicionado ainda</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {releaseLimitModal && (
        <PlanLimitModal
          resource="lançamentos"
          limit={planLimits.maxReleases}
          planName={planLimits.displayName || 'Plano atual'}
          onClose={() => setReleaseLimitModal(false)}
        />
      )}
    </div>
  );
}
