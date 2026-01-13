import { useState, useEffect } from 'react';
import { X, Save, DollarSign, MapPin, Calendar, User, Phone, FileText, Truck, Hotel, Utensils, Users } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Show, 
  ShowStatus, 
  SHOW_STATUSES, 
  createShow, 
  updateShow 
} from '../services/showService';
import { onShowClosed, onShowPaid, addShowLogistics } from '../services/integrationService';

interface ShowFormProps {
  show?: Show | null;
  onClose: () => void;
  onSave: () => void;
}

export default function ShowForm({ show, onClose, onSave }: ShowFormProps) {
  const [loading, setLoading] = useState(false);
  const [showLogistics, setShowLogistics] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    artist_name: '',
    show_date: '',
    show_time: '',
    venue: '',
    city: '',
    state: '',
    country: 'Brasil',
    contractor_name: '',
    contractor_contact: '',
    value: '',
    currency: 'BRL',
    status: 'consultado' as ShowStatus,
    notes: ''
  });

  const [logistics, setLogistics] = useState({
    transport: '',
    accommodation: '',
    food: '',
    crew: ''
  });

  useEffect(() => {
    if (show) {
      setFormData({
        title: show.title || '',
        artist_name: show.artist_name || '',
        show_date: show.show_date || '',
        show_time: show.show_time || '',
        venue: show.venue || '',
        city: show.city || '',
        state: show.state || '',
        country: show.country || 'Brasil',
        contractor_name: show.contractor_name || '',
        contractor_contact: show.contractor_contact || '',
        value: show.value?.toString() || '',
        currency: show.currency || 'BRL',
        status: show.status || 'consultado',
        notes: show.notes || ''
      });
    }
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.artist_name || !formData.show_date || !formData.city) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const showData = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined
      };

      if (show) {
        // Atualização - verificar mudança de status
        const previousStatus = show.status;
        const updatedShow = await updateShow(show.id, showData);
        
        // Se mudou para "fechado", executar integrações
        if (formData.status === 'fechado' && previousStatus !== 'fechado') {
          await onShowClosed(updatedShow);
          toast.success('Show fechado! Receita adicionada ao financeiro e checklist criado.');
        }
        // Se mudou para "pago", atualizar financeiro
        else if (formData.status === 'pago' && previousStatus !== 'pago') {
          await onShowPaid(show.id);
          toast.success('Show marcado como pago! Financeiro atualizado.');
        }
        else {
          toast.success('Show atualizado com sucesso');
        }

        // Se tem custos de logística, adicionar ao financeiro
        if (showLogistics && (logistics.transport || logistics.accommodation || logistics.food || logistics.crew)) {
          await addShowLogistics(show.id, {
            transport: logistics.transport ? parseFloat(logistics.transport) : undefined,
            accommodation: logistics.accommodation ? parseFloat(logistics.accommodation) : undefined,
            food: logistics.food ? parseFloat(logistics.food) : undefined,
            crew: logistics.crew ? parseFloat(logistics.crew) : undefined
          });
          toast.success('Custos de logística adicionados ao financeiro');
        }
      } else {
        // Criação
        const newShow = await createShow(showData);
        
        // Se já está criando como "fechado", executar integrações
        if (formData.status === 'fechado') {
          await onShowClosed(newShow);
          toast.success('Show criado e fechado! Receita adicionada ao financeiro e checklist criado.');
        } else {
          toast.success('Show criado com sucesso');
        }
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

  const calculateProfit = () => {
    const revenue = parseFloat(formData.value) || 0;
    const expenses = 
      (parseFloat(logistics.transport) || 0) +
      (parseFloat(logistics.accommodation) || 0) +
      (parseFloat(logistics.food) || 0) +
      (parseFloat(logistics.crew) || 0);
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { revenue, expenses, profit, margin };
  };

  const profitData = calculateProfit();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {show ? 'Editar Show' : 'Novo Show'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Show *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Ex: Show de Lançamento"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artista *
                </label>
                <input
                  type="text"
                  value={formData.artist_name}
                  onChange={(e) => setFormData({ ...formData, artist_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Nome do artista"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.show_date}
                  onChange={(e) => setFormData({ ...formData, show_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={formData.show_time}
                  onChange={(e) => setFormData({ ...formData, show_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ShowStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  {SHOW_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Local */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Local
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Casa de Show / Venue
                </label>
                <input
                  type="text"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Nome do local"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Cidade"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="UF"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  País
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="País"
                />
              </div>
            </div>
          </div>

          {/* Contratante */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5" />
              Contratante
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Contratante
                </label>
                <input
                  type="text"
                  value={formData.contractor_name}
                  onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Nome ou empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contato
                </label>
                <input
                  type="text"
                  value={formData.contractor_contact}
                  onChange={(e) => setFormData({ ...formData, contractor_contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Telefone ou email"
                />
              </div>
            </div>
          </div>

          {/* Financeiro */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financeiro
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cachê
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="0,00"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moeda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  <option value="BRL">BRL - Real</option>
                  <option value="USD">USD - Dólar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>

            {/* Toggle para mostrar custos de logística */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showLogistics"
                checked={showLogistics}
                onChange={(e) => setShowLogistics(e.target.checked)}
                className="rounded border-gray-300 text-[#FFAD85] focus:ring-[#FFAD85]"
              />
              <label htmlFor="showLogistics" className="text-sm text-gray-700">
                Adicionar custos de logística (transporte, hospedagem, etc.)
              </label>
            </div>

            {showLogistics && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="font-medium text-gray-900">Custos de Logística</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      Transporte
                    </label>
                    <input
                      type="number"
                      value={logistics.transport}
                      onChange={(e) => setLogistics({ ...logistics, transport: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      placeholder="0,00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Hotel className="w-4 h-4" />
                      Hospedagem
                    </label>
                    <input
                      type="number"
                      value={logistics.accommodation}
                      onChange={(e) => setLogistics({ ...logistics, accommodation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      placeholder="0,00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Utensils className="w-4 h-4" />
                      Alimentação
                    </label>
                    <input
                      type="number"
                      value={logistics.food}
                      onChange={(e) => setLogistics({ ...logistics, food: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      placeholder="0,00"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Equipe
                    </label>
                    <input
                      type="number"
                      value={logistics.crew}
                      onChange={(e) => setLogistics({ ...logistics, crew: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                      placeholder="0,00"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Resumo do Lucro */}
                {formData.value && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">Resumo Financeiro</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Receita</p>
                        <p className="font-semibold text-green-600">
                          R$ {profitData.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Despesas</p>
                        <p className="font-semibold text-red-600">
                          R$ {profitData.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Lucro</p>
                        <p className={`font-semibold ${profitData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {profitData.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Margem</p>
                        <p className={`font-semibold ${profitData.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profitData.margin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              rows={3}
              placeholder="Notas adicionais sobre o show..."
            />
          </div>

          {/* Aviso sobre integração */}
          {formData.status === 'fechado' && !show?.status?.includes('fechado') && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Ao fechar este show:</strong>
                <br />
                • O cachê será automaticamente adicionado ao financeiro como receita
                <br />
                • Um checklist completo será criado com todas as tarefas necessárias
                <br />
                • O evento será adicionado ao calendário
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {show ? 'Atualizar' : 'Criar'} Show
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
