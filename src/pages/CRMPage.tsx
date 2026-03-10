import React, { useState, useEffect } from 'react';
import {
  Plus, Search, MoreVertical, Phone, Mail, Building2,
  DollarSign, Calendar, Tag, Loader2, X, Edit2, Trash2,
  TrendingUp, Users, Target, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';

type Stage = 'novo' | 'contato' | 'demo_agendada' | 'proposta_enviada' | 'negociacao' | 'fechado_ganho' | 'fechado_perdido';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: string;
  stage: Stage;
  value: number;
  notes?: string;
  last_contact_at?: string;
  expected_close_date?: string;
  created_at: string;
}

const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: 'novo', label: 'Novo Lead', color: 'text-gray-600', bg: 'bg-gray-100' },
  { id: 'contato', label: 'Primeiro Contato', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'demo_agendada', label: 'Demo Agendada', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'proposta_enviada', label: 'Proposta Enviada', color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'negociacao', label: 'Negociação', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  { id: 'fechado_ganho', label: 'Fechado (Ganho)', color: 'text-green-700', bg: 'bg-green-50' },
  { id: 'fechado_perdido', label: 'Fechado (Perdido)', color: 'text-red-600', bg: 'bg-red-50' },
];

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  site: 'Site',
  indicacao: 'Indicação',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  google_ads: 'Google Ads',
  outro: 'Outro',
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  company: '',
  source: 'manual',
  stage: 'novo' as Stage,
  value: '',
  notes: '',
  expected_close_date: '',
};

export default function CRMPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeStageFilter, setActiveStageFilter] = useState<Stage | 'all'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!orgData) { setLoading(false); return; }
      setOrgId(orgData.organization_id);

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('organization_id', orgData.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingLead(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      source: lead.source,
      stage: lead.stage,
      value: String(lead.value || ''),
      notes: lead.notes || '',
      expected_close_date: lead.expected_close_date || '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!orgId) { toast.error('Organização não encontrada'); return; }

    try {
      setSaving(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        source: form.source,
        stage: form.stage,
        value: Number(form.value) || 0,
        notes: form.notes.trim() || null,
        expected_close_date: form.expected_close_date || null,
        organization_id: orgId,
      };

      if (editingLead) {
        const { error } = await supabase.from('leads').update(payload).eq('id', editingLead.id);
        if (error) throw error;
        toast.success('Lead atualizado');
      } else {
        const { error } = await supabase.from('leads').insert(payload);
        if (error) throw error;
        toast.success('Lead criado');
      }

      setShowModal(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar lead');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lead?')) return;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Lead excluído');
    loadData();
  }

  async function handleStageChange(leadId: string, stage: Stage) {
    const { error } = await supabase.from('leads').update({ stage, last_contact_at: new Date().toISOString() }).eq('id', leadId);
    if (error) { toast.error('Erro ao atualizar estágio'); return; }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage } : l));
  }

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      (l.company || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(search.toLowerCase());
    const matchStage = activeStageFilter === 'all' || l.stage === activeStageFilter;
    return matchSearch && matchStage;
  });

  const totalValue = leads.filter(l => l.stage === 'fechado_ganho').reduce((s, l) => s + l.value, 0);
  const pipelineValue = leads.filter(l => !['fechado_ganho', 'fechado_perdido'].includes(l.stage)).reduce((s, l) => s + l.value, 0);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFAD85] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CRM — Pipeline de Vendas</h2>
          <p className="text-gray-500 text-sm">{leads.length} leads no funil</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Novo Lead
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de Leads', value: leads.length, icon: Users, color: 'blue' },
          { label: 'Pipeline Ativo', value: formatCurrency(pipelineValue), icon: TrendingUp, color: 'purple' },
          { label: 'Receita Fechada', value: formatCurrency(totalValue), icon: DollarSign, color: 'green' },
          { label: 'Taxa de Conversão', value: `${leads.length ? Math.round(leads.filter(l => l.stage === 'fechado_ganho').length / leads.length * 100) : 0}%`, icon: Target, color: 'orange' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className={`inline-flex p-2 rounded-lg bg-${kpi.color}-50 mb-2`}>
                <Icon className={`w-4 h-4 text-${kpi.color}-600`} />
              </div>
              <p className="text-lg font-bold text-gray-900">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeStageFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            Todos
          </button>
          {STAGES.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveStageFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeStageFilter === s.id ? `${s.bg} ${s.color} border border-current` : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage.id);
            const stageValue = stageLeads.reduce((s, l) => s + l.value, 0);
            return (
              <div key={stage.id} className="w-64 flex-shrink-0">
                <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${stage.bg}`}>
                  <span className={`text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                  <span className={`text-xs font-bold ${stage.color} bg-white/60 rounded-full px-2 py-0.5`}>{stageLeads.length}</span>
                </div>
                {stageValue > 0 && (
                  <div className={`px-3 py-1 text-xs ${stage.color} ${stage.bg} border-t border-white/40`}>
                    {formatCurrency(stageValue)}
                  </div>
                )}
                <div className="bg-gray-100 rounded-b-lg p-2 space-y-2 min-h-[120px]">
                  {stageLeads.map(lead => (
                    <div key={lead.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{lead.name}</p>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button onClick={() => openEdit(lead)} className="p-1 text-gray-400 hover:text-gray-700">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(lead.id)} className="p-1 text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {lead.company && (
                        <div className="flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{lead.company}</span>
                        </div>
                      )}
                      {lead.value > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <DollarSign className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-medium text-green-700">{formatCurrency(lead.value)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-400">{SOURCE_LABELS[lead.source] || lead.source}</span>
                      </div>
                      {/* Move to next stage */}
                      {stage.id !== 'fechado_ganho' && stage.id !== 'fechado_perdido' && (
                        <div className="mt-2 pt-2 border-t border-gray-50 flex gap-1">
                          {STAGES.filter(s => s.id !== stage.id).slice(0, 2).map(s => (
                            <button
                              key={s.id}
                              onClick={() => handleStageChange(lead.id, s.id)}
                              title={`Mover para: ${s.label}`}
                              className={`flex-1 text-xs py-1 px-1.5 rounded ${s.bg} ${s.color} hover:opacity-80 transition-opacity truncate`}
                            >
                              {s.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-xs">Nenhum lead</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingLead ? 'Editar Lead' : 'Novo Lead'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome do contato"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                    placeholder="Nome da empresa"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                  <select
                    value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
                  >
                    {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estágio</label>
                  <select
                    value={form.stage}
                    onChange={e => setForm(f => ({ ...f, stage: e.target.value as Stage }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fechamento Prevista</label>
                <input
                  type="date"
                  value={form.expected_close_date}
                  onChange={e => setForm(f => ({ ...f, expected_close_date: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observações sobre o lead..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAD85]/30 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingLead ? 'Salvar Alterações' : 'Criar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
