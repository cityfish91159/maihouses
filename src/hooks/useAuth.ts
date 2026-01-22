import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import type { Role } from "../types/community";

// [NASA TypeScript Safety] Zod Schema 用於驗證 user metadata 中的 role
const RoleSchema = z.enum([
  "guest",
  "member",
  "resident",
  "agent",
  "official",
  "admin",
]);

// [NASA TypeScript Safety] Zod Schema 用於驗證 metadata 結構
const MetadataSchema = z
  .object({
    role: z.unknown().optional(),
  })
  .passthrough();

/**
 * [NASA TypeScript Safety] 從 metadata 安全提取 role
 */
function extractRoleFromMetadata(metadata: unknown): Role | null {
  const metadataResult = MetadataSchema.safeParse(metadata);
  if (!metadataResult.success) return null;

  const roleResult = RoleSchema.safeParse(metadataResult.data.role);
  if (!roleResult.success) return null;

  return roleResult.data;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  role: Role;
  isAuthenticated: boolean;
  loading: boolean;
  error: Error | null;
}

// [NASA TypeScript Safety] 使用 Zod safeParse 取代 as 類型斷言
const deriveRole = (user: User | null): Role => {
  if (!user) return "guest";

  // [NASA TypeScript Safety] 依序嘗試從 app_metadata 和 user_metadata 提取 role
  const appRole = extractRoleFromMetadata(user.app_metadata);
  if (appRole) return appRole;

  const userRole = extractRoleFromMetadata(user.user_metadata);
  if (userRole) return userRole;

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
