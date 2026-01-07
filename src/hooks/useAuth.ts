import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Role } from "../types/community";

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
}

const deriveRole = (user: User | null): Role => {
  if (!user) return "guest";
  const metadataRole =
    (user.app_metadata as Record<string, unknown>)?.role ??
    (user.user_metadata as Record<string, unknown>)?.role;
  if (
    metadataRole === "resident" ||
    metadataRole === "agent" ||
    metadataRole === "member"
  ) {
    return metadataRole;
  }
  return "member";
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    role: "guest",
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
        syncState(
          null,
          err instanceof Error ? err : new Error("Failed to fetch session"),
        );
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

  /**
   * 登出（供 GlobalHeader 等使用，P3 會接上）
   * @throws {Error} 登出失敗時拋出錯誤
   */
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return { ...state, signOut };
}
