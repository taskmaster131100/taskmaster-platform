import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Plus,
  Download, X, FileText, Share2,
  Sparkles, Loader2, Copy, ChevronDown, ChevronRight, Trash2, Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';
import { analyzeFinances } from '../services/aiMarketingService';

const CATEGORY_LABELS: Record<string, string> = {
  shows: 'Shows e Eventos', streaming: 'Streaming/Royalties', licensing: 'Licenciamento',
  merchandising: 'Merchandising', sponsorship: 'Patrocínios', other_revenue: 'Outras Receitas',
  production: 'Produção Musical', marketing: 'Marketing', audiovisual: 'Audiovisual',
  logistics: 'Logística', team: 'Equipe', distribution: 'Distribuição',
  legal: 'Jurídico', equipment: 'Equipamentos', other_expense: 'Outras Despesas',
  Show: 'Show', Streaming: 'Streaming', 'Direitos Autorais': 'Direitos Autorais',
  Marketing: 'Marketing', Produção: 'Produção', Equipamento: 'Equipamento',
  Transporte: 'Transporte', Hospedagem: 'Hospedagem', Alimentação: 'Alimentação', Outros: 'Outros',
};

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface Budget {
  id: string;
  name: string;
  description: string;
  total_amount: number;
  spent_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active' | 'completed';
  project_id?: string;
  items: BudgetItem[];
}

interface BudgetItem {
  id: string;
  budget_id: string;
  category: string;
  description: string;
  planned_amount: number;
  actual_amount: number;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string;
  paid_date?: string;
  notes?: string;
}

interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'revenue' | 'expense';
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  transaction_date: string;
  created_at: string;
}

