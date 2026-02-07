import React, { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, DollarSign, Filter, Search, Eye, Edit, Trash2, FileText, Download } from 'lucide-react';
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
import { DocumentService, DEFAULT_CLAUSES } from '../services/documentService';
import ShowForm from '../components/ShowForm';
import RoadMap from '../components/RoadMap';
import SetlistManager from '../components/SetlistManager';
import TechnicalRider from '../components/TechnicalRider';
import FinancialSplit from '../components/FinancialSplit';

export default function ShowsManager() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ShowStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show | null>(null);
  const [activeView, setActiveView] = useState<'details' | 'roadmap' | 'setlist' | 'rider' | 'finance'>('details');

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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    setActiveView('details');
    setShowDetailsModal(true);
  };

  const handleCreateShow = () => {
    setSelectedShow(null);
    setShowFormModal(true);
  };

  const handleEditShow = (show: Show, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedShow(show);
    setShowFormModal(true);
  };

  const handleGenerateContract = async (show: Show) => {
    try {
      toast.info('Gerando contrato...');
      await DocumentService.generateShowContract({
        show,
        contractor: {
          name: show.contractor_name || 'Contratante Exemplo',
          document: '00.000.000/0001-00',
          address: 'Endereço do Evento',
          representative: 'Responsável Legal'
        },
        clauses: DEFAULT_CLAUSES
      });
      toast.success('Contrato gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast.error('Erro ao gerar contrato');
    }
  };

  const handleFormClose = () => {
    setShowFormModal(false);
    setSelectedShow(null);
  };

  const handleFormSave = () => {
    loadShows();
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
      proposto: 'bg-blue-100 text-blue-700',
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
              showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 hover:bg-gray-50'
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

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateContract(show);
                      }}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Contrato
                    </button>
                  </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditShow(show, e)}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(show.id, e)}
                      className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Formulário de Show */}
      {showFormModal && (
        <ShowForm
          show={selectedShow}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {/* Modal de Detalhes do Show / RoadMap */}
      {showDetailsModal && selectedShow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
            {/* Tabs do Modal */}
            <div className="flex border-b border-gray-100">
              <button 
                onClick={() => setActiveView('details')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeView === 'details' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Detalhes
              </button>
              <button 
                onClick={() => setActiveView('roadmap')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeView === 'roadmap' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Logística
              </button>
              <button 
                onClick={() => setActiveView('setlist')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeView === 'setlist' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Setlist
              </button>
              <button 
                onClick={() => setActiveView('rider')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeView === 'rider' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Rider Técnico
              </button>
              <button 
                onClick={() => setActiveView('finance')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeView === 'finance' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Financeiro
              </button>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {activeView === 'details' ? (
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedShow.title}</h2>
                      <p className="text-purple-600 font-medium">{selectedShow.artist_name}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Data</p>
                          <p className="font-medium">{formatDate(selectedShow.show_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Local</p>
                          <p className="font-medium">{selectedShow.venue || 'A definir'}, {selectedShow.city}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-gray-600">
                        <DollarSign className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Cachê</p>
                          <p className="font-medium">{formatCurrency(selectedShow.value || 0, selectedShow.currency)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <div className={`w-3 h-3 rounded-full ${getStatusBadgeColor(selectedShow.status).split(' ')[0]}`} />
                        <div>
                          <p className="text-xs text-gray-400 uppercase font-bold">Status</p>
                          <p className="font-medium uppercase">{selectedShow.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => handleGenerateContract(selectedShow)}
                      className="flex-1 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 flex items-center justify-center gap-2 font-bold shadow-lg shadow-purple-200 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      Gerar Contrato PDF
                    </button>
                    <button
                      onClick={() => setActiveView('roadmap')}
                      className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 font-bold transition-all"
                    >
                      <Truck className="w-5 h-5 text-purple-600" />
                      Ver Roteiro
                    </button>
                  </div>
                </div>
              ) : activeView === 'roadmap' ? (
                <div className="p-0">
                  <RoadMap showId={selectedShow.id} />
                </div>
              ) : activeView === 'setlist' ? (
                <div className="p-0">
                  <SetlistManager showId={selectedShow.id} />
                </div>
              ) : activeView === 'rider' ? (
                <div className="p-0">
                  <TechnicalRider showId={selectedShow.id} showData={selectedShow} />
                </div>
              ) : (
                <div className="p-6 sm:p-8">
                  <FinancialSplit 
                    show={selectedShow} 
                    onUpdate={() => {
                      loadShows();
                      // Atualizar o show selecionado no estado local
                      const updatedShow = shows.find(s => s.id === selectedShow.id);
                      if (updatedShow) setSelectedShow(updatedShow);
                    }} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
