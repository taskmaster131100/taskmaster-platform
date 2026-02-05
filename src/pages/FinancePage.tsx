import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart, Plus, 
  Filter, Download, Calendar, MoreVertical, Edit2, Trash2,
  ChevronDown, ChevronRight, AlertCircle, CheckCircle, Clock, X, FileText, Share2
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

export default function FinancePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'transactions' | 'reports'>('overview');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState('Todos os Artistas');

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      // Simulação de dados para o MVP
      setBudgets([
        {
          id: '1',
          name: 'Lançamento Single "Nova Era"',
          description: 'Marketing e Produção',
          total_amount: 15000,
          spent_amount: 8500,
          currency: 'BRL',
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          status: 'active',
          items: []
        }
      ]);
      setTransactions([
        { id: '1', description: 'Cachê Show SP', category: 'Show', amount: 25000, type: 'revenue', status: 'paid', transaction_date: '2025-01-10', created_at: '2025-01-10' },
        { id: '2', description: 'Anúncios Meta', category: 'Marketing', amount: 3500, type: 'expense', status: 'paid', transaction_date: '2025-01-15', created_at: '2025-01-15' }
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateArtistReport = () => {
    toast.success(`Relatório de Prestação de Contas gerado para ${selectedArtist}`);
    setShowReportModal(true);
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
          <button className="px-4 py-2 bg-[#FFAD85] text-white rounded-lg flex items-center gap-2 hover:bg-[#FF9B6A] font-bold">
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
          <p className="text-2xl font-bold text-gray-900">R$ 45.000,00</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <span className="text-sm text-gray-500 font-medium">Despesas Totais</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">R$ 12.500,00</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#FFAD85] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg"><DollarSign className="w-5 h-5 text-orange-600" /></div>
            <span className="text-sm text-gray-500 font-medium">Lucro Líquido</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">R$ 32.500,00</p>
        </div>
      </div>

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
                <span className="font-bold text-green-600">R$ 45.000,00</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">Total Despesas (Produção/Logística)</span>
                <span className="font-bold text-red-600">- R$ 12.500,00</span>
              </div>
              <div className="flex justify-between border-b pb-3">
                <span className="text-gray-600">Comissão Escritório (20%)</span>
                <span className="font-bold text-orange-600">- R$ 9.000,00</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-xl font-bold">Saldo Líquido Artista</span>
                <span className="text-xl font-bold text-blue-600">R$ 23.500,00</span>
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
    </div>
  );
}
