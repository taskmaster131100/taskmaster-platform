import React, { useState, useEffect } from 'react';
import { Plus, Music, Search, Filter, X, Calendar, Upload, FileText, Clock, CheckCircle2, Circle } from 'lucide-react';
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

export default function ReleasesManager() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [phases, setPhases] = useState<ReleasePhase[]>([]);
  const [attachments, setAttachments] = useState<ReleaseAttachment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReleaseStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ReleaseType | ''>('');
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    loadReleases();
  }, [statusFilter, typeFilter]);

  const loadReleases = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.type = typeFilter;

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
      artist_name: '',
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

  const filteredReleases = releases.filter(release =>
    release.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    release.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        return <Circle className="w-5 h-5 text-blue-600 animate-pulse" />;
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Novo Lançamento
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar lançamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReleaseStatus | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Todos os Status</option>
          {RELEASE_STATUSES.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ReleaseType | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lançamento encontrado</h3>
          <p className="text-gray-600 mb-4">Crie seu primeiro lançamento para começar</p>
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
                      <Music className="w-5 h-5 text-blue-600" />
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
                    className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ReleaseStatus })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                              className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Início: {formatDate(phase.start_date!)}</span>
                            <span>•</span>
                            <span>Fim: {formatDate(phase.end_date!)}</span>
                          </div>
                        </div>
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
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
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

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
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

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
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
                  <p className="text-sm text-blue-600 mb-4">Enviando arquivo...</p>
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
                          className="text-sm text-blue-600 hover:text-blue-700"
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
    </div>
  );
}
