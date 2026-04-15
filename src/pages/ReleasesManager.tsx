import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Music, Search, X, Calendar, Upload, FileText, Clock, CheckCircle2, Circle, Sparkles, AlertTriangle, ArrowLeft, CheckCheck, ChevronDown, ChevronUp, ArrowRight, Zap, Link2 } from 'lucide-react';
import { useAuth } from '../components/auth/AuthProvider';
import { useSubscription } from '../hooks/useSubscription';
import PlanLimitModal from '../components/PlanLimitModal';
import {
  generateReleaseProposal,
  saveReleaseWithTasks,
  getMinReleaseDateFor,
  ReleaseTimelineProposal,
  AIReleaseTask,
} from '../services/releaseAIService';
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

// Guia contextual por nome de fase
const PHASE_GUIDE: Record<string, { action: string; tips: string[] }> = {
  'Pré-Produção': {
    action: 'Grave e finalize o material musical',
    tips: ['Grave os vocais e instrumentos definitivos', 'Contrate produtor ou arranjador se necessário', 'Defina músicos e participações especiais'],
  },
  'Produção': {
    action: 'Finalize a produção e arrange as faixas',
    tips: ['Conclua a gravação de todos os instrumentos', 'Finalize arranjos e produção eletrônica', 'Entregue ao mixador no prazo'],
  },
  'Mixagem': {
    action: 'Entregue os arquivos para mixagem',
    tips: ['Exporte stems organizados (vocais, bases, FX)', 'Alinha referências sonoras com o engenheiro', 'Aprove mix, solicite ajustes se necessário'],
  },
  'Masterização': {
    action: 'Envie o mix aprovado para masterização',
    tips: ['Entregue o arquivo WAV final do mix', 'Defina loudness alvo (streaming: -14 LUFS)', 'Verifique o master em múltiplos dispositivos'],
  },
  'Distribuição': {
    action: 'Envie o lançamento para a distribuidora',
    tips: ['Upload do master (WAV 24bit/44.1kHz)', 'Capa 3000x3000px aprovada', 'Preencha metadados: ISRC, compositores, gênero', 'Faça pitch de playlists editoriais (7+ dias antes)'],
  },
  'Divulgação': {
    action: 'Execute a campanha de lançamento',
    tips: ['Ative pré-save com pelo menos 2 semanas de antecedência', 'Envie press release para veículos e blogs', 'Grave conteúdo para redes: making of, teaser, Reels', 'Agende posts para o dia e semana do lançamento'],
  },
  'Pós-Lançamento': {
    action: 'Monitore performance e consolide resultado',
    tips: ['Acompanhe streams nas primeiras 48h', 'Responda comentários e interaja com fãs', 'Documente métricas: streams, saves, plays', 'Planeje o próximo lançamento com os aprendizados'],
  },
};

