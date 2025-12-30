import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, 
  FileText, DollarSign, Calendar, User, 
  ChevronDown, ChevronRight, Filter, Search,
  ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';

interface Approval {
  id: string;
  type: 'task' | 'budget' | 'expense' | 'project' | 'content';
  title: string;
  description: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  due_date?: string;
  comments: Comment[];
}

interface Comment {
  id: string;
  user_name: string;
  text: string;
  created_at: string;
}

const TYPE_ICONS = {
  task: FileText,
  budget: DollarSign,
  expense: DollarSign,
  project: Calendar,
  content: FileText
};

const TYPE_LABELS = {
  task: 'Tarefa',
  budget: 'Orçamento',
  expense: 'Despesa',
  project: 'Projeto',
  content: 'Conteúdo'
};

const TYPE_COLORS = {
  task: 'bg-blue-100 text-blue-800',
  budget: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
  project: 'bg-purple-100 text-purple-800',
  content: 'bg-pink-100 text-pink-800'
};

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente'
};

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedApproval, setExpandedApproval] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);

      // Demo data - in production, this would come from Supabase
      const demoApprovals: Approval[] = [
        {
          id: '1',
          type: 'expense',
          title: 'Contratação de Freelancer para Design',
          description: 'Precisamos contratar um designer freelancer para criar as artes do novo single. Orçamento inclui 5 peças para redes sociais e capa do álbum.',
          requester: { id: '1', name: 'Maria Silva', email: 'maria@email.com' },
          amount: 2500,
          status: 'pending',
          priority: 'high',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          comments: []
        },
        {
          id: '2',
          type: 'budget',
          title: 'Orçamento Turnê Regional',
          description: 'Aprovação do orçamento para turnê de 5 cidades na região Sul. Inclui transporte, hospedagem e cachês da equipe técnica.',
          requester: { id: '2', name: 'João Santos', email: 'joao@email.com' },
          amount: 45000,
          status: 'pending',
          priority: 'urgent',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          comments: [
            { id: '1', user_name: 'Admin', text: 'Verificar se podemos reduzir custos de hospedagem', created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }
          ]
        },
        {
          id: '3',
          type: 'content',
          title: 'Post Patrocinado Instagram',
          description: 'Aprovação do conteúdo para post patrocinado anunciando o novo single. Texto e imagem anexados.',
          requester: { id: '3', name: 'Ana Costa', email: 'ana@email.com' },
          status: 'pending',
          priority: 'medium',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          comments: []
        },
        {
          id: '4',
          type: 'project',
          title: 'Novo Projeto: DVD ao Vivo',
          description: 'Aprovação para iniciar o projeto de gravação do DVD ao vivo. Inclui locação, equipe de filmagem e pós-produção.',
          requester: { id: '1', name: 'Maria Silva', email: 'maria@email.com' },
          amount: 120000,
          status: 'approved',
          priority: 'high',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          comments: [
            { id: '2', user_name: 'Diretor', text: 'Aprovado! Vamos começar o planejamento.', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        },
        {
          id: '5',
          type: 'expense',
          title: 'Compra de Equipamento de Som',
          description: 'Solicitação para compra de novo sistema de monitoração in-ear para a banda.',
          requester: { id: '4', name: 'Pedro Lima', email: 'pedro@email.com' },
          amount: 8500,
          status: 'rejected',
          priority: 'low',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          comments: [
            { id: '3', user_name: 'Financeiro', text: 'Orçamento do trimestre já foi comprometido. Reagendar para próximo trimestre.', created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
          ]
        }
      ];

      setApprovals(demoApprovals);

    } catch (error) {
      console.error('Erro ao carregar aprovações:', error);
      toast.error('Erro ao carregar aprovações');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId: string) => {
    setApprovals(approvals.map(a => 
      a.id === approvalId ? { ...a, status: 'approved' as const } : a
    ));
    toast.success('Aprovado com sucesso!');
  };

  const handleReject = async (approvalId: string) => {
    setApprovals(approvals.map(a => 
      a.id === approvalId ? { ...a, status: 'rejected' as const } : a
    ));
    toast.success('Rejeitado');
  };

  const handleAddComment = (approvalId: string) => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      user_name: user?.email?.split('@')[0] || 'Você',
      text: commentText,
      created_at: new Date().toISOString()
    };

    setApprovals(approvals.map(a => 
      a.id === approvalId 
        ? { ...a, comments: [...a.comments, newComment] }
        : a
    ));

    setCommentText('');
    toast.success('Comentário adicionado');
  };

  const filteredApprovals = approvals.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (searchTerm && !a.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const approvedCount = approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = approvals.filter(a => a.status === 'rejected').length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFAD85]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-7 h-7 text-[#FFAD85]" />
          Aprovações
        </h1>
        <p className="text-gray-600 mt-1">
          Gerencie aprovações de projetos, orçamentos e despesas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div 
          onClick={() => setFilter('pending')}
          className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all ${
            filter === 'pending' ? 'border-[#FFAD85] shadow-md' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter('approved')}
          className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all ${
            filter === 'approved' ? 'border-[#FFAD85] shadow-md' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
              <p className="text-sm text-gray-600">Aprovados</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilter('rejected')}
          className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all ${
            filter === 'rejected' ? 'border-[#FFAD85] shadow-md' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
              <p className="text-sm text-gray-600">Rejeitados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar aprovações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
            />
          </div>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent"
        >
          <option value="all">Todos os Tipos</option>
          <option value="task">Tarefas</option>
          <option value="budget">Orçamentos</option>
          <option value="expense">Despesas</option>
          <option value="project">Projetos</option>
          <option value="content">Conteúdo</option>
        </select>

        <button
          onClick={() => { setFilter('all'); setTypeFilter('all'); setSearchTerm(''); }}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aprovação encontrada</h3>
          <p className="text-gray-600">
            {filter === 'pending' 
              ? 'Não há aprovações pendentes no momento.' 
              : 'Nenhuma aprovação corresponde aos filtros selecionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => {
            const TypeIcon = TYPE_ICONS[approval.type];
            const isExpanded = expandedApproval === approval.id;

            return (
              <div 
                key={approval.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Main Row */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedApproval(isExpanded ? null : approval.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${TYPE_COLORS[approval.type].split(' ')[0]}`}>
                      <TypeIcon className={`w-5 h-5 ${TYPE_COLORS[approval.type].split(' ')[1]}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{approval.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {approval.requester.name}
                            </span>
                            <span>•</span>
                            <span>{formatDate(approval.created_at)}</span>
                            {approval.amount && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(approval.amount)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[approval.type]}`}>
                            {TYPE_LABELS[approval.type]}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[approval.priority]}`}>
                            {PRIORITY_LABELS[approval.priority]}
                          </span>
                          {approval.status === 'pending' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pendente
                            </span>
                          ) : approval.status === 'approved' ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Aprovado
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Rejeitado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <div className="text-gray-400">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    {/* Description */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Descrição</h4>
                      <p className="text-gray-600">{approval.description}</p>
                    </div>

                    {/* Due Date */}
                    {approval.due_date && (
                      <div className="mb-4 flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Prazo:</span>
                        <span className="font-medium">{formatDate(approval.due_date)}</span>
                      </div>
                    )}

                    {/* Comments */}
                    {approval.comments.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Comentários</h4>
                        <div className="space-y-2">
                          {approval.comments.map((comment) => (
                            <div key={comment.id} className="bg-white p-3 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm text-gray-900">{comment.user_name}</span>
                                <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                              </div>
                              <p className="text-sm text-gray-600">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add Comment */}
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Adicionar comentário..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(approval.id)}
                        />
                        <button
                          onClick={() => handleAddComment(approval.id)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {approval.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleApprove(approval.id); }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleReject(approval.id); }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <ThumbsDown className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
