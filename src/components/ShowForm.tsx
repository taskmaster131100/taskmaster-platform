import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Sparkles } from 'lucide-react';
import { Show, createShow, updateShow, SHOW_STATUSES } from '../services/showService';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface ShowFormProps {
  show?: Show | null;
  onClose: () => void;
  onSave: () => void;
  initialArtistName?: string;
}

export default function ShowForm({ show, onClose, onSave, initialArtistName }: ShowFormProps) {
  const [loading, setLoading] = useState(false);
  const [artists, setArtists] = useState<{ id: string; name: string; stage_name?: string }[]>([]);

  // formData usa os campos que o usuário conhece (nomes amigáveis)
  // o service mapeia para o schema real do banco
  const [formData, setFormData] = useState({
    artist_name: show?.artist_name || initialArtistName || '',
    title: show?.title || '',
    show_date: show?.show_date || '',
    show_time: show?.show_time || '',
    venue: show?.venue || '',
    city: show?.city || (show?.venue_address?.split(',')?.[0]?.trim()) || '',
    state: '',
    country: (show as any)?.country || '',
    contractor_name: show?.venue_contact_name || '',
    contractor_contact: show?.venue_contact_phone || '',
    value: show?.deal_value ?? show?.value ?? 0,
    currency: 'BRL',
    commission_rate: show?.commission_rate ?? 20,
    artist_split: show?.artist_split ?? 80,
    status: show?.status || 'consultado',
    notes: show?.notes || '',
    load_in_time: show?.load_in_time || '',
    soundcheck_time: show?.soundcheck_time || '',
    doors_open_time: show?.doors_open_time || '',
    contract_url: show?.contract_url || '',
    payment_terms: show?.payment_terms || '',
  });

  useEffect(() => {
    supabase
      .from('artists')
      .select('id, name, stage_name')
      .order('name')
      .then(({ data }) => setArtists(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.artist_split < 0 || formData.artist_split > 100) {
      toast.error('A porcentagem do artista deve ser entre 0% e 100%');
      return;
    }
    setLoading(true);
    try {
      if (show?.id) {
        await updateShow(show.id, formData as any, show.status);
        toast.success('Show atualizado!');
      } else {
        await createShow(formData as any);
        toast.success('Show criado!');
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar show:', err);
      toast.error(err?.message || 'Erro ao salvar show');
    } finally {
      setLoading(false);
    }
  };

  const displayName = (a: { name: string; stage_name?: string }) =>
    a.stage_name ? `${a.stage_name} (${a.name})` : a.name;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
        <div className="bg-purple-600 px-6 py-2 flex items-center gap-2 text-white text-xs font-medium">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>{formData.title ? `Criando: ${formData.title}` : 'Preencha os dados do show'}</span>
        </div>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 className="text-xl font-bold text-gray-900">{show ? 'Editar Show' : 'Novo Show'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Título */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Título do Evento *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Ex: Festival de Verão 2026"
              />
            </div>

            {/* Artista */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Artista *</label>
              <select
                required
                value={formData.artist_name}
                onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="">Selecione um artista</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.name}>{displayName(a)}</option>
                ))}
              </select>
            </div>

            {/* Status */}
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

            {/* Data */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                required
                value={formData.show_date}
                onChange={(e) => setFormData({ ...formData, show_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Horário */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Horário</label>
              <input
                type="time"
                value={formData.show_time}
                onChange={(e) => setFormData({ ...formData, show_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>

            {/* Venue */}
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

            {/* Cidade */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Cidade *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Ex: Rio de Janeiro"
              />
            </div>

            {/* Contratante */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contratante</label>
              <input
                type="text"
                value={formData.contractor_name}
                onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Nome do contratante"
              />
            </div>

            {/* Contato */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contato</label>
              <input
                type="text"
                value={formData.contractor_contact}
                onChange={(e) => setFormData({ ...formData, contractor_contact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Telefone ou email"
              />
            </div>

            {/* Financeiro */}
            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-bold text-purple-600 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financeiro & Split
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cachê Bruto</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.value || ''}
                    onFocus={(e) => { if (formData.value === 0) e.target.select(); }}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="0,00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">% Artista</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.artist_split}
                    onChange={(e) => setFormData({ ...formData, artist_split: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  {formData.value > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Artista recebe: R$ {((formData.value * formData.artist_split) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
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

            {/* Cronograma Operacional */}
            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-bold text-blue-600 mb-3">Cronograma do Dia</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Load-in</label>
                  <input
                    type="time"
                    value={formData.load_in_time}
                    onChange={(e) => setFormData({ ...formData, load_in_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Soundcheck</label>
                  <input
                    type="time"
                    value={formData.soundcheck_time}
                    onChange={(e) => setFormData({ ...formData, soundcheck_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Abertura</label>
                  <input
                    type="time"
                    value={formData.doors_open_time}
                    onChange={(e) => setFormData({ ...formData, doors_open_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Início Show</label>
                  <input
                    type="time"
                    value={formData.show_time}
                    onChange={(e) => setFormData({ ...formData, show_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Contrato */}
            <div className="md:col-span-2 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-bold text-gray-600 mb-3">Contrato</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">URL do Contrato</label>
                  <input
                    type="url"
                    value={formData.contract_url}
                    onChange={(e) => setFormData({ ...formData, contract_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Ex: 50% adiantado, 50% no dia"
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">Observações</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                placeholder="Informações adicionais sobre o show..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
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
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Save className="w-5 h-5" />}
              {show ? 'Salvar Alterações' : 'Criar Show'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
