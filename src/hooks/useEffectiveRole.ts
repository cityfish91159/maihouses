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

interface ResolveEffectiveRoleOptions extends UseEffectiveRoleOptions {
  isDev: boolean;
}

/**
 * 依規格推導社區牆有效角色。
 *
 * 規則優先序：
 * 1. auth loading 時固定 guest
 * 2. demo mode 時固定 resident
 * 3. 僅 DEV 環境可用 urlRole 覆蓋
 * 4. 其餘情況走 isAuthenticated ? authRole : guest
 */
export function resolveEffectiveRole({
  mode,
  authLoading,
  isAuthenticated,
  authRole,
  urlRole,
  isDev,
}: ResolveEffectiveRoleOptions): Role {
  if (authLoading) return 'guest';
  if (mode === 'demo') return 'resident';
  if (isDev && urlRole) return urlRole;
  return isAuthenticated ? authRole : 'guest';
}

/**
 * @param options - 角色推導所需的輸入條件
 * @returns 最終生效角色（依 `resolveEffectiveRole` 規則）
 */
export function useEffectiveRole({
  mode,
  authLoading,
  isAuthenticated,
  authRole,
  urlRole,
}: UseEffectiveRoleOptions): Role {
  return useMemo(() => {
    const baseOptions = {
      mode,
      authLoading,
      isAuthenticated,
      authRole,
      isDev: import.meta.env.DEV,
    };

    if (urlRole !== undefined) {
      return resolveEffectiveRole({
        ...baseOptions,
        urlRole,
      });
    }

    return resolveEffectiveRole(baseOptions);
  }, [authLoading, authRole, isAuthenticated, mode, urlRole]);
}
