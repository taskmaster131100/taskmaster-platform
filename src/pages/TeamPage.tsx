import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, MoreVertical, Check, X, Clock, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  user?: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  member: 'Membro',
  viewer: 'Visualizador'
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  member: 'bg-green-100 text-green-800',
  viewer: 'bg-gray-100 text-gray-800'
};

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [sending, setSending] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Get current organization
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id, role')
        .eq('user_id', user?.id)
        .single();

      if (!orgData) {
        toast.error('Organização não encontrada');
        return;
      }

      setCurrentUserRole(orgData.role);

      // Get team members
      const { data: membersData, error: membersError } = await supabase
        .from('user_organizations')
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq('organization_id', orgData.organization_id);

      if (membersError) throw membersError;

      // Get user emails for each member
      const membersWithEmails = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
          return {
            ...member,
            email: userData?.user?.email || 'Email não disponível',
            status: 'active' as const,
            user: userData?.user
          };
        })
      );

      setMembers(membersWithEmails);

      // Get pending invites
      const { data: invitesData } = await supabase
        .from('team_invites')
        .select('*')
        .eq('organization_id', orgData.organization_id)
        .eq('status', 'pending');

      setInvites(invitesData || []);

    } catch (error) {
      console.error('Erro ao carregar equipe:', error);
      toast.error('Erro ao carregar dados da equipe');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido');
      return;
    }

    try {
      setSending(true);

      // Get current organization
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single();

      if (!orgData) {
        toast.error('Organização não encontrada');
        return;
      }

      // Generate unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Create invite
      const { error } = await supabase
        .from('team_invites')
        .insert({
          organization_id: orgData.organization_id,
          email: inviteEmail.toLowerCase().trim(),
          role: inviteRole,
          token,
          invited_by: user?.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      // TODO: Send email with invite link
      // For now, just show the link
      const inviteLink = `${window.location.origin}/invite/${token}`;
      
      toast.success(
        <div>
          <p>Convite criado com sucesso!</p>
          <p className="text-xs mt-1">Link: {inviteLink}</p>
        </div>,
        { duration: 10000 }
      );

      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      loadTeamData();

    } catch (error: any) {
      console.error('Erro ao enviar convite:', error);
      toast.error(error.message || 'Erro ao enviar convite');
    } finally {
      setSending(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Membro removido com sucesso');
      loadTeamData();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      toast.error('Erro ao remover membro');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Função atualizada com sucesso');
      loadTeamData();
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      toast.error('Erro ao atualizar função');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('team_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast.success('Convite cancelado');
      loadTeamData();
    } catch (error) {
      console.error('Erro ao cancelar convite:', error);
      toast.error('Erro ao cancelar convite');
    }
  };

  const canManageTeam = ['admin', 'owner'].includes(currentUserRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600" />
            Equipe
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie os membros da sua organização
          </p>
        </div>
        
        {canManageTeam && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Convidar Membro
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              <p className="text-sm text-gray-600">Membros Ativos</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{invites.length}</p>
              <p className="text-sm text-gray-600">Convites Pendentes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-600">Administradores</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {members.filter(m => m.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Ativos Hoje</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Membros da Equipe</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Desde
                </th>
                {canManageTeam && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {member.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.user?.user_metadata?.full_name || member.email}
                        </div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canManageTeam && member.user_id !== user?.id ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${ROLE_COLORS[member.role]}`}
                      >
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                        <option value="member">Membro</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    ) : (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role]}`}>
                        {ROLE_LABELS[member.role]}
                        {member.user_id === user?.id && ' (você)'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Ativo
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  {canManageTeam && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {member.user_id !== user?.id && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remover membro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Convites Pendentes</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {invites.map((invite) => (
              <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                    <p className="text-xs text-gray-500">
                      Expira em {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[invite.role]}`}>
                    {ROLE_LABELS[invite.role]}
                  </span>
                  {canManageTeam && (
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Cancelar convite"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Convidar Novo Membro
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="admin">Administrador - Acesso total</option>
                  <option value="manager">Gerente - Pode gerenciar projetos</option>
                  <option value="member">Membro - Pode editar tarefas</option>
                  <option value="viewer">Visualizador - Apenas visualiza</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInviteMember}
                disabled={sending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar Convite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