const getPhaseGuide = (phaseName: string) => {
  const direct = PHASE_GUIDE[phaseName];
  if (direct) return direct;
  for (const key of Object.keys(PHASE_GUIDE)) {
    if (phaseName.toLowerCase().includes(key.toLowerCase())) return PHASE_GUIDE[key];
  }
  return { action: `Conclua as atividades de ${phaseName}`, tips: [] };
};

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
  const navigate = useNavigate();
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
  // AI-guided creation flow
  const [modalStep, setModalStep] = useState<'form' | 'proposal'>('form');
  const [proposal, setProposal] = useState<ReleaseTimelineProposal | null>(null);
  const [savingRelease, setSavingRelease] = useState(false);
  const [adjustingDate, setAdjustingDate] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
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
    notes: '',
    presave_link: '',
    playlist_pitch_status: 'not_sent' as import('../services/releaseService').PlaylistPitchStatus,
    budget: '' as string | number,
    cover_art_status: 'pending' as 'pending' | 'ready' | 'approved',
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

  // Auto-focus date field when returning from proposal to adjust date
  useEffect(() => {
    if (adjustingDate && modalStep === 'form') {
      const timer = setTimeout(() => {
        dateInputRef.current?.focus();
        setAdjustingDate(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [adjustingDate, modalStep]);

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

  // Normaliza budget de string para number antes de enviar ao service
  const normalizedFormData = () => ({
    ...formData,
    budget: formData.budget !== '' ? Number(formData.budget) : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Edit mode: save directly (no AI flow for edits)
    if (selectedRelease) {
      try {
        await updateRelease(selectedRelease.id, normalizedFormData());
        setShowModal(false);
        resetForm();
        loadReleases();
      } catch (error) {
        console.error('Erro ao atualizar lançamento:', error);
      }
      return;
    }

    // New release: compute AI proposal and show proposal step
    const computed = generateReleaseProposal(formData.release_type, formData.release_date || null);
    setProposal(computed);
    setModalStep('proposal');
  };

  const handleConfirmWithTimeline = async () => {
    if (!proposal || !proposal.viable) return;
    setSavingRelease(true);
    try {
      const newRelease = await createRelease(normalizedFormData());
      await saveReleaseWithTasks(newRelease.id, proposal.tasks);
      setShowModal(false);
      setModalStep('form');
      setProposal(null);
      resetForm();
      loadReleases();
    } catch (error) {
      console.error('Erro ao criar lançamento com cronograma:', error);
    } finally {
      setSavingRelease(false);
    }
  };

  // Adjustment 2: button text is "Criar apenas o lançamento"
  const handleConfirmWithoutTimeline = async () => {
    setSavingRelease(true);
    try {
      await createRelease(normalizedFormData());
      setShowModal(false);
      setModalStep('form');
      setProposal(null);
      resetForm();
      loadReleases();
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
    } finally {
      setSavingRelease(false);
    }
  };

  // Adjustment 3: "Ajustar data" — go back to form, preserve all fields, auto-focus date
  const handleAdjustDate = () => {
    setModalStep('form');
    setAdjustingDate(true);
    setProposal(null);
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
      notes: release.notes || '',
      presave_link: release.presave_link || '',
      playlist_pitch_status: release.playlist_pitch_status || 'not_sent',
      budget: release.budget ?? '',
      cover_art_status: release.cover_art_status || 'pending',
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

  const handleAdvancePhase = async (phase: ReleasePhase, nextPhase?: ReleasePhase) => {
    try {
      await updatePhase(phase.id, { status: 'completed' });
      if (nextPhase && nextPhase.status === 'pending') {
        await updatePhase(nextPhase.id, { status: 'in_progress' });
      }
      const updatedPhases = await listPhases(selectedRelease!.id);
      setPhases(updatedPhases);
    } catch (error) {
      console.error('Erro ao avançar fase:', error);
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
      notes: '',
      presave_link: '',
      playlist_pitch_status: 'not_sent',
      budget: '',
      cover_art_status: 'pending',
    });
    setSelectedRelease(null);
    setModalStep('form');
    setProposal(null);
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
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {modalStep === 'proposal' && !selectedRelease && (
                  <Sparkles className="w-6 h-6 text-[#FFAD85]" />
                )}
                {selectedRelease
                  ? 'Editar Lançamento'
                  : modalStep === 'proposal'
                    ? 'Cronograma do Lançamento'
                    : 'Novo Lançamento'}
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

            {/* Step 1: Form */}
            {modalStep === 'form' && (
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
                      ref={dateInputRef}
                      type="date"
                      required
                      value={formData.release_date}
                      onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    />
                    {adjustingDate && formData.release_date && (
                      <p className="mt-1 text-xs text-amber-600">
                        Data mínima recomendada: {new Date(getMinReleaseDateFor(formData.release_type) + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
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

                  {/* ── Campos Operacionais ─────────────────────────────── */}
                  <div className="col-span-2 pt-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Operacional</p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link do Pré-Save
                    </label>
                    <input
                      type="url"
                      value={formData.presave_link}
                      onChange={(e) => setFormData({ ...formData, presave_link: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      placeholder="https://presave.io/..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pitch de Playlists
                    </label>
                    <select
                      value={formData.playlist_pitch_status}
                      onChange={(e) => setFormData({ ...formData, playlist_pitch_status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    >
                      <option value="not_sent">Não enviado</option>
                      <option value="sent">Enviado</option>
                      <option value="in_analysis">Em análise</option>
                      <option value="approved">Aprovado ✓</option>
                      <option value="rejected">Rejeitado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arte da Capa
                    </label>
                    <select
                      value={formData.cover_art_status}
                      onChange={(e) => setFormData({ ...formData, cover_art_status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                    >
                      <option value="pending">Pendente</option>
                      <option value="ready">Pronta</option>
                      <option value="approved">Aprovada ✓</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Orçamento (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                {!selectedRelease && (
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#FFAD85] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      <strong>Cronograma inteligente:</strong> Na próxima etapa, vamos calcular automaticamente as tarefas e datas do seu lançamento com base na data escolhida.
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
                    {selectedRelease ? 'Atualizar Lançamento' : 'Continuar →'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: AI Proposal */}
            {modalStep === 'proposal' && proposal && (
              <div className="p-6">
                {/* Viable: show timeline */}
                {proposal.viable && (
                  <>
                    <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
                      <CheckCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          Cronograma viável — {proposal.tasks.length} tarefas em {proposal.daysUntilRelease} dias
                        </p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Data de lançamento: {new Date(formData.release_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Tasks grouped by area */}
                    {(['Lançamento', 'Marketing'] as const).map(area => {
                      const areaTasks = proposal.tasks.filter(t => t.area === area);
                      if (areaTasks.length === 0) return null;
                      return (
                        <div key={area} className="mb-5">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{area}</h3>
                          <div className="space-y-2">
                            {areaTasks.map((task, i) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${task.priority === 'alta' ? 'bg-orange-400' : 'bg-gray-300'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">{task.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                  <p className="text-xs font-medium text-gray-700">
                                    {new Date(task.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                  </p>
                                  {task.priority === 'alta' && (
                                    <span className="text-xs text-orange-500 font-medium">alta</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        onClick={handleConfirmWithTimeline}
                        disabled={savingRelease}
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
                      >
                        {savingRelease ? 'Criando...' : 'Confirmar e criar lançamento com cronograma'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAdjustDate}
                          disabled={savingRelease}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center justify-center gap-1.5"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Ajustar data
                        </button>
                        <button
                          onClick={handleConfirmWithoutTimeline}
                          disabled={savingRelease}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                        >
                          Criar apenas o lançamento
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Inviable: show reason + options */}
                {!proposal.viable && proposal.inviableReason !== 'no_date' && (
                  <>
                    <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">
                          {proposal.inviableReason === 'below_minimum'
                            ? `Data muito próxima para um ${RELEASE_TYPES.find(t => t.value === formData.release_type)?.label ?? formData.release_type}`
                            : 'Tarefas críticas já estariam no passado'}
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {proposal.inviableReason === 'below_minimum'
                            ? `Este tipo de lançamento requer pelo menos ${proposal.minDaysRequired} dias de antecedência. Você tem ${proposal.daysUntilRelease} dias.`
                            : `Com essa data, algumas tarefas obrigatórias (envio ao distribuidor, pitch editorial) já estariam no passado.`}
                        </p>
                        <p className="text-xs text-amber-700 mt-1 font-medium">
                          Data mínima recomendada: {new Date(getMinReleaseDateFor(formData.release_type) + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleAdjustDate}
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Ajustar data de lançamento
                      </button>
                      <button
                        onClick={handleConfirmWithoutTimeline}
                        disabled={savingRelease}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
                      >
                        {savingRelease ? 'Criando...' : 'Criar apenas o lançamento'}
                      </button>
                      <button
                        onClick={() => { setShowModal(false); resetForm(); }}
                        className="w-full px-4 py-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showDetailsModal && selectedRelease && (() => {
        const doneCount = phases.filter(p => p.status === 'completed').length;
        const totalPhases = phases.length;
        const progressPct = totalPhases > 0 ? Math.round((doneCount / totalPhases) * 100) : 0;
        const currentPhaseIdx = phases.findIndex(p => p.status !== 'completed');
        const currentPhase = currentPhaseIdx >= 0 ? phases[currentPhaseIdx] : null;
        const nextPhase = currentPhaseIdx >= 0 ? phases[currentPhaseIdx + 1] : null;
        const currentGuide = currentPhase ? getPhaseGuide(currentPhase.name) : null;
        const weeksLeft = getWeeksUntilRelease(selectedRelease.release_date);

        return (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl my-8">

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {getStatusBadge(selectedRelease.status)}
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">
                    {RELEASE_TYPES.find(t => t.value === selectedRelease.release_type)?.label}
                  </span>
                  {selectedRelease.distributor && (
                    <>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{selectedRelease.distributor}</span>
                    </>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 truncate">{selectedRelease.title}</h2>
                <p className="text-sm text-gray-500">{selectedRelease.artist_name}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">{formatDate(selectedRelease.release_date)}</p>
                  <p className={`text-xs font-bold ${weeksLeft > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                    {weeksLeft > 0 ? `${weeksLeft} sem. restantes` : 'Lançado'}
                  </p>
                </div>
                <button onClick={() => { setShowDetailsModal(false); setSelectedRelease(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {totalPhases > 0 && (
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span className="font-medium">{doneCount}/{totalPhases} fases concluídas</span>
                  <span className="font-bold text-gray-700">{progressPct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%`, background: progressPct === 100 ? '#22c55e' : '#FFAD85' }}
                  />
                </div>
              </div>
            )}

            <div className="px-6 pb-6 space-y-5 pt-4">

              {/* "Você está aqui" — O que fazer agora */}
              {currentPhase && currentGuide && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-orange-100/60 border-b border-orange-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Você está aqui · {currentPhase.name}</span>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-sm font-bold text-gray-900 mb-2">{currentGuide.action}</p>
                    {currentGuide.tips.length > 0 && (
                      <ul className="space-y-1">
                        {currentGuide.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                            <span className="text-orange-400 mt-0.5 flex-shrink-0">→</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {currentPhase.end_date && (
                      <p className="text-xs text-gray-400 mt-2">Prazo desta fase: {formatDate(currentPhase.end_date)}</p>
                    )}
                    <button
                      onClick={() => handleAdvancePhase(currentPhase, nextPhase || undefined)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white bg-[#FFAD85] hover:bg-[#FF9B6A] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Marcar fase como concluída
                      {nextPhase && <><span className="mx-1 opacity-60">·</span>ir para {nextPhase.name}</>}
                    </button>
                  </div>
                </div>
              )}

              {!currentPhase && totalPhases > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-green-800">Todas as fases concluídas! Lançamento finalizado.</p>
                </div>
              )}

              {/* Timeline de fases */}
              {totalPhases > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Cronograma completo
                  </h3>
                  <div className="space-y-2">
                    {phases.map((phase, index) => {
                      const isCurrent = index === currentPhaseIdx;
                      const isDone = phase.status === 'completed';
                      const isFuture = !isDone && !isCurrent;
                      return (
                        <div
                          key={phase.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                            isCurrent ? 'border-orange-200 bg-orange-50/50' :
                            isDone ? 'border-green-100 bg-green-50/30' :
                            'border-gray-100 bg-white'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 ${
                            isDone ? 'bg-green-500 text-white' :
                            isCurrent ? 'bg-[#FFAD85] text-white' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {isDone ? '✓' : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm font-semibold truncate ${isDone ? 'text-gray-400 line-through' : isCurrent ? 'text-gray-900' : 'text-gray-500'}`}>
                                {phase.name}
                                {isCurrent && <span className="ml-2 text-[10px] bg-orange-200 text-orange-700 px-1.5 py-0.5 rounded-full font-bold" style={{textDecoration:'none'}}>ATUAL</span>}
                              </p>
                              {(phase.start_date || phase.end_date) && (
                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                  {phase.end_date ? formatDate(phase.end_date) : formatDate(phase.start_date!)}
                                </span>
                              )}
                            </div>
                            {phase.description && !isDone && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{phase.description}</p>
                            )}
                          </div>
                          {isCurrent && (
                            <button onClick={() => handlePhaseStatusChange(phase.id, 'completed')} className="flex-shrink-0 text-[10px] font-bold text-green-600 hover:text-green-800 border border-green-200 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors">
                              ✓ Concluir
                            </button>
                          )}
                          {isDone && (
                            <button onClick={() => handlePhaseStatusChange(phase.id, 'in_progress')} className="flex-shrink-0 text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                              Desfazer
                            </button>
                          )}
                          {isFuture && (
                            <button onClick={() => handlePhaseStatusChange(phase.id, 'in_progress')} className="flex-shrink-0 text-[10px] text-indigo-500 hover:text-indigo-700 border border-indigo-100 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors">
                              Iniciar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {totalPhases === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                  <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Nenhum cronograma gerado</p>
                  <p className="text-xs text-gray-400">Edite o lançamento para gerar um cronograma com IA</p>
                </div>
              )}

              {/* Info cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Data de Lançamento</p>
                  <p className="text-sm font-bold text-gray-900">{formatDate(selectedRelease.release_date)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Tipo</p>
                  <p className="text-sm font-bold text-gray-900">{RELEASE_TYPES.find(t => t.value === selectedRelease.release_type)?.label}</p>
                </div>
                {selectedRelease.isrc && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">ISRC</p>
                    <p className="text-sm font-mono text-gray-900">{selectedRelease.isrc}</p>
                  </div>
                )}
                {selectedRelease.upc && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">UPC / EAN</p>
                    <p className="text-sm font-mono text-gray-900">{selectedRelease.upc}</p>
                  </div>
                )}
                {selectedRelease.distributor && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Distribuidora</p>
                    <p className="text-sm font-bold text-gray-900">{selectedRelease.distributor}</p>
                  </div>
                )}
              </div>

              {/* Painéis operacionais adicionais */}
              {(selectedRelease.presave_link || selectedRelease.budget || selectedRelease.playlist_pitch_status !== 'not_sent') && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedRelease.presave_link && (
                    <div className="col-span-2 bg-blue-50 rounded-xl p-3 flex items-center gap-3">
                      <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-blue-600 font-bold">Pré-Save</p>
                        <a href={selectedRelease.presave_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-800 truncate block hover:underline">
                          {selectedRelease.presave_link}
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedRelease.budget !== undefined && selectedRelease.budget > 0 && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">Orçamento</p>
                      <p className="text-sm font-bold text-gray-900">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRelease.budget)}
                      </p>
                    </div>
                  )}
                  {selectedRelease.playlist_pitch_status && selectedRelease.playlist_pitch_status !== 'not_sent' && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">Pitch de Playlists</p>
                      <p className={`text-sm font-bold ${selectedRelease.playlist_pitch_status === 'approved' ? 'text-green-600' : selectedRelease.playlist_pitch_status === 'rejected' ? 'text-red-500' : 'text-orange-500'}`}>
                        {{ not_sent: '—', sent: 'Enviado', in_analysis: 'Em análise', approved: 'Aprovado ✓', rejected: 'Rejeitado' }[selectedRelease.playlist_pitch_status]}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Checklist */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Checklist de materiais
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                  {[
                    { label: 'Áudio master finalizado', detail: 'WAV 24bit/44.1kHz ou superior', required: true },
                    { label: 'Capa do lançamento (3000×3000px)', detail: selectedRelease.cover_art_status === 'approved' ? '✓ Aprovada' : selectedRelease.cover_art_status === 'ready' ? 'Pronta — aguardando aprovação' : 'Pendente', required: true, done: selectedRelease.cover_art_status === 'approved' || selectedRelease.cover_art_status === 'ready' },
                    { label: 'ISRC registrado', detail: selectedRelease.isrc ? `✓ ${selectedRelease.isrc}` : 'Ainda não informado', required: true, done: !!selectedRelease.isrc },
                    { label: 'UPC / EAN', detail: selectedRelease.upc ? `✓ ${selectedRelease.upc}` : 'Ainda não informado', required: true, done: !!selectedRelease.upc },
                    { label: 'Distribuidora definida', detail: selectedRelease.distributor ? `✓ ${selectedRelease.distributor}` : 'Ainda não informada', required: true, done: !!selectedRelease.distributor },
                    { label: 'Press release / bio atualizada', detail: 'Texto para assessoria e plataformas', required: false },
                    { label: 'Pré-save configurado', detail: selectedRelease.presave_link ? `✓ Link ativo` : 'Link de pré-save para campanha — ativar 2 semanas antes', required: false, done: !!selectedRelease.presave_link },
                    { label: 'Pitch para playlists editoriais', detail: selectedRelease.playlist_pitch_status === 'approved' ? '✓ Aprovado!' : selectedRelease.playlist_pitch_status === 'sent' ? 'Enviado — aguardando resposta' : selectedRelease.playlist_pitch_status === 'in_analysis' ? 'Em análise' : 'Enviar com 7+ dias via Spotify for Artists', required: false, done: selectedRelease.playlist_pitch_status === 'approved' },
                    { label: 'Lançar na sexta-feira', detail: 'Algoritmos do Spotify priorizam lançamentos de sexta', required: false, done: !!selectedRelease.release_date && new Date(selectedRelease.release_date + 'T12:00:00').getDay() === 5 },
                  ].map((item, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-2 rounded-lg ${item.done ? 'bg-green-50' : ''}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${item.done ? 'bg-green-500 border-green-500' : item.required ? 'border-orange-400' : 'border-gray-300'}`}>
                        {item.done && <span className="text-white text-[9px] font-bold">✓</span>}
                      </div>
                      <div>
                        <p className={`text-xs font-medium ${item.done ? 'text-green-800' : 'text-gray-800'}`}>
                          {item.label}
                          {item.required && !item.done && <span className="ml-1 text-[10px] text-orange-500 font-normal">obrigatório</span>}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setShowDetailsModal(false); handleEdit(selectedRelease); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
                >
                  Editar lançamento
                </button>
                <button
                  onClick={() => { setShowDetailsModal(false); setSelectedRelease(null); }}
                  className="flex-1 py-2.5 bg-[#FFAD85] text-white rounded-xl text-sm font-bold hover:bg-[#FF9B6A] transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* placeholder — legacy modal removed */}

      {releaseLimitModal && (
        <PlanLimitModal
          resource="lançamentos"
          limit={planLimits.maxReleases}
          planName={planLimits.displayName || 'Plano atual'}
          onClose={() => setReleaseLimitModal(false)}
          onUpgrade={() => navigate('/profile')}
        />
      )}
    </div>
  );
}
