import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type AuthRole = 'guest' | 'member' | 'resident' | 'agent';

interface AuthState {
  session: Session | null;
  user: User | null;
  role: AuthRole;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
}

const deriveRole = (user: User | null): AuthRole => {
  if (!user) return 'guest';
  const metadataRole = (user.app_metadata as Record<string, unknown>)?.role ?? (user.user_metadata as Record<string, unknown>)?.role;
  if (metadataRole === 'resident' || metadataRole === 'agent' || metadataRole === 'member') {
    return metadataRole;
  }
  return 'member';
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: 'guest',
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const syncState = (session: Session | null, error: Error | null = null) => {
      if (!isMounted) return;
      const user = session?.user ?? null;
      const role = deriveRole(user);
      setState({
        session,
        user,
        role,
        isAuthenticated: !!session,
        loading: false,
        error,
      });
    };

    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          syncState(null, error);
          return;
        }
        syncState(data.session, null);
      } catch (err) {
        syncState(null, err instanceof Error ? err : new Error('Failed to fetch session'));
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncState(session, null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return { ...state, signOut };
}
