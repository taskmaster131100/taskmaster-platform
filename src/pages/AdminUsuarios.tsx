import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { CheckCircle, XCircle, Clock, User, Mail, Tag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ADMIN_EMAILS = ['marcos@taskmaster.works', 'balmarcos131100@gmail.com', 'balmarcos@hotmail.com'];

interface PendingUser {
  id: string;
  user_id: string;
  email: string;
  name: string;
  account_type: string;
  status: string;
  created_at: string;
}

const typeLabel: Record<string, string> = {
  artist: 'Artista',
  office: 'Escritório',
  producer: 'Produtor',
};

export default function AdminUsuarios() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '') || user?.user_metadata?.role === 'admin';

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pending_approvals')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setPending(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (u: PendingUser) => {
    setActing(u.user_id);
    try {
      const res = await fetch('/api/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.user_id, action: 'approve', adminId: user?.id }),
      });
      if (!res.ok) throw new Error('Falha na API');
      toast.success(`${u.name} aprovado!`);
      await load();
    } catch {
      toast.error('Erro ao aprovar usuário. Tente novamente.');
    } finally {
      setActing(null);
    }
  };

  const reject = async (u: PendingUser) => {
    setActing(u.user_id);
    try {
      const res = await fetch('/api/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: u.user_id, action: 'reject', adminId: user?.id }),
      });
      if (!res.ok) throw new Error('Falha na API');
      toast.success(`${u.name} rejeitado.`);
      await load();
    } catch {
      toast.error('Erro ao rejeitar.');
    } finally {
      setActing(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Acesso restrito.</p>
      </div>
    );
  }

  const byStatus = (s: string) => pending.filter(p => p.status === s);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aprovação de Usuários</h1>
          <button onClick={load} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-400" />
          </div>
        ) : (
          <>
            {/* Pendentes */}
            <Section title="Aguardando Aprovação" count={byStatus('pending').length} color="orange">
              {byStatus('pending').length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">Nenhum cadastro pendente.</p>
              ) : byStatus('pending').map(u => (
                <UserCard key={u.user_id} u={u} acting={acting} onApprove={approve} onReject={reject} />
              ))}
            </Section>

            {/* Aprovados */}
            <Section title="Aprovados" count={byStatus('approved').length} color="green">
              {byStatus('approved').length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">Nenhum usuário aprovado ainda.</p>
              ) : byStatus('approved').map(u => (
                <UserCard key={u.user_id} u={u} acting={null} readOnly />
              ))}
            </Section>

            {/* Rejeitados */}
            {byStatus('rejected').length > 0 && (
              <Section title="Rejeitados" count={byStatus('rejected').length} color="red">
                {byStatus('rejected').map(u => (
                  <UserCard key={u.user_id} u={u} acting={null} readOnly />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, count, color, children }: { title: string; count: number; color: string; children: React.ReactNode }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };
  return (
    <div className="mb-8">
      <div className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-lg border w-fit text-sm font-semibold ${colors[color]}`}>
        {title} <span className="font-bold">({count})</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function UserCard({ u, acting, onApprove, onReject, readOnly }: {
  u: PendingUser;
  acting: string | null;
  onApprove?: (u: PendingUser) => void;
  onReject?: (u: PendingUser) => void;
  readOnly?: boolean;
}) {
  const isActing = acting === u.user_id;
  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-orange-500" />,
    approved: <CheckCircle className="w-4 h-4 text-green-500" />,
    rejected: <XCircle className="w-4 h-4 text-red-500" />,
  }[u.status] ?? null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className="font-semibold text-gray-900">{u.name}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Mail className="w-3.5 h-3.5" /> {u.email}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
          <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{typeLabel[u.account_type] || u.account_type}</span>
          <span>{new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {!readOnly && u.status === 'pending' && (
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onReject?.(u)}
            disabled={isActing}
            className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Rejeitar
          </button>
          <button
            onClick={() => onApprove?.(u)}
            disabled={isActing}
            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {isActing ? <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-white" /> : <CheckCircle className="w-3.5 h-3.5" />}
            Aprovar
          </button>
        </div>
      )}
    </div>
  );
}
