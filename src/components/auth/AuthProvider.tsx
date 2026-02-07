import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSingleSession(session.user.id);
      }
      setLoading(false);
    });

    // 2. Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkSingleSession(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função para garantir sessão única
  const checkSingleSession = async (userId: string) => {
    const sessionId = Math.random().toString(36).substring(7);
    localStorage.setItem('tm_session_id', sessionId);

    // Atualizar o ID da sessão no banco de dados (tabela profiles ou similar)
    const { error } = await supabase
      .from('profiles')
      .update({ last_session_id: sessionId })
      .eq('id', userId);

    if (error) console.error('Erro ao atualizar sessão:', error);

    // Inscrever para mudanças no perfil do usuário
    const channel = supabase
      .channel(`profile_${userId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        table: 'profiles', 
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

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('tm_session_id');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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
