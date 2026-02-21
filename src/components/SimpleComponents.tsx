import React, { useState, useEffect } from 'react';
import { MessageSquare, Calendar, Users, Megaphone, Video, Music, TrendingUp, BarChart, Map, FileText, Info, User, Settings, Plus, Clock, CheckCircle, AlertCircle, ExternalLink, Loader2, Lightbulb, Target, Eye, Zap, Shield, BookOpen } from 'lucide-react';
import AIMarketingAssistant from './AIMarketingAssistant';
import InviteManager from './InviteManager';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// ============================================================
// WhatsApp Manager - Gerenciamento de contatos e comunicação
// ============================================================
export const WhatsAppManager = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', group: '' });
  const [showForm, setShowForm] = useState(false);
  const [groups] = useState(['Equipe', 'Artistas', 'Fornecedores', 'Parceiros', 'Imprensa']);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data } = await supabase.from('whatsapp_contacts').select('*').order('name');
      setContacts(data || []);
    } catch { /* fallback to empty */ }
  };

  const addContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Preencha nome e telefone');
      return;
    }
    try {
      const { error } = await supabase.from('whatsapp_contacts').insert({
        name: newContact.name,
        phone: newContact.phone,
        group_name: newContact.group || 'Geral'
      });
      if (error) throw error;
      toast.success('Contato adicionado!');
      setNewContact({ name: '', phone: '', group: '' });
      setShowForm(false);
      loadContacts();
    } catch (err) {
      // Fallback: salvar localmente
      const local = JSON.parse(localStorage.getItem('tm_whatsapp_contacts') || '[]');
      local.push({ ...newContact, id: Date.now(), group_name: newContact.group || 'Geral' });
      localStorage.setItem('tm_whatsapp_contacts', JSON.stringify(local));
      setContacts(local);
      toast.success('Contato salvo localmente');
      setNewContact({ name: '', phone: '', group: '' });
      setShowForm(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-green-600" />
              WhatsApp Business
            </h2>
            <p className="text-gray-600 mt-1">Gerencie seus contatos e comunicação via WhatsApp</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus className="w-4 h-4" /> Novo Contato
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Adicionar Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} placeholder="Nome" className="px-4 py-2 border rounded-lg" />
              <input value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} placeholder="+55 11 99999-9999" className="px-4 py-2 border rounded-lg" />
              <select value={newContact.group} onChange={e => setNewContact({...newContact, group: e.target.value})} className="px-4 py-2 border rounded-lg">
                <option value="">Selecione grupo</option>
                {groups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={addContact} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <div key={group} className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" /> {group}
              </h3>
              <div className="space-y-2">
                {contacts.filter(c => (c.group_name || 'Geral') === group).map(contact => (
                  <div key={contact.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                      <p className="text-xs text-gray-500">{contact.phone}</p>
                    </div>
                    <button onClick={() => openWhatsApp(contact.phone)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Abrir WhatsApp">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {contacts.filter(c => (c.group_name || 'Geral') === group).length === 0 && (
                  <p className="text-sm text-gray-400 py-2">Nenhum contato</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Google Integration - Integração com Google Calendar e Drive
// ============================================================
export const GoogleIntegration = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_google_events') || '[]');
    setEvents(stored);
  }, []);

  const addEvent = () => {
    if (!newEvent.title || !newEvent.date) {
      toast.error('Preencha título e data');
      return;
    }
    const event = { ...newEvent, id: Date.now(), synced: false };
    const updated = [...events, event];
    setEvents(updated);
    localStorage.setItem('tm_google_events', JSON.stringify(updated));
    setNewEvent({ title: '', date: '', time: '', description: '' });
    setShowForm(false);
    toast.success('Evento adicionado ao calendário!');
  };

  const removeEvent = (id: number) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem('tm_google_events', JSON.stringify(updated));
    toast.success('Evento removido');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              Integração Google
            </h2>
            <p className="text-gray-600 mt-1">Gerencie eventos e sincronize com Google Calendar</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Novo Evento
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Sincronização com Google Calendar será ativada em breve. Por enquanto, gerencie seus eventos aqui.
          </p>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Novo Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Título do evento" className="px-4 py-2 border rounded-lg" />
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} placeholder="Descrição" className="px-4 py-2 border rounded-lg" />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={addEvent} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {events.sort((a, b) => a.date.localeCompare(b.date)).map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">{new Date(event.date + 'T00:00').toLocaleDateString('pt-BR')} {event.time && `às ${event.time}`}</p>
                  {event.description && <p className="text-xs text-gray-400 mt-1">{event.description}</p>}
                </div>
              </div>
              <button onClick={() => removeEvent(event.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg text-sm">Remover</button>
            </div>
          ))}
          {events.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum evento cadastrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Meetings Manager - Gerenciamento de Reuniões
// ============================================================
export const MeetingsManager = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState({ title: '', date: '', time: '', participants: '', notes: '', status: 'agendada' });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_meetings') || '[]');
    setMeetings(stored);
  }, []);

  const saveMeetings = (updated: any[]) => {
    setMeetings(updated);
    localStorage.setItem('tm_meetings', JSON.stringify(updated));
  };

  const addMeeting = () => {
    if (!newMeeting.title || !newMeeting.date) {
      toast.error('Preencha título e data');
      return;
    }
    const meeting = { ...newMeeting, id: Date.now() };
    saveMeetings([...meetings, meeting]);
    setNewMeeting({ title: '', date: '', time: '', participants: '', notes: '', status: 'agendada' });
    setShowForm(false);
    toast.success('Reunião agendada!');
  };

  const toggleStatus = (id: number) => {
    const updated = meetings.map(m => m.id === id ? { ...m, status: m.status === 'agendada' ? 'realizada' : 'agendada' } : m);
    saveMeetings(updated);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              Reuniões
            </h2>
            <p className="text-gray-600 mt-1">Agende e acompanhe suas reuniões</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <Plus className="w-4 h-4" /> Nova Reunião
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Agendar Reunião</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} placeholder="Título da reunião" className="px-4 py-2 border rounded-lg" />
              <input type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input value={newMeeting.participants} onChange={e => setNewMeeting({...newMeeting, participants: e.target.value})} placeholder="Participantes (separados por vírgula)" className="px-4 py-2 border rounded-lg" />
            </div>
            <textarea value={newMeeting.notes} onChange={e => setNewMeeting({...newMeeting, notes: e.target.value})} placeholder="Pauta / Notas" rows={3} className="w-full px-4 py-2 border rounded-lg mt-4" />
            <div className="mt-4 flex gap-2">
              <button onClick={addMeeting} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Agendar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.sort((a, b) => a.date.localeCompare(b.date)).map(meeting => (
            <div key={meeting.id} className={`bg-white rounded-lg shadow-sm p-5 border-l-4 ${meeting.status === 'realizada' ? 'border-green-500' : 'border-purple-500'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{meeting.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(meeting.date + 'T00:00').toLocaleDateString('pt-BR')} {meeting.time && `às ${meeting.time}`}
                  </p>
                  {meeting.participants && <p className="text-xs text-gray-400 mt-1">👥 {meeting.participants}</p>}
                  {meeting.notes && <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{meeting.notes}</p>}
                </div>
                <button onClick={() => toggleStatus(meeting.id)} className={`px-3 py-1 rounded-full text-xs font-medium ${meeting.status === 'realizada' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                  {meeting.status === 'realizada' ? '✓ Realizada' : '◉ Agendada'}
                </button>
              </div>
            </div>
          ))}
          {meetings.length === 0 && (
            <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma reunião agendada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Marketing Manager - Assistente de Marketing com IA
// ============================================================
export const MarketingManager = () => {
  const [artists, setArtists] = useState<any[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const { data, error } = await supabase.from('artists').select('*').order('name');
        if (error) throw error;
        setArtists(data || []);
        if (data && data.length > 0) setSelectedArtist(data[0]);
      } catch (error) {
        console.error('Erro ao carregar artistas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadArtists();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Megaphone className="w-8 h-8 text-pink-600" />
              Marketing & Estratégia
            </h2>
            <p className="text-gray-600 mt-1">Gere conteúdos e roteiros criativos com auxílio de IA.</p>
          </div>
          {artists.length > 0 && (
            <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase ml-2">Artista:</span>
              <select value={selectedArtist?.id || ''} onChange={(e) => setSelectedArtist(artists.find(a => a.id === e.target.value))} className="bg-transparent text-sm font-bold text-gray-900 focus:outline-none pr-8">
                {artists.map(artist => (<option key={artist.id} value={artist.id}>{artist.name}</option>))}
              </select>
            </div>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-pink-600" /></div>
        ) : selectedArtist ? (
          <AIMarketingAssistant artistName={selectedArtist.name} genre={selectedArtist.genre || 'Pop'} />
        ) : (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum artista encontrado</h3>
            <p className="text-gray-600">Cadastre um artista para usar o assistente de marketing.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Production Manager - Gerenciamento de Produção de Conteúdo
// ============================================================
export const ProductionManager = () => {
  const [productions, setProductions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newProd, setNewProd] = useState({ title: '', type: 'video', status: 'planejado', deadline: '', responsible: '', notes: '' });
  const types = [{ value: 'video', label: 'Vídeo' }, { value: 'audio', label: 'Áudio' }, { value: 'foto', label: 'Foto' }, { value: 'live', label: 'Live' }, { value: 'podcast', label: 'Podcast' }];
  const statuses = [{ value: 'planejado', label: 'Planejado', color: 'bg-blue-100 text-blue-700' }, { value: 'em_producao', label: 'Em Produção', color: 'bg-yellow-100 text-yellow-700' }, { value: 'revisao', label: 'Em Revisão', color: 'bg-purple-100 text-purple-700' }, { value: 'concluido', label: 'Concluído', color: 'bg-green-100 text-green-700' }];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_productions') || '[]');
    setProductions(stored);
  }, []);

  const save = (updated: any[]) => { setProductions(updated); localStorage.setItem('tm_productions', JSON.stringify(updated)); };

  const addProduction = () => {
    if (!newProd.title) { toast.error('Preencha o título'); return; }
    save([...productions, { ...newProd, id: Date.now() }]);
    setNewProd({ title: '', type: 'video', status: 'planejado', deadline: '', responsible: '', notes: '' });
    setShowForm(false);
    toast.success('Produção adicionada!');
  };

  const updateStatus = (id: number, status: string) => {
    save(productions.map(p => p.id === id ? { ...p, status } : p));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Video className="w-8 h-8 text-red-600" /> Produção de Conteúdo</h2>
            <p className="text-gray-600 mt-1">Gerencie a produção de vídeos, áudios e fotos</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Plus className="w-4 h-4" /> Nova Produção</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newProd.title} onChange={e => setNewProd({...newProd, title: e.target.value})} placeholder="Título da produção" className="px-4 py-2 border rounded-lg" />
              <select value={newProd.type} onChange={e => setNewProd({...newProd, type: e.target.value})} className="px-4 py-2 border rounded-lg">
                {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="date" value={newProd.deadline} onChange={e => setNewProd({...newProd, deadline: e.target.value})} className="px-4 py-2 border rounded-lg" />
              <input value={newProd.responsible} onChange={e => setNewProd({...newProd, responsible: e.target.value})} placeholder="Responsável" className="px-4 py-2 border rounded-lg" />
            </div>
            <textarea value={newProd.notes} onChange={e => setNewProd({...newProd, notes: e.target.value})} placeholder="Notas" rows={2} className="w-full px-4 py-2 border rounded-lg mt-4" />
            <div className="mt-4 flex gap-2">
              <button onClick={addProduction} className="px-4 py-2 bg-red-600 text-white rounded-lg">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statuses.map(s => (
            <div key={s.value} className="bg-white rounded-lg shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{productions.filter(p => p.status === s.value).length}</p>
              <p className={`text-sm font-medium px-2 py-1 rounded-full inline-block mt-1 ${s.color}`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {productions.map(prod => (
            <div key={prod.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  {prod.type === 'video' ? <Video className="w-5 h-5 text-red-600" /> : <Music className="w-5 h-5 text-red-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{prod.title}</p>
                  <p className="text-xs text-gray-500">{types.find(t => t.value === prod.type)?.label} {prod.deadline && `• Prazo: ${new Date(prod.deadline + 'T00:00').toLocaleDateString('pt-BR')}`} {prod.responsible && `• ${prod.responsible}`}</p>
                </div>
              </div>
              <select value={prod.status} onChange={e => updateStatus(prod.id, e.target.value)} className={`text-xs font-medium px-3 py-1 rounded-full border-0 ${statuses.find(s => s.value === prod.status)?.color}`}>
                {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          ))}
          {productions.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhuma produção cadastrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Pre-Production Manager
// ============================================================
export const PreProductionManager = () => {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', category: 'roteiro', status: 'pendente', notes: '' });
  const categories = ['roteiro', 'storyboard', 'locação', 'equipamento', 'elenco', 'orçamento'];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_preproduction') || '[]');
    setItems(stored);
  }, []);

  const save = (updated: any[]) => { setItems(updated); localStorage.setItem('tm_preproduction', JSON.stringify(updated)); };

  const addItem = () => {
    if (!newItem.title) { toast.error('Preencha o título'); return; }
    save([...items, { ...newItem, id: Date.now() }]);
    setNewItem({ title: '', category: 'roteiro', status: 'pendente', notes: '' });
    setShowForm(false);
    toast.success('Item adicionado!');
  };

  const toggleStatus = (id: number) => {
    save(items.map(i => i.id === id ? { ...i, status: i.status === 'pendente' ? 'concluido' : 'pendente' } : i));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Music className="w-8 h-8 text-orange-600" /> Pré-Produção</h2>
            <p className="text-gray-600 mt-1">Planejamento e preparação de projetos</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"><Plus className="w-4 h-4" /> Novo Item</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="Título" className="px-4 py-2 border rounded-lg" />
              <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="px-4 py-2 border rounded-lg">
                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <textarea value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} placeholder="Notas" rows={2} className="w-full px-4 py-2 border rounded-lg mt-4" />
            <div className="mt-4 flex gap-2">
              <button onClick={addItem} className="px-4 py-2 bg-orange-600 text-white rounded-lg">Salvar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-lg shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow ${item.status === 'concluido' ? 'opacity-60' : ''}`} onClick={() => toggleStatus(item.id)}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.status === 'concluido' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                {item.status === 'concluido' && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${item.status === 'concluido' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{item.title}</p>
                <p className="text-xs text-gray-500">{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</p>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
              <Music className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum item de pré-produção</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// AI Insights - Análises e Insights com IA
// ============================================================
export const AIInsights = () => {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('geral');

  const generateInsights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Você é um consultor de negócios musicais. Gere 5 insights práticos e acionáveis em português brasileiro. Retorne apenas os insights, um por linha, numerados.' },
            { role: 'user', content: `Gere 5 insights sobre ${topic === 'geral' ? 'gestão de carreira musical' : topic} para um artista/produtor musical independente.` }
          ]
        })
      });
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      setInsights(text.split('\n').filter((l: string) => l.trim()));
    } catch {
      toast.error('Erro ao gerar insights. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2"><TrendingUp className="w-8 h-8 text-cyan-600" /> Insights com IA</h2>
        <p className="text-gray-600 mb-6">Análises e recomendações geradas por inteligência artificial</p>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <select value={topic} onChange={e => setTopic(e.target.value)} className="flex-1 px-4 py-2 border rounded-lg">
              <option value="geral">Gestão de Carreira</option>
              <option value="marketing digital para músicos">Marketing Digital</option>
              <option value="monetização e receita para artistas">Monetização</option>
              <option value="produção musical e lançamentos">Produção Musical</option>
              <option value="shows e turnês">Shows e Turnês</option>
              <option value="redes sociais para artistas">Redes Sociais</option>
            </select>
            <button onClick={generateInsights} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
              {loading ? 'Gerando...' : 'Gerar Insights'}
            </button>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4 text-cyan-600" />
                </div>
                <p className="text-gray-800">{insight}</p>
              </div>
            ))}
          </div>
        )}

        {insights.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Clique em "Gerar Insights" para receber recomendações personalizadas</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Mind Map - Mapa Mental de Ideias
// ============================================================
export const MindMap = () => {
  const [nodes, setNodes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newNode, setNewNode] = useState({ title: '', parent: '', color: '#FFAD85' });
  const colors = ['#FFAD85', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_mindmap') || '[]');
    setNodes(stored);
  }, []);

  const save = (updated: any[]) => { setNodes(updated); localStorage.setItem('tm_mindmap', JSON.stringify(updated)); };

  const addNode = () => {
    if (!newNode.title) { toast.error('Preencha o título'); return; }
    save([...nodes, { ...newNode, id: Date.now() }]);
    setNewNode({ title: '', parent: '', color: '#FFAD85' });
    setShowForm(false);
    toast.success('Ideia adicionada!');
  };

  const removeNode = (id: number) => {
    save(nodes.filter(n => n.id !== id));
  };

  const rootNodes = nodes.filter(n => !n.parent);
  const getChildren = (parentTitle: string) => nodes.filter(n => n.parent === parentTitle);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Map className="w-8 h-8 text-purple-600" /> Mapa Mental</h2>
            <p className="text-gray-600 mt-1">Organize suas ideias e conexões de projetos</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="w-4 h-4" /> Nova Ideia</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={newNode.title} onChange={e => setNewNode({...newNode, title: e.target.value})} placeholder="Título da ideia" className="px-4 py-2 border rounded-lg" />
              <select value={newNode.parent} onChange={e => setNewNode({...newNode, parent: e.target.value})} className="px-4 py-2 border rounded-lg">
                <option value="">Ideia principal (raiz)</option>
                {nodes.map(n => <option key={n.id} value={n.title}>{n.title}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Cor:</span>
                {colors.map(c => (
                  <button key={c} onClick={() => setNewNode({...newNode, color: c})} className={`w-6 h-6 rounded-full ${newNode.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={addNode} className="px-4 py-2 bg-purple-600 text-white rounded-lg">Adicionar</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-6 justify-center">
          {rootNodes.map(node => (
            <div key={node.id} className="relative">
              <div className="bg-white rounded-2xl shadow-md p-5 min-w-[200px] text-center border-t-4" style={{ borderColor: node.color }}>
                <p className="font-bold text-gray-900">{node.title}</p>
                <button onClick={() => removeNode(node.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">×</button>
              </div>
              {getChildren(node.title).length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4 pl-4">
                  {getChildren(node.title).map(child => (
                    <div key={child.id} className="relative bg-white rounded-xl shadow-sm p-3 min-w-[150px] text-center border-l-4" style={{ borderColor: child.color }}>
                      <p className="text-sm text-gray-800">{child.title}</p>
                      <button onClick={() => removeNode(child.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {nodes.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center w-full">
              <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Adicione ideias para começar seu mapa mental</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// User Management - Gerenciamento de Usuários com InviteManager
// ============================================================
export const UserManagement = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#FFAD85]" />
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-600 mt-1">Controle quem tem acesso à sua plataforma e gerencie convites.</p>
        </div>
        <InviteManager />
      </div>
    </div>
  );
};

// ============================================================
// User Preferences - Configurações do Usuário
// ============================================================
export const UserPreferences = () => {
  const [prefs, setPrefs] = useState({
    language: 'pt',
    theme: 'light',
    notifications_email: true,
    notifications_push: true,
    notifications_whatsapp: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'BRL'
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('tm_preferences') || 'null');
    if (stored) setPrefs(stored);
  }, []);

  const savePrefs = (updated: typeof prefs) => {
    setPrefs(updated);
    localStorage.setItem('tm_preferences', JSON.stringify(updated));
    toast.success('Preferências salvas!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6"><Settings className="w-8 h-8 text-gray-600" /> Preferências</h2>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Geral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                <select value={prefs.language} onChange={e => savePrefs({...prefs, language: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moeda</label>
                <select value={prefs.currency} onChange={e => savePrefs({...prefs, currency: e.target.value})} className="w-full px-4 py-2 border rounded-lg">
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar (US$)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Notificações</h3>
            <div className="space-y-3">
              {[
                { key: 'notifications_email', label: 'Notificações por E-mail' },
                { key: 'notifications_push', label: 'Notificações Push' },
                { key: 'notifications_whatsapp', label: 'Notificações por WhatsApp' }
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between py-2">
                  <span className="text-gray-700">{item.label}</span>
                  <input type="checkbox" checked={(prefs as any)[item.key]} onChange={e => savePrefs({...prefs, [item.key]: e.target.checked})} className="w-5 h-5 text-[#FFAD85] rounded" />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// User Role Features - Funcionalidades por Perfil
// ============================================================
export const UserRoleFeatures = () => {
  const plans = [
    { name: 'Starter', price: '$49/mês', features: ['5 projetos', '3 artistas', 'Tarefas ilimitadas', 'Copilot básico', 'Relatórios mensais', 'Suporte por email'], color: 'border-blue-500', bg: 'bg-blue-50' },
    { name: 'Pro', price: '$80/mês', features: ['20 projetos', '10 artistas', 'Tarefas ilimitadas', 'Copilot avançado', 'Marketing IA', 'Relatórios semanais', 'Suporte prioritário', '5 membros de equipe'], color: 'border-[#FFAD85]', bg: 'bg-orange-50', popular: true },
    { name: 'Professional', price: '$99/mês', features: ['Projetos ilimitados', 'Artistas ilimitados', 'Todas as funcionalidades', 'Copilot premium', 'Marketing IA avançado', 'Relatórios em tempo real', 'Suporte 24/7', 'Equipe ilimitada', 'Consultoria mensal'], color: 'border-purple-500', bg: 'bg-purple-50' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-2"><Target className="w-8 h-8 text-[#FFAD85]" /> Planos e Funcionalidades</h2>
        <p className="text-gray-600 mb-8">Conheça os recursos disponíveis em cada plano</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.name} className={`bg-white rounded-xl shadow-sm p-6 border-t-4 ${plan.color} relative`}>
              {plan.popular && <span className="absolute -top-3 right-4 bg-[#FFAD85] text-white text-xs px-3 py-1 rounded-full font-semibold">Popular</span>}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Presentation - Modo de Apresentação
// ============================================================
export const Presentation = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6"><Eye className="w-8 h-8 text-orange-600" /> Modo Apresentação</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] p-12 text-center text-white">
            <h1 className="text-4xl font-bold mb-4">TaskMaster</h1>
            <p className="text-xl opacity-90">Plataforma Completa de Gestão Musical Profissional</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: <Zap className="w-6 h-6" />, title: 'Gestão Inteligente', desc: 'Gerencie projetos, artistas e shows com IA integrada' },
                { icon: <Target className="w-6 h-6" />, title: 'Marketing com IA', desc: 'Gere conteúdos e estratégias automaticamente' },
                { icon: <Users className="w-6 h-6" />, title: 'Equipe Colaborativa', desc: 'Trabalhe em equipe com controle de acesso' },
                { icon: <BarChart className="w-6 h-6" />, title: 'Relatórios Completos', desc: 'Acompanhe KPIs e métricas em tempo real' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-[#FFF0E6] rounded-lg flex items-center justify-center text-[#FFAD85]">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// About - Sobre o TaskMaster
// ============================================================
export const About = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6"><Info className="w-8 h-8 text-gray-600" /> Sobre o TaskMaster</h2>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">TaskMaster</h3>
            <p className="text-gray-600 mt-1">Versão 1.0.0</p>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Sobre a Plataforma</h4>
              <p className="text-gray-600">O TaskMaster é uma plataforma completa de gestão musical profissional, desenvolvida com a metodologia dos 4 Pilares de Marcos Menezes. Combinamos tecnologia de ponta com inteligência artificial para ajudar artistas, produtores e escritórios a gerenciar suas carreiras de forma eficiente.</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Metodologia 4 Pilares</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: 'Conteúdo', desc: 'Gestão de ativos, música e presença digital' },
                  { title: 'Shows & Vendas', desc: 'Estratégia de booking e comercialização' },
                  { title: 'Logística', desc: 'Operação de turnê, equipe e deslocamento' },
                  { title: 'Estratégia', desc: 'Posicionamento, marketing e carreira' }
                ].map(pillar => (
                  <div key={pillar.title} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-900 text-sm">{pillar.title}</p>
                    <p className="text-xs text-gray-500">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Contato</h4>
              <p className="text-gray-600 text-sm">Email: <a href="mailto:contact@taskmaster.works" className="text-[#FFAD85] hover:underline">contact@taskmaster.works</a></p>
              <p className="text-gray-600 text-sm">Website: <a href="https://taskmaster.works" className="text-[#FFAD85] hover:underline">taskmaster.works</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Schedule (kept as alias for CalendarView)
// ============================================================
export const Schedule = () => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-6"><Calendar className="w-8 h-8 text-[#FFAD85]" /> Agenda</h2>
        <p className="text-gray-600">Use o menu "Agenda" na sidebar para acessar o calendário completo.</p>
      </div>
    </div>
  );
};

// ============================================================
// Validators (kept for system use)
// ============================================================
export const FunctionalityValidator = () => (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-4"><Shield className="w-8 h-8 text-green-600" /> Validador de Funcionalidades</h2>
      <p className="text-gray-600">Ferramenta de validação de funcionalidades do sistema.</p>
    </div>
  </div>
);

export const SystemValidator = () => (
  <div className="p-6 bg-gray-50 min-h-screen">
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-4"><Settings className="w-8 h-8 text-red-600" /> Validador de Sistema</h2>
      <p className="text-gray-600">Ferramenta de validação de integridade do sistema.</p>
    </div>
  </div>
);

// ============================================================
// Form Components (kept as-is)
// ============================================================
export const ProjectForm = ({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
      <h3 className="text-xl font-bold mb-4">Novo Projeto</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          name: formData.get('name'),
          description: formData.get('description'),
          project_type: formData.get('project_type') || 'artist_management'
        });
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto</label>
            <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]">Criar</button>
        </div>
      </form>
    </div>
  );
};

export const ArtistForm = ({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) => {
  return (
    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6">
      <h3 className="text-xl font-bold mb-4">Novo Artista</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const genre = formData.get('genre') === 'Outro' ? formData.get('genreOther') : formData.get('genre');
        onSubmit({
          name: formData.get('name'),
          artistic_name: formData.get('artisticName'),
          genre: genre || 'Pop'
        });
      }}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
            <input name="name" type="text" required className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Artístico</label>
            <input name="artisticName" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gênero Musical</label>
            <select name="genre" className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              onChange={(e) => {
                const select = e.target;
                const otherInput = select.parentElement?.querySelector('[name="genreOther"]') as HTMLInputElement;
                if (otherInput) {
                  otherInput.style.display = select.value === 'Outro' ? 'block' : 'none';
                  if (select.value !== 'Outro') otherInput.value = '';
                }
              }}>
              <option value="">Selecione um gênero</option>
              <option>Pop</option><option>Rock</option><option>Hip Hop</option><option>MPB</option>
              <option>Sertanejo</option><option>Samba</option><option>Pagode</option><option>Funk</option>
              <option>Eletrônica</option><option>Jazz</option><option>Blues</option><option>Reggae</option>
              <option>Country</option><option>Gospel</option><option>Forró</option><option>Bossa Nova</option>
              <option>Rap</option><option>Trap</option><option>R&B</option><option>Soul</option>
              <option>Indie</option><option>Metal</option><option>Punk</option><option>Folk</option>
              <option>Clássica</option><option>Outro</option>
            </select>
            <input name="genreOther" type="text" placeholder="Especifique o gênero..." className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2" style={{ display: 'none' }} />
          </div>
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg hover:bg-[#FF9B6A]">Criar</button>
        </div>
      </form>
    </div>
  );
};
