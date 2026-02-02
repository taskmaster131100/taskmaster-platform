import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Users, ArrowRight } from 'lucide-react';
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
};

export default function InvitePage() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
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
          .select('id, organization_id, email, role, status, expires_at, token')
          .eq('token', tokenValue)
          .single();

        if (inviteErr || !data) {
          setError('Convite não encontrado ou inválido.');
          return;
        }

        // Client-side expiry guard
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

      // If user is not logged in, we can't attach them to the org safely.
      if (!user?.id) {
        toast.error('Faça login primeiro para aceitar o convite.');
        const redirect = `/invite/${encodeURIComponent(tokenValue)}`;
        navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }

      // Optional: guard email mismatch (invite can be for a different email)
      if (invite.email && user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
        toast.error('Este convite é para outro email. Faça login com o email convidado.');
        return;
      }

      // Create membership (idempotent-ish)
      const { data: existing } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', invite.organization_id)
        .maybeSingle();

      if (!existing?.id) {
        const { error: membershipErr } = await supabase
          .from('user_organizations')
          .insert({
            user_id: user.id,
            organization_id: invite.organization_id,
            role: invite.role || 'member'
          });

        if (membershipErr) throw membershipErr;
      }

      const { error: updateErr } = await supabase
        .from('team_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (updateErr) throw updateErr;

      toast.success('Convite aceito! Você já faz parte da organização.');
      navigate('/team');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Não foi possível aceitar o convite.');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4 safe-area-top safe-area-bottom">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Carregando convite...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFAD85]/15 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#FF9B6A]" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Convite para a equipe</h1>
            <p className="text-sm text-gray-600 mt-1">
              Aceite o convite para entrar na organização.
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
                  to={`/login?redirect=${encodeURIComponent(`/invite/${encodeURIComponent(tokenValue)}`)}`}
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
                <div><span className="font-semibold">Email:</span> {invite.email}</div>
                <div className="mt-1"><span className="font-semibold">Função:</span> {invite.role}</div>
                <div className="mt-1"><span className="font-semibold">Validade:</span> {new Date(invite.expires_at).toLocaleString('pt-BR')}</div>
              </div>
            </div>

            {!user?.id ? (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-3">
                  Para aceitar o convite, faça login com o email convidado.
                </p>
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/invite/${encodeURIComponent(tokenValue)}`)}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white font-semibold"
                >
                  Ir para login <ArrowRight className="w-4 h-4" />
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
                    Aceitando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Aceitar convite
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
