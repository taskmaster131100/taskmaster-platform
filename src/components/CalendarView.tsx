import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, Clock, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  event_type: 'task' | 'meeting' | 'event' | 'show' | 'deadline' | 'planning';
  color?: string;
  location?: string;
  created_by: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface CalendarViewProps {
  tasks?: any[];
  onTaskUpdate?: (task: any) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks = [],
  onTaskUpdate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const eventTypes = [
    { id: 'all', label: 'Todos', color: 'gray' },
    { id: 'task', label: 'Tarefa', color: 'blue' },
    { id: 'meeting', label: 'Reunião', color: 'purple' },
    { id: 'event', label: 'Evento', color: 'green' },
    { id: 'show', label: 'Show', color: 'pink' },
    { id: 'deadline', label: 'Prazo', color: 'red' },
    { id: 'planning', label: 'Planejamento', color: 'indigo' }
  ];

  useEffect(() => {
    loadEvents();

    // Real-time subscription
    const channel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate]);

  async function loadEvents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, isCurrentMonth: true });
    }

    return days;
  };

  const getEventsForDate = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).toISOString().split('T')[0];

    let filtered = events.filter(event => event.event_date === dateStr);

    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.event_type === filterType);
    }

    return filtered;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setShowCreateModal(true);
  };

  async function handleCreateEvent(eventData: any) {
    try {
      // Validações frontend
      if (!eventData.title || eventData.title.trim() === '') {
        toast.error('O título do evento é obrigatório');
        return;
      }

      if (eventData.title.length > 200) {
        toast.error('O título deve ter no máximo 200 caracteres');
        return;
      }

      if (!selectedDate) {
        toast.error('Selecione uma data para o evento');
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast.error('Você precisa estar autenticado');
        return;
      }

      const { error } = await supabase
        .from('calendar_events')
        .insert({
          title: eventData.title.trim(),
          description: eventData.description?.trim() || null,
          event_date: selectedDate.toISOString().split('T')[0],
          start_time: eventData.start_time || null,
          end_time: eventData.end_time || null,
          event_type: eventData.event_type || 'event',
          color: eventData.color || 'blue',
          location: eventData.location?.trim() || null,
          created_by: user.user.id,
          metadata: {
            source: 'calendar',
            createdAt: new Date().toISOString()
          }
        });

      if (error) throw error;

      setShowCreateModal(false);
      toast.success('Evento criado com sucesso!');
      loadEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Erro ao criar evento');
    }
  }

  async function handleUpdateEvent(eventId: string, updates: Partial<CalendarEvent>) {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', eventId);

      if (error) throw error;

      setShowEditModal(false);
      setSelectedEvent(null);
      toast.success('Evento atualizado!');
      loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Erro ao atualizar evento');
    }
  }

  async function handleDeleteEvent(eventId: string) {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Evento excluído!');

      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Erro ao excluir evento');
    }
  }

  const getEventTypeColor = (type: string) => {
    const eventType = eventTypes.find(t => t.id === type);
    return eventType?.color || 'gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-[#FFAD85] hover:bg-blue-50 rounded-lg transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
          >
            {eventTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo Evento
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {getDaysInMonth(currentDate).map((dayObj, index) => {
            const dayEvents = dayObj.day ? getEventsForDate(dayObj.day) : [];

            return (
              <div
                key={index}
                onClick={() => handleDayClick(dayObj.day)}
                className={`min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !dayObj.isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday(dayObj.day) ? 'bg-blue-50' : ''}`}
              >
                {dayObj.day && (
                  <>
                    <div className={`text-sm font-semibold mb-1 ${
                      isToday(dayObj.day) ? 'text-[#FFAD85]' : 'text-gray-900'
                    }`}>
                      {dayObj.day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        const color = getEventTypeColor(event.event_type);
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setShowEditModal(true);
                            }}
                            className={`text-xs p-1 rounded bg-${color}-100 text-${color}-700 truncate hover:bg-${color}-200 transition-colors`}
                          >
                            {event.start_time && (
                              <span className="font-semibold">{event.start_time.slice(0, 5)} </span>
                            )}
                            {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 3} mais
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{events.length}</div>
          <div className="text-sm text-gray-600">Total de Eventos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-[#FFAD85]">
            {events.filter(e => e.event_type === 'task').length}
          </div>
          <div className="text-sm text-gray-600">Tarefas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {events.filter(e => e.event_type === 'meeting').length}
          </div>
          <div className="text-sm text-gray-600">Reuniões</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-pink-600">
            {events.filter(e => e.event_type === 'show').length}
          </div>
          <div className="text-sm text-gray-600">Shows</div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <EventFormModal
          title="Novo Evento"
          date={selectedDate}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedDate(null);
          }}
          onSave={handleCreateEvent}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedEvent && (
        <EventFormModal
          title="Editar Evento"
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          onSave={(data) => {
            handleUpdateEvent(selectedEvent.id, data);
          }}
          onDelete={() => {
            handleDeleteEvent(selectedEvent.id);
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
};

// Form Modal Component
function EventFormModal({
  title,
  event,
  date,
  onClose,
  onSave,
  onDelete
}: {
  title: string;
  event?: CalendarEvent;
  date?: Date | null;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: () => void;
}) {
  const eventTypes = [
    { id: 'task', label: 'Tarefa' },
    { id: 'meeting', label: 'Reunião' },
    { id: 'event', label: 'Evento' },
    { id: 'show', label: 'Show' },
    { id: 'deadline', label: 'Prazo' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onSave({
            title: formData.get('title'),
            description: formData.get('description'),
            event_type: formData.get('event_type'),
            start_time: formData.get('start_time'),
            end_time: formData.get('end_time'),
            location: formData.get('location')
          });
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                name="title"
                type="text"
                required
                defaultValue={event?.title}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={event?.description}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <select
                name="event_type"
                defaultValue={event?.event_type || 'event'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              >
                {eventTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Início
                </label>
                <input
                  name="start_time"
                  type="time"
                  defaultValue={event?.start_time}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fim
                </label>
                <input
                  name="end_time"
                  type="time"
                  defaultValue={event?.end_time}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Local
              </label>
              <input
                name="location"
                type="text"
                defaultValue={event?.location}
                placeholder="Ex: Sala de Reunião, Teatro..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
              />
            </div>

            {date && !event && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-[#FF9B6A]">
                  Data: {date.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3 justify-between">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Excluir
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A] transition-colors"
              >
                {event ? 'Salvar' : 'Criar Evento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalendarView;