export default function FinancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'transactions' | 'reports'>('overview');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState('Todos os Artistas');
  const [orgId, setOrgId] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ description: '', category: 'Show', amount: 0, type: 'revenue' as 'revenue' | 'expense', artist_id: '' });
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzingFinances, setAnalyzingFinances] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'revenue' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Relatório mensal
  const now = new Date();
  const [reportMonth, setReportMonth] = useState(now.getMonth()); // 0-indexed
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportArtistId, setReportArtistId] = useState('');
  const [reportArtists, setReportArtists] = useState<{ id: string; name: string; stage_name?: string }[]>([]);
  const [reportData, setReportData] = useState<{
    revenues: Transaction[];
    expenses: Transaction[];
    shows: { title: string; deal_value: number; show_date: string }[];
  } | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFinanceData();
      supabase.from('artists').select('id, name, stage_name').order('name').then(({ data }) => setReportArtists(data || []));
    }
  }, [user]);

  const loadFinanceData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Resolve organization_id do usuário — limit(1) evita erro com múltiplas orgs
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const resolvedOrgId = orgData?.organization_id || null;
      setOrgId(resolvedOrgId);

      // Query por org_id quando disponível, fallback para user_id para dados legados
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (resolvedOrgId) {
        query = query.or(`organization_id.eq.${resolvedOrgId},and(organization_id.is.null,user_id.eq.${user.id})`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTransactions((data || []).map((t: any) => ({
        id: t.id,
        description: t.description,
        category: t.category,
        amount: Number(t.amount),
        type: t.type,
        status: t.status || 'paid',
        transaction_date: t.transaction_date,
        created_at: t.created_at
      })));
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar transações financeiras');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) {
      toast.error('Preencha descrição e valor');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert({
          user_id: user?.id,
          organization_id: orgId,
          description: newTransaction.description,
          category: newTransaction.category,
          amount: newTransaction.amount,
          type: newTransaction.type,
          status: 'paid',
          transaction_date: new Date().toISOString().split('T')[0],
          ...(newTransaction.artist_id ? { artist_id: newTransaction.artist_id } : {})
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setTransactions([{
          id: data.id,
          description: data.description,
          category: data.category,
          amount: Number(data.amount),
          type: data.type,
          status: data.status,
          transaction_date: data.transaction_date,
          created_at: data.created_at
        }, ...transactions]);
      }
      setShowAddModal(false);
      setNewTransaction({ description: '', category: 'Show', amount: 0, type: 'revenue', artist_id: '' });
      toast.success('Transação adicionada!');
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao salvar. Tente novamente.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Deletar esta transação? Esta ação não pode ser desfeita.')) return;
    try {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transação deletada.');
    } catch (error: any) {
      console.error('Erro ao deletar transação:', error);
      toast.error(error?.message || 'Erro ao deletar. Tente novamente.');
    }
  };

  const handleGenerateArtistReport = async () => {
    setReportLoading(true);
    setShowReportModal(true);
    try {
      const startDate = `${reportYear}-${String(reportMonth + 1).padStart(2, '0')}-01`;
      const endDate = new Date(reportYear, reportMonth + 1, 0).toISOString().split('T')[0];

      // Transações do mês
      const monthTx = transactions.filter(t => t.transaction_date >= startDate && t.transaction_date <= endDate);

      // Shows do artista selecionado no mês
      let shows: { title: string; deal_value: number; show_date: string }[] = [];
      if (reportArtistId) {
        const artistObj = reportArtists.find(a => a.id === reportArtistId);
        const artistName = artistObj?.name;
        if (artistName) {
          const { data: showsData } = await supabase
            .from('shows')
            .select('title, deal_value, show_date')
            .eq('artist_id', reportArtistId)
            .gte('show_date', startDate)
            .lte('show_date', endDate)
            .order('show_date');
          shows = (showsData || []).map((s: any) => ({
            title: s.title,
            deal_value: Number(s.deal_value || 0),
            show_date: s.show_date,
          }));
        }
      }

      setReportData({
        revenues: monthTx.filter(t => t.type === 'revenue'),
        expenses: monthTx.filter(t => t.type === 'expense'),
        shows,
      });
    } catch (e) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setReportLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    setAnalyzingFinances(true);
    try {
      const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const result = await analyzeFinances(transactions, {
        totalRevenue,
        totalExpenses,
        balance: totalRevenue - totalExpenses
      });
      setAiAnalysis(result);
    } catch (error) {
      toast.error('Erro ao gerar análise. Tente novamente.');
    } finally {
      setAnalyzingFinances(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterDateFrom && t.transaction_date < filterDateFrom) return false;
      if (filterDateTo && t.transaction_date > filterDateTo) return false;
      return true;
    });
  }, [transactions, filterType, filterCategory, filterDateFrom, filterDateTo]);

  // Monthly evolution chart data (last 6 months)
  const monthlyChartData = useMemo(() => {
    const months: Record<string, { mes: string; Receitas: number; Despesas: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      months[key] = { mes: label, Receitas: 0, Despesas: 0 };
    }
    transactions.forEach(t => {
      const key = t.transaction_date?.substring(0, 7);
      if (key && months[key]) {
        if (t.type === 'revenue') months[key].Receitas += Number(t.amount);
        else months[key].Despesas += Number(t.amount);
      }
    });
    return Object.values(months);
  }, [transactions]);

  // Profit margin
  const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  // Unique categories for filter
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category))).filter(Boolean).sort();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro 360°</h1>
          <p className="text-gray-600 mt-1">Gestão de lucros, despesas e prestação de contas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-medium"
          >
            <FileText className="w-5 h-5 text-[#FFAD85]" />
            Relatório Mensal
          </button>
          <button 
            onClick={handleAIAnalysis}
            disabled={analyzingFinances}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center gap-2 hover:bg-purple-700 font-bold disabled:opacity-50"
          >
            {analyzingFinances ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Análise IA
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg flex items-center gap-2 hover:bg-[#FF9B6A] font-bold"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <span className="text-sm text-gray-500 font-medium">Receita Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <span className="text-sm text-gray-500 font-medium">Despesas Totais</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#FFAD85] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg"><DollarSign className="w-5 h-5 text-orange-600" /></div>
              <span className="text-sm text-gray-500 font-medium">Lucro Líquido</span>
            </div>
            {totalRevenue > 0 && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${profitMargin >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {profitMargin.toFixed(1)}% margem
              </span>
            )}
          </div>
          <p className={`text-2xl font-bold ${totalRevenue - totalExpenses >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
            R$ {(totalRevenue - totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Gráfico de Evolução Mensal */}
      {monthlyChartData.some(d => d.Receitas > 0 || d.Despesas > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Evolução dos últimos 6 meses</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend />
              <Bar dataKey="Receitas" fill="#22c55e" radius={[4,4,0,0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Análise IA */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Análise Financeira {reportArtists.length > 0 ? `de ${reportArtists[0].stage_name || reportArtists[0].name}` : 'da Plataforma'}
            </h3>
            <button onClick={() => setAiAnalysis(null)} className="text-purple-400 hover:text-purple-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-purple-800 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</div>
        </div>
      )}

      {/* Tabela de Transações Recentes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">Transações</h3>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${showFilters ? 'bg-[#FFAD85] text-white border-[#FFAD85]' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              Filtros {(filterType !== 'all' || filterCategory || filterDateFrom || filterDateTo) && '●'}
            </button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent">
                <option value="all">Tipo: Todos</option>
                <option value="revenue">Receitas</option>
                <option value="expense">Despesas</option>
              </select>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent">
                <option value="">Categoria: Todas</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
              </select>
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent" placeholder="De" />
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent" placeholder="Até" />
            </div>
          )}
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
            <tr>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3 text-right">Valor</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 font-medium">{t.description}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{CATEGORY_LABELS[t.category] || t.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.transaction_date}</td>
                <td className={`px-6 py-4 text-right font-bold ${t.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'revenue' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteTransaction(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all rounded"
                    title="Deletar transação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Relatório Mensal */}
      {showReportModal && (() => {
        const artistObj = reportArtists.find(a => a.id === reportArtistId);
        const artistLabel = artistObj ? (artistObj.stage_name || artistObj.name) : 'Todos os Artistas';
        const totalRevenue = (reportData?.revenues || []).reduce((s, t) => s + t.amount, 0);
        const totalExpenses = (reportData?.expenses || []).reduce((s, t) => s + t.amount, 0);
        const totalShows = (reportData?.shows || []).reduce((s, sh) => s + sh.deal_value, 0);
        const saldo = totalRevenue + totalShows - totalExpenses;

        // Agrupar receitas por categoria
        const revByCategory: Record<string, number> = {};
        (reportData?.revenues || []).forEach(t => {
          const cat = CATEGORY_LABELS[t.category] || t.category;
          revByCategory[cat] = (revByCategory[cat] || 0) + t.amount;
        });
        const expByCategory: Record<string, number> = {};
        (reportData?.expenses || []).forEach(t => {
          const cat = CATEGORY_LABELS[t.category] || t.category;
          expByCategory[cat] = (expByCategory[cat] || 0) + t.amount;
        });

        const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        const handleCopy = () => {
          const lines = [
            `📊 RELATÓRIO FINANCEIRO — ${MONTHS[reportMonth]}/${reportYear}`,
            `Artista: ${artistLabel}`,
            ``,
            `✅ ENTRADAS`,
            ...Object.entries(revByCategory).map(([c, v]) => `  ${c}: ${fmt(v)}`),
            ...(reportData?.shows?.length ? [`  Shows: ${fmt(totalShows)}`] : []),
            `  TOTAL: ${fmt(totalRevenue + totalShows)}`,
            ``,
            `❌ SAÍDAS`,
            ...Object.entries(expByCategory).map(([c, v]) => `  ${c}: ${fmt(v)}`),
            `  TOTAL: ${fmt(totalExpenses)}`,
            ``,
            `💰 SALDO: ${fmt(saldo)}`,
          ];
          navigator.clipboard.writeText(lines.join('\n'));
          toast.success('Relatório copiado!');
        };

        return (
          <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl my-8">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-2xl">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Relatório Mensal</h2>
                  <p className="text-sm text-gray-500">Entradas, saídas e saldo por período</p>
                </div>
                <button onClick={() => { setShowReportModal(false); setReportData(null); }} className="p-2 hover:bg-gray-200 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Filtros */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mês</label>
                    <select
                      value={reportMonth}
                      onChange={e => { setReportMonth(Number(e.target.value)); setReportData(null); }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200"
                    >
                      {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ano</label>
                    <select
                      value={reportYear}
                      onChange={e => { setReportYear(Number(e.target.value)); setReportData(null); }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200"
                    >
                      {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Artista</label>
                    <select
                      value={reportArtistId}
                      onChange={e => { setReportArtistId(e.target.value); setReportData(null); }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">Todos</option>
                      {reportArtists.map(a => (
                        <option key={a.id} value={a.id}>{a.stage_name || a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGenerateArtistReport}
                  disabled={reportLoading}
                  className="mt-3 w-full py-2.5 bg-[#FFAD85] text-white font-bold rounded-xl hover:bg-[#FF9B6A] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {reportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {reportLoading ? 'Gerando...' : 'Gerar Relatório'}
                </button>
              </div>

              {/* Resultado */}
              {reportData && !reportLoading && (
                <div className="px-6 py-5 space-y-5">
                  {/* Título do período */}
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">{MONTHS[reportMonth]} {reportYear} — {artistLabel}</p>
                  </div>

                  {/* Cards resumo */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-green-600 uppercase mb-1">Entradas</p>
                      <p className="text-lg font-bold text-green-700">{fmt(totalRevenue + totalShows)}</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                      <p className="text-xs font-bold text-red-500 uppercase mb-1">Saídas</p>
                      <p className="text-lg font-bold text-red-600">{fmt(totalExpenses)}</p>
                    </div>
                    <div className={`border rounded-xl p-3 text-center ${saldo >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                      <p className={`text-xs font-bold uppercase mb-1 ${saldo >= 0 ? 'text-blue-600' : 'text-red-500'}`}>Saldo</p>
                      <p className={`text-lg font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{fmt(saldo)}</p>
                    </div>
                  </div>

                  {/* Shows do artista no mês */}
                  {reportData.shows.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Shows no período</p>
                      <div className="space-y-1">
                        {reportData.shows.map((sh, i) => (
                          <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50">
                            <span className="text-gray-700 truncate flex-1">{sh.title}</span>
                            <span className="text-xs text-gray-400 mx-2">{new Date(sh.show_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                            <span className="font-bold text-green-600">{fmt(sh.deal_value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Receitas por categoria */}
                  {Object.keys(revByCategory).length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Receitas por categoria</p>
                      <div className="space-y-1">
                        {Object.entries(revByCategory).map(([cat, val]) => (
                          <div key={cat} className="flex justify-between text-sm py-1 border-b border-gray-50">
                            <span className="text-gray-600">{cat}</span>
                            <span className="font-semibold text-green-600">{fmt(val)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-1">
                          <span className="font-bold text-gray-800">Total Receitas</span>
                          <span className="font-bold text-green-700">{fmt(totalRevenue)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Despesas por categoria */}
                  {Object.keys(expByCategory).length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Despesas por categoria</p>
                      <div className="space-y-1">
                        {Object.entries(expByCategory).map(([cat, val]) => (
                          <div key={cat} className="flex justify-between text-sm py-1 border-b border-gray-50">
                            <span className="text-gray-600">{cat}</span>
                            <span className="font-semibold text-red-500">{fmt(val)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm pt-1">
                          <span className="font-bold text-gray-800">Total Despesas</span>
                          <span className="font-bold text-red-600">{fmt(totalExpenses)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportData.revenues.length === 0 && reportData.expenses.length === 0 && reportData.shows.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">Nenhuma movimentação em {MONTHS[reportMonth]}/{reportYear}.</p>
                  )}

                  {/* Ações */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition-all"
                    >
                      <Copy className="w-4 h-4" /> Copiar (WhatsApp)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 py-3 bg-[#FFAD85] text-white rounded-xl font-bold hover:bg-[#FF9B6A] flex items-center justify-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" /> Imprimir / PDF
                    </button>
                  </div>
                </div>
              )}

              {!reportData && !reportLoading && (
                <div className="px-6 py-10 text-center text-sm text-gray-400">
                  Selecione o período e clique em <strong>Gerar Relatório</strong>.
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal Nova Transação */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Nova Transação</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNewTransaction({...newTransaction, type: 'revenue'})}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm ${newTransaction.type === 'revenue' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 text-gray-600'}`}
                  >Receita</button>
                  <button
                    onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm ${newTransaction.type === 'expense' ? 'bg-red-100 text-red-700 border-2 border-red-500' : 'bg-gray-100 text-gray-600'}`}
                  >Despesa</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="Ex: Cachê Show SP"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                >
                  <option value="Show">Show</option>
                  <option value="Streaming">Streaming</option>
                  <option value="Direitos Autorais">Direitos Autorais</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Produção">Produção</option>
                  <option value="Equipamento">Equipamento</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Hospedagem">Hospedagem</option>
                  <option value="Alimentação">Alimentação</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  value={newTransaction.amount || ''}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                />
              </div>
              {reportArtists.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Artista (opcional)</label>
                  <select
                    value={newTransaction.artist_id}
                    onChange={(e) => setNewTransaction({...newTransaction, artist_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
                  >
                    <option value="">Nenhum</option>
                    {reportArtists.map(a => <option key={a.id} value={a.id}>{a.stage_name || a.name}</option>)}
                  </select>
                </div>
              )}
              <button
                onClick={handleAddTransaction}
                className="w-full py-3 bg-[#FFAD85] text-white rounded-xl font-bold text-lg hover:bg-[#FF9B6A] mt-4"
              >
                Salvar Transação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
