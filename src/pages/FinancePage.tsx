import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart, Plus, 
  Filter, Download, Calendar, MoreVertical, Edit2, Trash2,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle, Clock, X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';

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

const CATEGORIES = [
  { id: 'marketing', label: 'Marketing', color: 'bg-blue-500' },
  { id: 'producao', label: 'Produção', color: 'bg-purple-500' },
  { id: 'logistica', label: 'Logística', color: 'bg-orange-500' },
  { id: 'equipe', label: 'Equipe', color: 'bg-green-500' },
  { id: 'equipamento', label: 'Equipamento', color: 'bg-yellow-500' },
  { id: 'outros', label: 'Outros', color: 'bg-gray-500' }
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  approved: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const STATUS_LABELS = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
  approved: 'Aprovado',
  cancelled: 'Cancelado'
};

export default function FinancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'transactions'>('overview');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());

  // Form states
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    description: '',
    total_amount: '',
    currency: 'BRL',
    start_date: '',
    end_date: ''
  });

  const [itemForm, setItemForm] = useState({
    category: 'marketing',
    description: '',
    planned_amount: '',
    due_date: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    description: '',
    category: 'marketing',
    amount: '',
    type: 'expense' as 'revenue' | 'expense',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);

      // Get current organization
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single();

      if (!orgData) {
        // Create mock data for demo
        setBudgets([
          {
            id: '1',
            name: 'Orçamento Lançamento Q1',
            description: 'Orçamento para lançamento do primeiro trimestre',
            total_amount: 50000,
            spent_amount: 15000,
            currency: 'BRL',
            start_date: '2025-01-01',
            end_date: '2025-03-31',
            status: 'active',
            items: [
              { id: '1', budget_id: '1', category: 'marketing', description: 'Anúncios Instagram', planned_amount: 5000, actual_amount: 3500, status: 'paid', due_date: '2025-01-15' },
              { id: '2', budget_id: '1', category: 'producao', description: 'Estúdio gravação', planned_amount: 10000, actual_amount: 8000, status: 'paid', due_date: '2025-01-20' },
              { id: '3', budget_id: '1', category: 'equipe', description: 'Freelancers', planned_amount: 8000, actual_amount: 0, status: 'pending', due_date: '2025-02-01' },
            ]
          },
          {
            id: '2',
            name: 'Turnê Nacional',
            description: 'Orçamento para turnê de 10 cidades',
            total_amount: 150000,
            spent_amount: 45000,
            currency: 'BRL',
            start_date: '2025-02-01',
            end_date: '2025-06-30',
            status: 'active',
            items: [
              { id: '4', budget_id: '2', category: 'logistica', description: 'Transporte', planned_amount: 30000, actual_amount: 25000, status: 'paid', due_date: '2025-02-15' },
              { id: '5', budget_id: '2', category: 'equipe', description: 'Equipe técnica', planned_amount: 50000, actual_amount: 20000, status: 'pending', due_date: '2025-03-01' },
            ]
          }
        ]);

        setTransactions([
          { id: '1', description: 'Pagamento show SP', category: 'revenue', amount: 25000, type: 'revenue', status: 'paid', transaction_date: '2025-01-10', created_at: '2025-01-10' },
          { id: '2', description: 'Aluguel estúdio', category: 'producao', amount: 5000, type: 'expense', status: 'paid', transaction_date: '2025-01-12', created_at: '2025-01-12' },
          { id: '3', description: 'Anúncios Meta', category: 'marketing', amount: 3500, type: 'expense', status: 'pending', transaction_date: '2025-01-15', created_at: '2025-01-15' },
        ]);
        return;
      }

      // Load real data from Supabase
      const { data: budgetsData } = await supabase
        .from('budgets')
        .select('*, budget_items(*)')
        .eq('organization_id', orgData.organization_id);

      if (budgetsData) {
        setBudgets(budgetsData.map(b => ({
          ...b,
          items: b.budget_items || [],
          spent_amount: (b.budget_items || []).reduce((sum: number, item: any) => sum + (item.actual_amount || 0), 0)
        })));
      }

      const { data: transactionsData } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('organization_id', orgData.organization_id)
        .order('transaction_date', { ascending: false });

      if (transactionsData) {
        setTransactions(transactionsData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBudgetExpand = (budgetId: string) => {
    const newExpanded = new Set(expandedBudgets);
    if (newExpanded.has(budgetId)) {
      newExpanded.delete(budgetId);
    } else {
      newExpanded.add(budgetId);
    }
    setExpandedBudgets(newExpanded);
  };

  const handleCreateBudget = async () => {
    try {
      const newBudget: Budget = {
        id: crypto.randomUUID(),
        name: budgetForm.name,
        description: budgetForm.description,
        total_amount: parseFloat(budgetForm.total_amount) || 0,
        spent_amount: 0,
        currency: budgetForm.currency,
        start_date: budgetForm.start_date,
        end_date: budgetForm.end_date,
        status: 'active',
        items: []
      };

      setBudgets([...budgets, newBudget]);
      setShowBudgetModal(false);
      setBudgetForm({ name: '', description: '', total_amount: '', currency: 'BRL', start_date: '', end_date: '' });
      toast.success('Orçamento criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar orçamento');
    }
  };

  const handleAddItem = async () => {
    if (!selectedBudget) return;

    try {
      const newItem: BudgetItem = {
        id: crypto.randomUUID(),
        budget_id: selectedBudget.id,
        category: itemForm.category,
        description: itemForm.description,
        planned_amount: parseFloat(itemForm.planned_amount) || 0,
        actual_amount: 0,
        status: 'pending',
        due_date: itemForm.due_date
      };

      setBudgets(budgets.map(b => 
        b.id === selectedBudget.id 
          ? { ...b, items: [...b.items, newItem] }
          : b
      ));

      setShowItemModal(false);
      setItemForm({ category: 'marketing', description: '', planned_amount: '', due_date: '' });
      toast.success('Item adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  const handleMarkAsPaid = (budgetId: string, itemId: string) => {
    setBudgets(budgets.map(b => {
      if (b.id === budgetId) {
        const updatedItems = b.items.map(item => {
          if (item.id === itemId) {
            return { ...item, status: 'paid' as const, actual_amount: item.planned_amount, paid_date: new Date().toISOString() };
          }
          return item;
        });
        const spent = updatedItems.reduce((sum, item) => sum + item.actual_amount, 0);
        return { ...b, items: updatedItems, spent_amount: spent };
      }
      return b;
    }));
    toast.success('Item marcado como pago!');
  };

  const handleAddTransaction = async () => {
    try {
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        description: transactionForm.description,
        category: transactionForm.category,
        amount: parseFloat(transactionForm.amount) || 0,
        type: transactionForm.type,
        status: 'pending',
        transaction_date: transactionForm.transaction_date,
        created_at: new Date().toISOString()
      };

      setTransactions([newTransaction, ...transactions]);
      setShowTransactionModal(false);
      setTransactionForm({ description: '', category: 'marketing', amount: '', type: 'expense', transaction_date: new Date().toISOString().split('T')[0] });
      toast.success('Transação adicionada!');
    } catch (error) {
      toast.error('Erro ao adicionar transação');
    }
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status'];
    const rows = transactions.map(t => [
      t.transaction_date,
      t.description,
      t.category,
      t.type === 'revenue' ? 'Receita' : 'Despesa',
      t.amount.toFixed(2),
      STATUS_LABELS[t.status]
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exportado!');
  };

  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.total_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent_amount, 0);
  const totalRevenue = transactions.filter(t => t.type === 'revenue').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFAD85]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 sm:w-7 h-6 sm:h-7 text-green-600" />
            Financeiro
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerencie orçamentos, receitas e despesas
          </p>
        </div>
        
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={exportToCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 border border-gray-300 text-gray-700 rounded-xl sm:rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Download className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">Exportar CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-xl sm:rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="hidden sm:inline">Novo Orçamento</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-6 sm:mb-8">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit min-w-full sm:min-w-0">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'budgets', label: 'Orçamentos' },
            { id: 'transactions', label: 'Transações' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 sm:flex-none px-4 py-2.5 sm:py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Stats Cards - Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Orçamento Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    R$ {totalBudget.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                  <PieChart className="w-5 sm:w-6 h-5 sm:h-6 text-[#FFAD85]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Total Gasto</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    R$ {totalSpent.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                    {((totalSpent / totalBudget) * 100).toFixed(1)}% do orçamento
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 rounded-lg flex-shrink-0">
                  <TrendingDown className="w-5 sm:w-6 h-5 sm:h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Receitas</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                    R$ {totalRevenue.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">Saldo</p>
                  <p className={`text-lg sm:text-2xl font-bold truncate ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {(totalBudget - totalSpent).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${totalBudget - totalSpent >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`w-5 sm:w-6 h-5 sm:h-6 ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Progresso dos Orçamentos</h3>
            <div className="space-y-4">
              {budgets.map(budget => {
                const progress = (budget.spent_amount / budget.total_amount) * 100;
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                      <span className="font-medium text-gray-900">{budget.name}</span>
                      <span className="text-gray-600 text-xs sm:text-sm">
                        R$ {budget.spent_amount.toLocaleString('pt-BR')} / R$ {budget.total_amount.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Transações Recentes</h3>
              <button
                onClick={() => setShowTransactionModal(true)}
                className="text-sm text-[#FFAD85] hover:text-[#FF9B6A] font-medium"
              >
                + Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 5).map(transaction => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${transaction.type === 'revenue' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {transaction.type === 'revenue' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`font-semibold text-sm ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'revenue' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR')}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[transaction.status]}`}>
                      {STATUS_LABELS[transaction.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          {budgets.map(budget => (
            <div key={budget.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div 
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-gray-50 gap-3"
                onClick={() => toggleBudgetExpand(budget.id)}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {expandedBudgets.has(budget.id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{budget.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6 ml-8 sm:ml-0">
                  <div className="text-right min-w-0">
                    <p className="text-xs sm:text-sm text-gray-600">Gasto / Total</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      R$ {budget.spent_amount.toLocaleString('pt-BR')} / R$ {budget.total_amount.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="w-20 sm:w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${(budget.spent_amount / budget.total_amount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {expandedBudgets.has(budget.id) && (
                <div className="border-t border-gray-200">
                  <div className="p-4 bg-gray-50 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Itens do Orçamento</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBudget(budget);
                        setShowItemModal(true);
                      }}
                      className="text-sm text-[#FFAD85] hover:text-[#FF9B6A] flex items-center gap-1 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>
                  
                  {/* Mobile: Cards / Desktop: Table */}
                  <div className="lg:hidden divide-y divide-gray-200">
                    {budget.items.map(item => (
                      <div key={item.id} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className={`inline-flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                              CATEGORIES.find(c => c.id === item.category)?.color || 'bg-gray-500'
                            } text-white`}>
                              {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                            </span>
                            <p className="text-sm font-medium text-gray-900 mt-2">{item.description}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>
                            {STATUS_LABELS[item.status]}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            <span>Planejado: R$ {item.planned_amount.toLocaleString('pt-BR')}</span>
                            <span className="mx-2">|</span>
                            <span>Real: R$ {item.actual_amount.toLocaleString('pt-BR')}</span>
                          </div>
                          {item.status === 'pending' && (
                            <button
                              onClick={() => handleMarkAsPaid(budget.id, item.id)}
                              className="text-green-600 text-xs font-medium px-3 py-1.5 bg-green-50 rounded-lg"
                            >
                              Marcar Pago
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {budget.items.length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        Nenhum item adicionado ainda
                      </div>
                    )}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Planejado</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Real</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {budget.items.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                                CATEGORIES.find(c => c.id === item.category)?.color || 'bg-gray-500'
                              } text-white`}>
                                {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              R$ {item.planned_amount.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              R$ {item.actual_amount.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>
                                {STATUS_LABELS[item.status]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.status === 'pending' && (
                                <button
                                  onClick={() => handleMarkAsPaid(budget.id, item.id)}
                                  className="text-green-600 hover:text-green-800 text-xs font-medium"
                                >
                                  Marcar Pago
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {budget.items.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                              Nenhum item adicionado ainda
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}

          {budgets.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento criado</h3>
              <p className="text-gray-500 mb-4 text-sm">Crie seu primeiro orçamento para começar a controlar suas finanças</p>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                Criar Orçamento
              </button>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Todas as Transações</h3>
            <button
              onClick={() => setShowTransactionModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#FFAD85] text-white rounded-xl text-sm hover:bg-[#FF9B6A]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>
          
          {/* Mobile: Cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {transactions.map(transaction => (
              <div key={transaction.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${transaction.type === 'revenue' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {transaction.type === 'revenue' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')} • {CATEGORIES.find(c => c.id === transaction.category)?.label || transaction.category}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className={`font-semibold text-sm ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'revenue' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR')}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[transaction.status]}`}>
                    {STATUS_LABELS[transaction.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${transaction.type === 'revenue' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {transaction.type === 'revenue' ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{transaction.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {CATEGORIES.find(c => c.id === transaction.category)?.label || transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${transaction.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'revenue' ? '+' : '-'} R$ {transaction.amount.toLocaleString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[transaction.status]}`}>
                        {STATUS_LABELS[transaction.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget Modal - Responsive */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Orçamento</h3>
              <button onClick={() => setShowBudgetModal(false)} className="p-2 hover:bg-gray-100 rounded-lg sm:hidden">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={budgetForm.name}
                  onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  placeholder="Ex: Orçamento Q1 2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <textarea
                  value={budgetForm.description}
                  onChange={(e) => setBudgetForm({ ...budgetForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor Total</label>
                  <input
                    type="number"
                    value={budgetForm.total_amount}
                    onChange={(e) => setBudgetForm({ ...budgetForm, total_amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Moeda</label>
                  <select
                    value={budgetForm.currency}
                    onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Início</label>
                  <input
                    type="date"
                    value={budgetForm.start_date}
                    onChange={(e) => setBudgetForm({ ...budgetForm, start_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Fim</label>
                  <input
                    type="date"
                    value={budgetForm.end_date}
                    onChange={(e) => setBudgetForm({ ...budgetForm, end_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => setShowBudgetModal(false)} className="w-full sm:w-auto px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl">
                Cancelar
              </button>
              <button onClick={handleCreateBudget} className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700">
                Criar Orçamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal - Responsive */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Adicionar Item</h3>
              <button onClick={() => setShowItemModal(false)} className="p-2 hover:bg-gray-100 rounded-lg sm:hidden">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor Planejado</label>
                  <input
                    type="number"
                    value={itemForm.planned_amount}
                    onChange={(e) => setItemForm({ ...itemForm, planned_amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vencimento</label>
                  <input
                    type="date"
                    value={itemForm.due_date}
                    onChange={(e) => setItemForm({ ...itemForm, due_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-base"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => setShowItemModal(false)} className="w-full sm:w-auto px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl">
                Cancelar
              </button>
              <button onClick={handleAddItem} className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal - Responsive */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nova Transação</h3>
              <button onClick={() => setShowTransactionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg sm:hidden">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'expense' })}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium ${
                      transactionForm.type === 'expense' 
                        ? 'bg-red-50 border-red-500 text-red-700' 
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Despesa
                  </button>
                  <button
                    onClick={() => setTransactionForm({ ...transactionForm, type: 'revenue' })}
                    className={`flex-1 py-3 rounded-xl border text-sm font-medium ${
                      transactionForm.type === 'revenue' 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    Receita
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FFAD85] text-base"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor</label>
                  <input
                    type="number"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FFAD85] text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
                  <input
                    type="date"
                    value={transactionForm.transaction_date}
                    onChange={(e) => setTransactionForm({ ...transactionForm, transaction_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FFAD85] text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
                <select
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FFAD85] text-base"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button onClick={() => setShowTransactionModal(false)} className="w-full sm:w-auto px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl">
                Cancelar
              </button>
              <button onClick={handleAddTransaction} className="w-full sm:w-auto px-4 py-3 bg-[#FFAD85] text-white rounded-xl hover:bg-[#FF9B6A]">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
