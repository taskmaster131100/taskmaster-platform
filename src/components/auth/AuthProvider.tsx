import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { identifyUser, trackEvent, resetAnalytics } from '../../lib/analytics';

interface AuthContextType {
  user: User | null;
  organizationId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendSignupConfirmation: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1. Verificar sessão inicial — aguarda organização antes de liberar loading
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSingleSession(session.user.id);
        await ensureOrganization(); // AGUARDA — loading só false depois da org resolver
      }
      if (mounted) setLoading(false);
    });

    // 2. Ouvir mudanças na autenticação (sign in / sign out após carga inicial)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        identifyUser(session.user.id, { email: session.user.email });
        if (_event === 'SIGNED_IN') trackEvent('user_session_start');
        checkSingleSession(session.user.id);
        setLoading(true); // reabrir loading enquanto resolve org
        ensureOrganization().finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setOrganizationId(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Função para garantir que o usuário tem uma organização
  const ensureOrganization = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Verificar se já tem organização — limit(1) evita erro com múltiplas orgs
      const { data: existingOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingOrg?.organization_id) {
        setOrganizationId(existingOrg.organization_id);
        return;
      }

      // Sem org encontrada — chamar bootstrap para criar (idempotente)
      const { error } = await supabase.rpc('bootstrap_organization', {
        org_name: 'Minha Organização'
      });

      if (error) {
        console.error('Erro ao criar organização:', error);
        return;
      }

      // Re-buscar após bootstrap — limit(1) garante 1 resultado sempre
      const { data: newOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (newOrg?.organization_id) {
        setOrganizationId(newOrg.organization_id);
      }
    } catch (err) {
      console.error('Erro ao verificar/criar organização:', err);
    }
  };

  // Função para garantir sessão única
  const checkSingleSession = async (userId: string) => {
    const sessionId = crypto.randomUUID();
    localStorage.setItem('tm_session_id', sessionId);

    // Atualizar o ID da sessão no banco de dados
    const { error } = await supabase
      .from('user_profiles')
      .update({ last_session_id: sessionId })
      .eq('id', userId);

    if (error) console.error('Erro ao atualizar sessão:', error);

    // Inscrever para mudanças no perfil do usuário
    const channel = supabase
      .channel(`profile_${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        table: 'user_profiles',
        schema: 'public',
        filter: `id=eq.${userId}`
      }, (payload) => {
        const newSessionId = payload.new.last_session_id;
        const currentSessionId = localStorage.getItem('tm_session_id');

        if (newSessionId && newSessionId !== currentSessionId) {
          toast.error('Sua conta foi conectada em outro dispositivo. Você será deslogado.');
          setTimeout(() => {
            supabase.auth.signOut();
            window.location.href = '/login';
          }, 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) {
      identifyUser(data.user.id, { email: data.user.email });
      trackEvent('user_login', { method: 'email' });
    }
  };

  const signOut = async () => {
    trackEvent('user_logout');
    await supabase.auth.signOut();
    localStorage.removeItem('tm_session_id');
    resetAnalytics();
    setOrganizationId(null);
  };

  const resendSignupConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, organizationId, loading, signIn, signOut, resendSignupConfirmation }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
