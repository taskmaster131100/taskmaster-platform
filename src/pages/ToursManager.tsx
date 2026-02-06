import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Calendar, Music, DollarSign, Clock, X, Search, Filter, Plane, Hotel, Users, Download } from 'lucide-react';
import {
  Tour,
  TourStatus,
  TOUR_STATUSES,
  createTour,
  updateTour,
  deleteTour,
  listTours,
  getTourById,
  formatDate,
  formatCurrency,
  calculateTourDuration
} from '../services/tourService';
import { toast } from 'sonner';

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

  const handleViewDetails = async (tour: Tour) => {
    try {
      const tourWithShows = await getTourById(tour.id);
      setSelectedTour(tourWithShows);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logística e Turnês</h1>
          <p className="text-gray-600 mt-1">Gerencie voos, hotéis e equipe técnica 360°</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Turnê / Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tours.map(tour => (
          <div
            key={tour.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(tour)}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{tour.name}</h3>
              <Plane className="w-6 h-6 text-[#FFAD85]" />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Hotel className="w-4 h-4" />
                <span>3 Hotéis Reservados</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>Equipe: 12 pessoas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(tour.start_date)} - {formatDate(tour.end_date)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex gap-2">
              <button className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1">
                <Download className="w-3 h-3" /> Vouchers
              </button>
              <button className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 flex items-center justify-center gap-1">
                <Users className="w-3 h-3" /> Equipe
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes de Logística */}
      {showDetailsModal && selectedTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Logística: {selectedTour.name}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                  <Plane className="w-5 h-5 text-blue-500" /> Voos e Deslocamento
                </h3>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="font-bold">Voo G3-1234 (GOL)</p>
                  <p className="text-sm text-gray-600">GRU → SDU | 15/02 às 10:00</p>
                  <p className="text-xs text-blue-600 mt-2 font-bold">Localizador: ABC123DEF</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-green-500" /> Hospedagem
                </h3>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <p className="font-bold">Hotel Copacabana Palace</p>
                  <p className="text-sm text-gray-600">Check-in: 15/02 | Check-out: 17/02</p>
                  <p className="text-xs text-green-600 mt-2 font-bold">Reserva: #987654321</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t">
              <button className="w-full py-4 bg-[#FFAD85] text-white rounded-xl font-bold text-lg hover:bg-[#FF9B6A] transition-all shadow-lg flex items-center justify-center gap-3">
                <Download className="w-6 h-6" />
                Baixar Malha de Viagem Completa (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
