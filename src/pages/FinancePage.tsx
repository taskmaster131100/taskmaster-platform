import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart, Plus, 
  Filter, Download, Calendar, MoreVertical, Edit2, Trash2,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle, Clock, X, FileText, Share2,
  Sparkles, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';
import { analyzeFinances } from '../services/aiMarketingService';

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ description: '', category: 'Show', amount: 0, type: 'revenue' as 'revenue' | 'expense' });
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzingFinances, setAnalyzingFinances] = useState(false);

  useEffect(() => {
    loadFinanceData();
  }, [user]);

  const loadFinanceData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setTransactions(data.map((t: any) => ({
          id: t.id,
          description: t.description,
          category: t.category,
          amount: Number(t.amount),
          type: t.type,
          status: t.status || 'paid',
          transaction_date: t.transaction_date,
          created_at: t.created_at
        })));
      } else {
        setTransactions([
          { id: '1', description: 'Cachê Show SP (exemplo)', category: 'Show', amount: 25000, type: 'revenue', status: 'paid', transaction_date: '2025-01-10', created_at: '2025-01-10' },
          { id: '2', description: 'Anúncios Meta (exemplo)', category: 'Marketing', amount: 3500, type: 'expense', status: 'paid', transaction_date: '2025-01-15', created_at: '2025-01-15' }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      setTransactions([
        { id: '1', description: 'Cachê Show SP (exemplo)', category: 'Show', amount: 25000, type: 'revenue', status: 'paid', transaction_date: '2025-01-10', created_at: '2025-01-10' },
        { id: '2', description: 'Anúncios Meta (exemplo)', category: 'Marketing', amount: 3500, type: 'expense', status: 'paid', transaction_date: '2025-01-15', created_at: '2025-01-15' }
      ]);
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
          description: newTransaction.description,
          category: newTransaction.category,
          amount: newTransaction.amount,
          type: newTransaction.type,
          status: 'paid',
          transaction_date: new Date().toISOString().split('T')[0]
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
      setNewTransaction({ description: '', category: 'Show', amount: 0, type: 'revenue' });
      toast.success('Transação adicionada!');
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      toast.error('Erro ao salvar. Tente novamente.');
    }
  };

  const handleGenerateArtistReport = () => {
    toast.success(`Relatório de Prestação de Contas gerado para ${selectedArtist}`);
    setShowReportModal(true);
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financeiro 360°</h1>
          <p className="text-gray-600 mt-1">Gestão de lucros, despesas e prestação de contas</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateArtistReport}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 font-medium"
          >
            <FileText className="w-5 h-5 text-[#FFAD85]" />
            Relatório para Artista
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
          <p className="text-2xl font-bold text-gray-900">R$ {transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <span className="text-sm text-gray-500 font-medium">Despesas Totais</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">R$ {transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#FFAD85] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg"><DollarSign className="w-5 h-5 text-orange-600" /></div>
            <span className="text-sm text-gray-500 font-medium">Lucro Líquido</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">R$ {(transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0) - transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Análise IA */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Análise Financeira do Marcos
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
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-lg">Transações Recentes</h3>
          <button className="text-sm text-[#FFAD85] font-bold hover:underline">Ver todas</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
            <tr>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">{t.description}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.transaction_date}</td>
                <td className={`px-6 py-4 text-right font-bold ${t.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'revenue' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Relatório para o Artista */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Prestação de Contas: {selectedArtist}</h2>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>
            
            <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">Total Bruto (Receitas)</span>
                <span className="font-bold text-green-600">R$ {transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">Total Despesas (Produção/Logística)</span>
                <span className="font-bold text-red-600">- R$ {transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">Comissão Escritório (20%)</span>
                <span className="font-bold text-orange-600">- R$ {(transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0) * 0.20).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-xl font-bold">Saldo Líquido Artista</span>
                <span className="text-xl font-bold text-blue-600">R$ {(transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0) - transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) - transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0) * 0.20).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 py-4 bg-[#FFAD85] text-white rounded-xl font-bold text-lg hover:bg-[#FF9B6A] flex items-center justify-center gap-2">
                <Download className="w-6 h-6" /> Baixar PDF
              </button>
              <button className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 flex items-center justify-center gap-2">
                <Share2 className="w-6 h-6" /> Enviar WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

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
