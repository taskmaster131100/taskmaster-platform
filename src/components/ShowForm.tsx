import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, DollarSign, User, Phone, FileText, Sparkles } from 'lucide-react';
import { Show, createShow, updateShow, SHOW_STATUSES } from '../services/showService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ShowFormProps {
  show?: Show | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ShowForm({ show, onClose, onSave }: ShowFormProps) {
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: show?.title || '',
    artist_name: show?.artist_name || '',
    show_date: show?.show_date || '',
    show_time: show?.show_time || '',
    venue: show?.venue || '',
    city: show?.city || '',
    state: show?.state || '',
    country: show?.country || 'Brasil',
    contractor_name: show?.contractor_name || '',
    contractor_contact: show?.contractor_contact || '',
    value: show?.value || 0,
    currency: show?.currency || 'BRL',
    commission_rate: show?.commission_rate || 20,
    artist_split: show?.artist_split || 80,
    status: show?.status || 'consultado',
    notes: show?.notes || ''
  });

  useEffect(() => {
    const loadArtists = async () => {
      const { data } = await supabase.from('artists').select('name').order('name');
      setArtists(data || []);
    };
    loadArtists();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (show?.id) {
        await updateShow(show.id, formData, show.status);
        toast.success('Show atualizado com sucesso!');
      } else {
        await createShow(formData);
        toast.success('Show criado com sucesso!');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar show:', error);
      toast.error('Erro ao salvar show');
    } finally {
      setLoading(false);
    }
  };

  const getContextualTip = () => {
    if (!formData.title) return "Dica: Comece com um título marcante para o evento!";
    if (formData.value > 5000 && formData.artist_split > 90) return "Atenção: Com essa porcentagem, a margem da produtora fica bem apertada. Já considerou os custos fixos?";
    if (formData.city && formData.city.toLowerCase() !== 'rio de janeiro' && formData.city.toLowerCase() !== 'são paulo') return "Viagem longa? Lembre-se de detalhar bem o RoadMap para o conforto da equipe.";
    return "O Agente Virtual está analisando seu show em tempo real...";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        {/* Contextual Agent Tip */}
        <div className="bg-purple-600 px-6 py-2 flex items-center gap-2 text-white text-xs font-medium">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>{getContextualTip()}</span>
        </div>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">
            {show ? 'Editar Show' : 'Novo Show'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Título do Evento</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Ex: Festival de Verão 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Artista</label>
              <select
                required
                value={formData.artist_name}
                onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">Selecione um artista</option>
                {artists.map((a) => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {SHOW_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data</label>
              <input
                type="date"
                required
                value={formData.show_date}
                onChange={(e) => setFormData({ ...formData, show_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Horário</label>
              <input
                type="time"
                value={formData.show_time}
                onChange={(e) => setFormData({ ...formData, show_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Local/Venue</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Ex: Circo Voador"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-bold text-purple-600 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financeiro & Split
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cachê Bruto</label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">% Artista</label>
                  <input
                    type="number"
                    value={formData.artist_split}
                    onChange={(e) => setFormData({ ...formData, artist_split: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Moeda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
              {show ? 'Salvar Alterações' : 'Criar Show'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
