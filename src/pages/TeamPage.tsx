import React, { useState, useEffect } from 'react';
import { Users, Shield, Check, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';
import InviteManager from '../components/InviteManager';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: { full_name?: string };
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador', manager: 'Gerente',
  editor: 'Editor', viewer: 'Visualizador', member: 'Membro',
};
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800', manager: 'bg-blue-100 text-blue-800',
  editor: 'bg-green-100 text-green-800', viewer: 'bg-gray-100 text-gray-800',
  member: 'bg-green-100 text-green-800',
};

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => { loadMembers(); }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const { data: orgRow } = await supabase
        .from('user_organizations')
        .select('organization_id, role')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!orgRow) { setLoading(false); return; }
      setCurrentUserRole(orgRow.role);

      const { data: membersData } = await supabase
        .from('user_organizations')
        .select('id, user_id, role, created_at')
        .eq('organization_id', orgRow.organization_id);

      const userIds = (membersData || []).map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      setMembers((membersData || []).map(m => ({
        ...m,
        profile: profileMap.get(m.user_id),
      })));
    } catch (e) {
      console.error('Erro ao carregar equipe:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Remover este membro?')) return;
    const { error } = await supabase.from('user_organizations').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover membro'); return; }
    toast.success('Membro removido');
    loadMembers();
  };

  const handleUpdateRole = async (id: string, role: string) => {
    const { error } = await supabase.from('user_organizations').update({ role }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar função'); return; }
    toast.success('Função atualizada');
    loadMembers();
  };

  const canManage = ['admin', 'owner'].includes(currentUserRole);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-7 h-7 text-[#FFAD85]" />
          Equipe
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie os membros da sua organização e convites por artista.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg"><Users className="w-5 h-5 text-[#FFAD85]" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{members.length}</p><p className="text-xs text-gray-500">Membros</p></div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg"><Shield className="w-5 h-5 text-purple-600" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{members.filter(m => m.role === 'admin').length}</p>
            <p className="text-xs text-gray-500">Admins</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg"><Check className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{members.length}</p><p className="text-xs text-gray-500">Ativos</p></div>
        </div>
      </div>

      {/* Membros ativos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Membros Ativos</h2>
        </div>
        {loading ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Carregando...</div>
        ) : members.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">Nenhum membro ainda.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-9 h-9 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {(m.profile?.full_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {m.profile?.full_name || `Membro ${m.user_id.substring(0, 8)}`}
                    {m.user_id === user?.id && <span className="ml-1 text-xs text-gray-400">(você)</span>}
                  </div>
                  <div className="text-xs text-gray-400">Desde {new Date(m.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                {canManage && m.user_id !== user?.id ? (
                  <select
                    value={m.role}
                    onChange={e => handleUpdateRole(m.id, e.target.value)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-700'}`}
                  >
                    {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABELS[m.role] || m.role}
                    {m.user_id === user?.id && ' (você)'}
                  </span>
                )}
                {canManage && m.user_id !== user?.id && (
                  <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Convidar — modelo correto com artista + função */}
      <InviteManager />

    </div>
  );
}
