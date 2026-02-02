import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  resendSignupConfirmation: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  resendSignupConfirmation: async () => {},
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real auth check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name
        });

        // Bootstrap organization for account owner (if needed)
        try {
          const { data: membership } = await supabase
            .from('user_organizations')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!membership?.id) {
            // If user has pending invites, do NOT auto-create a new org.
            const { data: pendingInvite } = await supabase
              .from('team_invites')
              .select('id')
              .eq('email', (session.user.email || '').toLowerCase())
              .eq('status', 'pending')
              .gt('expires_at', new Date().toISOString())
              .maybeSingle();

            if (!pendingInvite?.id) {
              const orgName =
                session.user.user_metadata?.organization_name ||
                session.user.user_metadata?.name ||
                (session.user.email || '').split('@')[0] ||
                'Minha Organização';

              await supabase.rpc('bootstrap_organization', { org_name: orgName });
            }
          }
        } catch (e) {
          // Silent: if it fails, the UI will show the empty state.
          console.warn('bootstrap_organization failed', e);
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name
      });
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.name
      });
    }
  };

  const resendSignupConfirmation = async (email: string) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Digite um email válido para reenviar a confirmação.');
    }

    // Supabase v2: resend confirmation email for signup
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, resendSignupConfirmation, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
