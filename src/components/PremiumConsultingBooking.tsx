import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, DollarSign, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import {
  CONSULTING_PACKAGES,
  CONSULTING_TOPICS,
  generateAvailableSlots,
  createConsultingSession,
  ConsultingTopic,
  AvailableSlot
} from '../services/premiumConsultingService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface PremiumConsultingBookingProps {
  userId: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

type BookingStep = 'package' | 'topic' | 'datetime' | 'payment' | 'confirmation';

export default function PremiumConsultingBooking({
  userId,
  onClose,
  onSuccess
}: PremiumConsultingBookingProps) {
  const [step, setStep] = useState<BookingStep>('package');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<ConsultingTopic | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar slots disponíveis
    const slots = generateAvailableSlots(30);
    setAvailableSlots(slots);
  }, []);

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId);
    setStep('topic');
  };

  const handleSelectTopic = (topic: ConsultingTopic) => {
    setSelectedTopic(topic);
    setStep('datetime');
  };

  const handleSelectDateTime = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setStep('payment');
  };

  const handleConfirmBooking = async () => {
    if (!selectedPackage || !selectedTopic || !selectedDate || !selectedTime) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const pkg = CONSULTING_PACKAGES.find(p => p.id === selectedPackage);
      if (!pkg) throw new Error('Pacote não encontrado');

      // Criar sessão com status pendente
      const session = await createConsultingSession(
        userId,
        selectedPackage,
        selectedTopic,
        selectedDate,
        selectedTime
      );

      // Notificar o usuário sobre o fluxo de confirmação manual
      setStep('confirmation');
      toast.success('Solicitação enviada! Aguarde a confirmação do Marcos.');
    } catch (error) {
      console.error('Erro ao agendar consultoria:', error);
      toast.error('Erro ao agendar consultoria. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const pkg = CONSULTING_PACKAGES.find(p => p.id === selectedPackage);
  const topic = selectedTopic ? CONSULTING_TOPICS[selectedTopic] : null;

  // Passo 1: Selecionar Pacote
  if (step === 'package') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <div>
                <h2 className="text-2xl font-bold">Consultoria Premium com Marcos Menezes</h2>
                <p className="text-white/80 text-sm">1 hora de estratégia personalizada</p>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Pacotes */}
          <div className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Escolha seu Pacote</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CONSULTING_PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handleSelectPackage(pkg.id)}
                  className="text-left p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
                >
                  <h4 className="font-bold text-lg text-gray-900 mb-2">{pkg.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-bold text-2xl text-green-600">${pkg.priceUSD}</span>
                      <span className="text-sm text-gray-500">USD</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">{pkg.duration} minutos</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {pkg.benefits.slice(0, 3).map((benefit, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-indigo-600 font-bold mt-0.5">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="text-xs text-gray-500 italic">{pkg.idealFor}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Passo 2: Selecionar Tópico
  if (step === 'topic') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Escolha o Tópico</h2>
              <p className="text-white/80 text-sm">Pacote: {pkg?.name}</p>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Tópicos */}
          <div className="p-6 space-y-3">
            {Object.entries(CONSULTING_TOPICS).map(([key, topic]) => (
              <button
                key={key}
                onClick={() => handleSelectTopic(key as ConsultingTopic)}
                className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{topic.icon}</span>
                  <div>
                    <h4 className="font-bold text-gray-900">{topic.label}</h4>
                    <p className="text-sm text-gray-600">{topic.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Ações */}
          <div className="border-t border-gray-200 p-6 flex gap-3">
            <button
              onClick={() => setStep('package')}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Passo 3: Selecionar Data e Hora
  if (step === 'datetime') {
    const uniqueDates = [...new Set(availableSlots.map(s => s.date))].sort();
    const slotsForDate = selectedDate
      ? availableSlots.filter(s => s.date === selectedDate && s.available)
      : [];

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Escolha Data e Hora</h2>
              <p className="text-white/80 text-sm">{topic?.label}</p>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-6">
            {/* Datas */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Datas Disponíveis</h3>
              <div className="grid grid-cols-4 gap-2">
                {uniqueDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 rounded-lg border-2 transition-all text-center font-bold text-sm ${
                      selectedDate === date
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-gray-200 hover:border-indigo-600'
                    }`}
                  >
                    {new Date(date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
            </div>

            {/* Horários */}
            {selectedDate && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Horários Disponíveis</h3>
                <div className="grid grid-cols-4 gap-2">
                  {slotsForDate.map(slot => (
                    <button
                      key={`${slot.date}-${slot.time}`}
                      onClick={() => handleSelectDateTime(slot.date, slot.time)}
                      className={`p-3 rounded-lg border-2 transition-all text-center font-bold text-sm ${
                        selectedTime === slot.time
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                          : 'border-gray-200 hover:border-indigo-600'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="border-t border-gray-200 p-6 flex gap-3">
            <button
              onClick={() => setStep('topic')}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
            >
              Voltar
            </button>
            <button
              onClick={() => setStep('payment')}
              disabled={!selectedDate || !selectedTime}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Passo 4: Pagamento
  if (step === 'payment') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex items-center justify-between">
            <h2 className="text-2xl font-bold">Confirmar Agendamento</h2>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Resumo */}
          <div className="p-6 space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pacote:</span>
                <span className="font-bold text-gray-900">{pkg?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tópico:</span>
                <span className="font-bold text-gray-900">{topic?.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Data:</span>
                <span className="font-bold text-gray-900">
                  {selectedDate && new Date(selectedDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Horário:</span>
                <span className="font-bold text-gray-900">{selectedTime}</span>
              </div>
              <div className="border-t border-indigo-200 pt-3 flex items-center justify-between">
                <span className="text-gray-600 font-bold">Total:</span>
                <span className="text-2xl font-bold text-indigo-600">${pkg?.priceUSD} USD</span>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Ao confirmar, você será redirecionado para o pagamento seguro. Após a confirmação do pagamento, você receberá um email com o link da reunião e detalhes da consultoria.
            </p>
          </div>

          {/* Ações */}
          <div className="border-t border-gray-200 p-6 flex gap-3">
            <button
              onClick={() => setStep('datetime')}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Confirmar e Pagar <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Passo 5: Confirmação
  if (step === 'confirmation') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold">Solicitação Enviada!</h2>
            <p className="text-white/80 text-sm mt-1">Aguardando confirmação de agenda do Marcos Menezes</p>
          </div>

          {/* Detalhes */}
          <div className="p-6 space-y-6">
            <div className="bg-amber-50 p-4 rounded-lg space-y-3 border border-amber-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-sm text-gray-600">Data Solicitada</div>
                  <div className="font-bold text-gray-900">
                    {selectedDate && new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="text-sm text-gray-600">Horário (EST)</div>
                  <div className="font-bold text-gray-900">{selectedTime}</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                📧 Recebemos seu pedido! O Marcos Menezes verificará a agenda dele e você receberá um email de confirmação com o link da reunião assim que ele validar o horário.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">Próximos Passos:</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">1.</span>
                  <span>Prepare-se para a sessão (tenha seus dados prontos)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">2.</span>
                  <span>Acesse o link da reunião 5 minutos antes da hora agendada</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">3.</span>
                  <span>Aproveite a consultoria estratégica com Marcos Menezes</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-indigo-600">4.</span>
                  <span>Receba um relatório com as ações recomendadas</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Ações */}
          <div className="border-t border-gray-200 p-6 flex gap-3">
            <button
              onClick={() => {
                onClose?.();
                onSuccess?.();
              }}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Voltar ao Dashboard
            </button>
            <button
              onClick={() => navigate('/mentor-chat')}
              className="flex-1 py-3 border border-indigo-200 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all"
            >
              Conversar com Marcos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
