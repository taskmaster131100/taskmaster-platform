import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, 
  FileText, DollarSign, Calendar, User, 
  ChevronDown, ChevronRight, Filter, Search,
  ThumbsUp, ThumbsDown, MessageSquare, Image as ImageIcon, Video
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';

interface Approval {
  id: string;
  type: 'task' | 'budget' | 'expense' | 'project' | 'content' | 'material';
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
  file_url?: string;
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
  content: MessageSquare,
  material: ImageIcon
};

const TYPE_LABELS = {
  task: 'Tarefa',
  budget: 'Orçamento',
  expense: 'Despesa',
  project: 'Projeto',
  content: 'Conteúdo',
  material: 'Material (Arte/Vídeo)'
};

const TYPE_COLORS = {
  task: 'bg-blue-100 text-blue-800',
  budget: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
  project: 'bg-purple-100 text-purple-800',
  content: 'bg-pink-100 text-pink-800',
  material: 'bg-indigo-100 text-indigo-800'
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
      // Em produção, buscaríamos da tabela 'approvals' no Supabase
      // Para o MVP, vamos usar dados simulados enriquecidos com materiais
      const demoApprovals: Approval[] = [
        {
          id: '1',
          type: 'material',
          title: 'Capa do Single - Versão Final',
          description: 'Arte final para o lançamento do single "Nova Era". Favor validar cores e tipografia.',
          requester: { id: '1', name: 'Designer Bruno', email: 'bruno@design.com' },
          status: 'pending',
          priority: 'high',
          file_url: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&auto=format&fit=crop&q=60',
          created_at: new Date().toISOString(),
          comments: []
        },
        {
          id: '2',
          type: 'expense',
          title: 'Cachê Banda de Apoio - Show SP',
          description: 'Pagamento dos músicos acompanhantes para o show no Espaço Unimed.',
          requester: { id: '2', name: 'Produtor Carlos', email: 'carlos@producao.com' },
          amount: 12000,
          status: 'pending',
          priority: 'urgent',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          comments: []
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

  const filteredApprovals = approvals.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (searchTerm && !a.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle className="w-7 h-7 text-[#FFAD85]" />
          Central de Aprovações
        </h1>
        <p className="text-gray-600 mt-1">
          Aprove materiais, orçamentos e projetos para manter o fluxo 360°
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredApprovals.map(approval => (
          <div key={approval.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${TYPE_COLORS[approval.type as keyof typeof TYPE_COLORS]}`}>
                    {React.createElement(TYPE_ICONS[approval.type as keyof typeof TYPE_ICONS], { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{approval.title}</h3>
                    <p className="text-sm text-gray-500">Solicitado por {approval.requester.name}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${PRIORITY_COLORS[approval.priority]}`}>
                  {PRIORITY_LABELS[approval.priority]}
                </span>
              </div>

              <p className="text-gray-700 mb-4">{approval.description}</p>

              {approval.file_url && (
                <div className="mb-4 rounded-lg overflow-hidden border border-gray-100">
                  <img src={approval.file_url} alt="Preview" className="w-full max-h-64 object-cover" />
                </div>
              )}

              {approval.amount && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-xl">R$ {approval.amount.toLocaleString('pt-BR')}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleApprove(approval.id)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-bold transition-colors"
                >
                  <ThumbsUp className="w-5 h-5" />
                  Aprovar
                </button>
                <button
                  onClick={() => handleReject(approval.id)}
                  className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 font-bold transition-colors"
                >
                  <ThumbsDown className="w-5 h-5" />
                  Reprovar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
