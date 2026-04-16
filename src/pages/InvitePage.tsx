import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Users, ArrowRight, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/auth/AuthProvider';
import { toast } from 'sonner';

type Invite = {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  token: string;
  invite_type: 'platform_access' | 'team_member';
};

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string>('');

  const tokenValue = useMemo(() => (token || '').trim(), [token]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');

        if (!tokenValue) {
          setError('Convite inválido. Token não encontrado.');
          return;
        }

        const { data, error: inviteErr } = await supabase
          .from('team_invites')
          .select('id, organization_id, email, role, status, expires_at, token, invite_type')
          .eq('token', tokenValue)
          .single();

        if (inviteErr || !data) {
          setError('Convite não encontrado ou inválido.');
          return;
        }

        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError('Este convite expirou. Solicite um novo convite.');
          return;
        }

        if (data.status !== 'pending') {
          setError('Este convite já foi utilizado ou não está mais disponível.');
          return;
        }

        setInvite(data as Invite);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Erro ao carregar convite.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [tokenValue]);

  const handleAccept = async () => {
    if (!invite) return;

    try {
      setAccepting(true);

      if (!user?.id) {
        toast.error('Faça login primeiro para aceitar o convite.');
        navigate(`/login?redirect=${encodeURIComponent(`/invite/${tokenValue}`)}`);
        return;
      }

      if (invite.email && user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
        toast.error('Este convite é para outro e-mail. Faça login com o e-mail convidado.');
        return;
      }

      const isPlatformAccess = !invite.invite_type || invite.invite_type === 'platform_access';

      if (isPlatformAccess) {
        // Conta independente: apenas marca o convite como aceito.
        // A organização própria já foi criada pelo ensureOrganization() no login/registro.
        const { error: updateErr } = await supabase
          .from('team_invites')
          .update({ status: 'accepted' })
          .eq('token', tokenValue);

        if (updateErr) throw updateErr;

        toast.success('Bem-vindo ao TaskMaster! Sua conta está pronta.');
        navigate('/');
      } else {
        // Membro de equipe: entra na organização do titular via RPC
        const { data, error: rpcErr } = await supabase
          .rpc('accept_team_invite', { invite_token: tokenValue });

        if (rpcErr) throw rpcErr;
        if (!data?.success) throw new Error(data?.error || 'Convite inválido ou expirado.');

        toast.success('Convite aceito! Você já faz parte da equipe.');
        await supabase.auth.refreshSession();
        navigate('/');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Não foi possível aceitar o convite.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Carregando convite...</span>
        </div>
      </div>
    );
  }

  const isPlatformAccess = !invite?.invite_type || invite?.invite_type === 'platform_access';

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFAD85]/15 flex items-center justify-center">
            {isPlatformAccess ? (
              <UserPlus className="w-5 h-5 text-[#FF9B6A]" />
            ) : (
              <Users className="w-5 h-5 text-[#FF9B6A]" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {isPlatformAccess ? 'Criar sua conta no TaskMaster' : 'Convite para a equipe'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {isPlatformAccess
                ? 'Você foi convidado para acessar a plataforma. Crie sua conta e gerencie seus próprios projetos.'
                : 'Aceite o convite para entrar na organização como colaborador.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 p-4 bg-red-50 border border-red-100 rounded-xl flex gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-2">
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/invite/${tokenValue}`)}`}
                  className="text-sm font-semibold text-[#FF9B6A] hover:text-[#FFAD85]"
                >
                  Ir para login
                </Link>
              </div>
            </div>
          </div>
        )}

        {invite && !error && (
          <div className="mt-5">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-sm text-gray-700">
                <div><span className="font-semibold">E-mail:</span> {invite.email}</div>
                {!isPlatformAccess && (
                  <div className="mt-1">
                    <span className="font-semibold">Função:</span>{' '}
                    {{ viewer: 'Visualizador', editor: 'Editor', admin: 'Administrador', member: 'Membro', manager: 'Gerente' }[invite.role] || invite.role}
                  </div>
                )}
                <div className="mt-1">
                  <span className="font-semibold">Validade:</span>{' '}
                  {new Date(invite.expires_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            {!user?.id ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600 mb-3">
                  {isPlatformAccess
                    ? 'Crie sua conta gratuita para começar a usar a plataforma.'
                    : 'Faça login ou crie sua conta para aceitar o convite.'}
                </p>
                <Link
                  to={`/join?redirect=${encodeURIComponent(`/invite/${tokenValue}`)}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white font-semibold"
                >
                  Criar minha conta <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/invite/${tokenValue}`)}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Já tenho conta — Fazer login <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white font-semibold disabled:opacity-50"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isPlatformAccess ? 'Ativando conta...' : 'Aceitando convite...'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    {isPlatformAccess ? 'Ativar minha conta' : 'Aceitar convite e entrar na equipe'}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        <p className="mt-5 text-xs text-gray-500">
          Se você recebeu este convite por engano, pode ignorar esta página.
        </p>
      </div>
    </div>
  );
}
