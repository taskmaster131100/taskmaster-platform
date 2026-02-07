import React, { useState, useEffect } from 'react';
import { 
  Truck, Hotel, Utensils, Users, Clock, MapPin, 
  ChevronRight, Calendar, Phone, ExternalLink, 
  AlertCircle, CheckCircle2, Loader2, Plus, Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface RoadMapProps {
  showId: string;
  onClose?: () => void;
}

interface LogisticsItem {
  id: string;
  type: 'transport' | 'accommodation' | 'food' | 'crew' | 'schedule';
  title: string;
  description?: string;
  time?: string;
  location?: string;
  contact_name?: string;
  contact_phone?: string;
  status: 'pending' | 'confirmed' | 'alert';
  metadata?: any;
}

export default function RoadMap({ showId, onClose }: RoadMapProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LogisticsItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showData, setShowData] = useState<any>(null);

  useEffect(() => {
    loadRoadMap();
  }, [showId]);

  async function loadRoadMap() {
    try {
      setLoading(true);
      
      // 1. Buscar dados do show
      const { data: show } = await supabase
        .from('shows')
        .select('*')
        .eq('id', showId)
        .single();
      
      setShowData(show);

      // 2. Buscar itens de logística (usando a tabela show_tasks ou uma nova se existisse)
      // Por enquanto, vamos simular ou usar metadados de show_tasks
      const { data: tasks } = await supabase
        .from('show_tasks')
        .select('*')
        .eq('show_id', showId)
        .in('category', ['logistics', 'production', 'team']);

      // Mapear tarefas para itens de RoadMap
      const mappedItems: LogisticsItem[] = (tasks || []).map(t => ({
        id: t.id,
        type: t.category === 'logistics' ? 'transport' : (t.category === 'production' ? 'schedule' : 'crew'),
        title: t.title,
        description: t.description,
        status: t.status === 'completed' ? 'confirmed' : 'pending',
        time: t.due_date // Simplificação
      }));

      setItems(mappedItems);
    } catch (error) {
      console.error('Erro ao carregar RoadMap:', error);
      toast.error('Erro ao carregar roteiro');
    } finally {
      setLoading(false);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'transport': return <Truck className="w-5 h-5" />;
      case 'accommodation': return <Hotel className="w-5 h-5" />;
      case 'food': return <Utensils className="w-5 h-5" />;
      case 'crew': return <Users className="w-5 h-5" />;
      case 'schedule': return <Clock className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-500 bg-green-50 border-green-100';
      case 'alert': return 'text-amber-500 bg-amber-50 border-amber-100';
      default: return 'text-gray-400 bg-gray-50 border-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header do RoadMap */}
      <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Roteiro da Estrada</h2>
            <p className="text-purple-100 opacity-90">{showData?.title} • {showData?.city}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {showData?.show_time || 'Horário a definir'}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {showData?.venue || 'Local a definir'}
          </div>
        </div>
      </div>

      {/* Timeline de Logística */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900">Cronograma & Logística</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-sm font-bold text-purple-600 flex items-center gap-1 hover:underline"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>

        <div className="space-y-6 relative before:absolute before:left-[1.25rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
          {items.length > 0 ? (
            items.map((item, index) => (
              <div key={item.id} className="relative pl-10 group">
                {/* Dot */}
                <div className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center z-10 shadow-sm transition-all ${
                  item.status === 'confirmed' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {getIcon(item.type)}
                </div>

                <div className="bg-white border border-gray-100 rounded-xl p-4 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 block">
                        {item.time || 'Horário pendente'}
                      </span>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                      {item.status === 'confirmed' ? 'CONFIRMADO' : 'PENDENTE'}
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  )}

                  {(item.contact_name || item.location) && (
                    <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-50">
                      {item.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </div>
                      )}
                      {item.contact_name && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {item.contact_name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
              <Truck className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nenhum item no roteiro ainda.</p>
            </div>
          )}
        </div>
      </div>

      {/* Botão de Compartilhamento (Conforto do Artista) */}
      <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
        <button className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-sm">
          <Phone className="w-5 h-5" />
          Enviar para WhatsApp
        </button>
        <button className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all">
          Gerar PDF
        </button>
      </div>
    </div>
  );
}
