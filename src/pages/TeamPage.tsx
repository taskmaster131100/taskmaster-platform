import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, MoreVertical, Check, X, Clock, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';
import { shortId } from '../utils/team';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  profile?: {
    full_name?: string;
  };

}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  expires_at: string;
  token: string;
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
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string>('');

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Get current organization
      let { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id, role')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!orgData) {
        // Tentar criar organização automaticamente
        try {
          const { data: bootstrapResult, error: bootstrapError } = await supabase.rpc('bootstrap_organization', {
            org_name: 'Minha Organização'
          });

          if (bootstrapError || !bootstrapResult?.organization_id) {
            toast.error('Organização não encontrada. Tente recarregar a página.');
            return;
          }

          // Recarregar dados da organização
          const { data: newOrgData } = await supabase
            .from('user_organizations')
            .select('organization_id, role')
            .eq('user_id', user?.id)
            .maybeSingle();

          if (!newOrgData) {
            toast.error('Erro ao configurar organização. Tente recarregar a página.');
            return;
          }

          orgData = newOrgData;
          toast.success('Organização criada com sucesso!');
        } catch (err) {
          console.error('Erro ao criar organização:', err);
          toast.error('Erro ao configurar organização.');
          return;
        }
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

      // NOTE: do NOT use supabase.auth.admin on the client (requires service role).
      // Fetch profile info (when available) from public table.
      const userIds = (membersData || []).map(m => m.user_id);

      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileByUserId = new Map<string, any>();
      (profilesData || []).forEach((p: any) => profileByUserId.set(p.id, p));

      const membersWithProfiles = (membersData || []).map((member) => {
        const profile = profileByUserId.get(member.user_id);
        const email = 'Email não disponível';
        return {
          ...member,
          email,
          status: 'active' as const,
          profile
        };
      });

      setMembers(membersWithProfiles);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copiado!');
    } catch {
      // Fallback for older browsers
      window.prompt('Copie o link abaixo:', text);
    }
  };

  const MAX_FREE_MEMBERS = 5;
  const EXTRA_MEMBER_COST = 3; // USD per extra member/month

  const totalTeamSize = members.length + invites.filter(i => i.status === 'pending').length;
  const isOverLimit = totalTeamSize >= MAX_FREE_MEMBERS;

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido');
      return;
    }

    // Check team limit
    if (isOverLimit) {
      const confirmExtra = confirm(
        `Seu plano inclui ${MAX_FREE_MEMBERS} membros. Membros adicionais custam $${EXTRA_MEMBER_COST}/mês cada. Deseja continuar?`
      );
      if (!confirmExtra) return;
    }

    try {
      setSending(true);

      // Get current organization
      const { data: orgData } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!orgData) {
        toast.error('Organização não encontrada. Vá em Organização para configurar.');
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
      // MVP: show/copy link
      const inviteLink = `${window.location.origin}/invite/${token}`;

      setLastInviteLink(inviteLink);
      setShowInviteLinkModal(true);
      toast.success('Convite criado com sucesso!');

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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FFAD85]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 sm:w-7 h-6 sm:h-7 text-[#FFAD85]" />
            Equipe
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerencie os membros da sua organização
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Seu plano inclui 5 membros. Membros extras: $3/mês cada.
          </p>
        </div>
        
        {canManageTeam && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-[#FFAD85] text-white rounded-xl sm:rounded-lg hover:bg-[#FF9B6A] transition-colors w-full sm:w-auto"
          >
            <UserPlus className="w-5 h-5" />
            <span>Convidar Membro</span>
          </button>
        )}
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-[#FFF0E6] rounded-lg">
              <Users className="w-4 sm:w-5 h-4 sm:h-5 text-[#FFAD85]" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{members.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">Membros</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{invites.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">Pendentes</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {members.filter(m => m.role === 'admin').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Admins</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <Check className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {members.filter(m => m.status === 'active').length}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Ativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members - Mobile Cards / Desktop Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6 sm:mb-8">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Membros da Equipe</h2>
        </div>
        
        {/* Mobile View - Cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                    {member.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {member.profile?.full_name || member.email?.split('@')[0] || shortId(member.user_id)}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{member.email}</div>
                  </div>
                </div>
                {canManageTeam && member.user_id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {canManageTeam && member.user_id !== user?.id ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-full border-0 ${ROLE_COLORS[member.role]}`}
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
                </div>
                <span className="text-xs text-gray-500">
                  Desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden lg:block overflow-x-auto">
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
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FFAD85] to-[#FF9B6A] rounded-full flex items-center justify-center text-white font-medium">
                        {member.email?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.profile?.full_name || member.email || shortId(member.user_id)}
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
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Convites Pendentes</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {invites.map((invite) => (
              <div key={invite.id} className="p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{invite.email}</p>
                    <p className="text-xs text-gray-500">
                      Expira em {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 ml-13 sm:ml-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[invite.role]}`}>
                    {ROLE_LABELS[invite.role]}
                  </span>

                  {canManageTeam && invite.token && (
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/invite/${invite.token}`)}
                      className="px-3 py-2 text-sm font-semibold text-[#FF9B6A] hover:text-[#FFAD85] hover:bg-[#FFAD85]/10 rounded-lg"
                      title="Copiar link do convite"
                    >
                      Copiar link
                    </button>
                  )}

                  {canManageTeam && (
                    <button
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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

      {/* Invite Link Modal (after create) */}
      {showInviteLinkModal && lastInviteLink && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Link do Convite</h3>
              <button
                onClick={() => setShowInviteLinkModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Fechar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Copie e envie este link para a pessoa entrar na organização.
            </p>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl break-all text-sm text-gray-800">
              {lastInviteLink}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-5">
              <button
                onClick={() => copyToClipboard(lastInviteLink)}
                className="w-full sm:flex-1 px-4 py-3 bg-[#FFAD85] text-white rounded-xl hover:bg-[#FF9B6A] transition-colors"
              >
                Copiar link
              </button>
              <button
                onClick={() => setShowInviteLinkModal(false)}
                className="w-full sm:flex-1 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal - Responsive */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Convidar Novo Membro
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg sm:hidden"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FFAD85] focus:border-[#FFAD85] text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Função
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#FFAD85] focus:border-[#FFAD85] text-base"
                >
                  <option value="admin">Administrador - Acesso total</option>
                  <option value="manager">Gerente - Pode gerenciar projetos</option>
                  <option value="member">Membro - Pode editar tarefas</option>
                  <option value="viewer">Visualizador - Apenas visualiza</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full sm:w-auto px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInviteMember}
                disabled={sending}
                className="w-full sm:w-auto px-4 py-3 bg-[#FFAD85] text-white rounded-xl hover:bg-[#FF9B6A] transition-colors disabled:opacity-50"
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
