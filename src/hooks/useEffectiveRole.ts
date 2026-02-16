import { useMemo } from 'react';
import type { Role } from '../types/community';
import type { PageMode } from './usePageMode';

export interface UseEffectiveRoleOptions {
  mode: PageMode;
  authLoading: boolean;
  isAuthenticated: boolean;
  authRole: Role;
  urlRole?: Role;
}

/**
 * 統一社區牆角色計算：
 * 1. auth loading 一律先當 guest
 * 2. demo mode 一律用 resident，確保示範互動完整開放
 * 3. 開發環境可用 URL role 覆蓋
 * 4. 其餘情況走真實 auth role
 */
export function useEffectiveRole({
  mode,
  authLoading,
  isAuthenticated,
  authRole,
  urlRole,
}: UseEffectiveRoleOptions): Role {
  return useMemo<Role>(() => {
    if (authLoading) return 'guest';
    if (mode === 'demo') return 'resident';
    if (import.meta.env.DEV && urlRole) return urlRole;
    return isAuthenticated ? authRole : 'guest';
  }, [authLoading, authRole, isAuthenticated, mode, urlRole]);
}
