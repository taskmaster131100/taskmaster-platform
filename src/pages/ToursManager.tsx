import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Calendar, Music, DollarSign, Clock, X, Search, Filter } from 'lucide-react';
import {
  Tour,
  TourStatus,
  TOUR_STATUSES,
  createTour,
  updateTour,
  deleteTour,
  listTours,
  getTourById,
  addShowToTour,
  removeShowFromTour,
  getAvailableShows,
  formatDate,
  formatCurrency,
  getStatusColor,
  calculateTourDuration
} from '../services/tourService';

export default function ToursManager() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTour, setSelectedTour] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TourStatus | ''>('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning' as TourStatus,
    notes: ''
  });

  useEffect(() => {
    loadTours();
  }, [statusFilter]);

  const loadTours = async () => {
    try {
      setLoading(true);
      const filters = statusFilter ? { status: statusFilter } : undefined;
      const data = await listTours(filters);
      setTours(data);
    } catch (error) {
      console.error('Erro ao carregar turnês:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedTour) {
        await updateTour(selectedTour.id, formData);
      } else {
        await createTour(formData);
      }
      setShowModal(false);
      resetForm();
      loadTours();
    } catch (error) {
      console.error('Erro ao salvar turnê:', error);
    }
  };

  const handleEdit = (tour: Tour) => {
    setSelectedTour(tour);
    setFormData({
      name: tour.name,
      description: tour.description || '',
      start_date: tour.start_date,
      end_date: tour.end_date,
      status: tour.status,
      notes: tour.notes || ''
    });
    setShowModal(true);
  };

  const handleViewDetails = async (tour: Tour) => {
    try {
      const tourWithShows = await getTourById(tour.id);
      setSelectedTour(tourWithShows);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta turnê?')) {
      try {
        await deleteTour(id);
        loadTours();
      } catch (error) {
        console.error('Erro ao excluir turnê:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'planning',
      notes: ''
    });
    setSelectedTour(null);
  };

  const filteredTours = tours.filter(tour =>
    tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tour.description && tour.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: TourStatus) => {
    const statusInfo = TOUR_STATUSES.find(s => s.value === status);
    const colorClasses = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      red: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClasses[statusInfo?.color as keyof typeof colorClasses]}`}>
        {statusInfo?.label}
      </span>
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Turnês</h1>
          <p className="text-gray-600 mt-1">Organize shows em turnês</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Turnê
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar turnês..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TourStatus | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
          >
            <option value="">Todos os Status</option>
            {TOUR_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredTours.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma turnê encontrada</h3>
          <p className="text-gray-600 mb-4">Crie sua primeira turnê para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTours.map(tour => (
            <div
              key={tour.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewDetails(tour)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{tour.name}</h3>
                  {getStatusBadge(tour.status)}
                </div>
                <MapPin className="w-6 h-6 text-[#FFAD85]" />
              </div>

              {tour.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tour.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(tour.start_date)} - {formatDate(tour.end_date)}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{calculateTourDuration(tour.start_date, tour.end_date)} dias</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <Music className="w-4 h-4" />
                  <span>{tour.total_shows} shows</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatCurrency(tour.total_revenue)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(tour);
                  }}
                  className="flex-1 px-3 py-2 text-sm text-[#FFAD85] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(tour.id);
                  }}
                  className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedTour ? 'Editar Turnê' : 'Nova Turnê'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Turnê *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Ex: Turnê Brasil 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Descrição da turnê..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Término *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TourStatus })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  {TOUR_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Observações adicionais..."
                />
              </div>

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
                  {selectedTour ? 'Atualizar' : 'Criar'} Turnê
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && selectedTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTour.name}</h2>
                <div className="mt-2">{getStatusBadge(selectedTour.status)}</div>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedTour(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {selectedTour.description && (
                <p className="text-gray-700 mb-6">{selectedTour.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Calendar className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Duração</p>
                  <p className="text-lg font-bold text-gray-900">
                    {calculateTourDuration(selectedTour.start_date, selectedTour.end_date)} dias
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <Music className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Total de Shows</p>
                  <p className="text-lg font-bold text-gray-900">{selectedTour.total_shows}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <DollarSign className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Receita Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedTour.total_revenue)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Shows da Turnê</h3>
                {selectedTour.shows && selectedTour.shows.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTour.shows.map((show: any) => (
                      <div key={show.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{show.name}</p>
                          <p className="text-sm text-gray-600">{show.venue} - {show.city}</p>
                          <p className="text-sm text-gray-600">{formatDate(show.event_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(show.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">Nenhum show adicionado ainda</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
