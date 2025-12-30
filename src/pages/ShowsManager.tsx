import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, DollarSign, Filter, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Show,
  ShowStatus,
  SHOW_STATUSES,
  listShows,
  deleteShow,
  formatCurrency,
  formatDate,
  getStatusColor
} from '../services/showService';

export default function ShowsManager() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ShowStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);

  useEffect(() => {
    loadShows();
  }, [selectedStatus]);

  const loadShows = async () => {
    try {
      setLoading(true);
      const data = await listShows({
        status: selectedStatus || undefined
      });
      setShows(data);
    } catch (error) {
      console.error('Erro ao carregar shows:', error);
      toast.error('Erro ao carregar shows');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este show?')) return;

    try {
      await deleteShow(id);
      toast.success('Show excluído com sucesso');
      loadShows();
    } catch (error) {
      console.error('Erro ao excluir show:', error);
      toast.error('Erro ao excluir show');
    }
  };

  const handleViewDetails = (show: Show) => {
    setSelectedShow(show);
    setShowDetailsModal(true);
  };

  const handleCreateShow = () => {
    setSelectedShow(null);
    setShowFormModal(true);
  };

  const handleEditShow = (show: Show) => {
    setSelectedShow(show);
    setShowFormModal(true);
  };

  const filteredShows = shows.filter(show =>
    searchTerm === '' ||
    show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.artist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status: ShowStatus) => {
    const colors = {
      consultado: 'bg-gray-100 text-gray-700',
      proposto: 'bg-blue-100 text-[#FF9B6A]',
      fechado: 'bg-green-100 text-green-700',
      pago: 'bg-purple-100 text-purple-700'
    };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shows</h1>
            <p className="text-gray-600 mt-1">
              {shows.length} show(s) • Gerencie apresentações e eventos
            </p>
          </div>
          <button
            onClick={handleCreateShow}
            className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Show
          </button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar shows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors ${
              showFilters ? 'bg-blue-50 border-blue-300 text-[#FF9B6A]' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ShowStatus | '')}
                className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              >
                <option value="">Todos</option>
                {SHOW_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>

              {selectedStatus && (
                <button
                  onClick={() => setSelectedStatus('')}
                  className="text-sm text-[#FFAD85] hover:text-[#FF9B6A]"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAD85] mx-auto"></div>
            <p className="text-gray-600 mt-4">Carregando shows...</p>
          </div>
        ) : filteredShows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum show encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              Comece criando seu primeiro show
            </p>
            <button
              onClick={handleCreateShow}
              className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
            >
              Criar Show
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShows.map(show => (
              <div
                key={show.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(show)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 flex-1 pr-2">
                      {show.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(show.status)}`}>
                      {SHOW_STATUSES.find(s => s.value === show.status)?.label}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {show.artist_name}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(show.show_date)}
                      {show.show_time && ` às ${show.show_time}`}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {show.venue ? `${show.venue}, ${show.city}` : show.city}
                    </div>

                    {show.value && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(show.value, show.currency)}
                      </div>
                    )}
                  </div>

                  {show.contractor_name && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Contratante: {show.contractor_name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(show);
                    }}
                    className="text-sm text-[#FFAD85] hover:text-[#FF9B6A] flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {selectedShow ? 'Editar Show' : 'Novo Show'}
            </h2>
            <p className="text-gray-600">Formulário de show será implementado</p>
            <button
              onClick={() => setShowFormModal(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {showDetailsModal && selectedShow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Detalhes do Show</h2>
            <p className="text-gray-600">Detalhes completos serão implementados</p>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
