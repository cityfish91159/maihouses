import { useMemo } from 'react';
import type { Role } from '../types/community';
import type { PageMode } from './usePageMode';

export interface UseEffectiveRoleOptions {
  mode: PageMode;
  authLoading: boolean;
  isAuthenticated: boolean;
  authRole: Role;
  devRole?: Role;
}

/** @internal */
interface _ResolveEffectiveRoleOptions extends UseEffectiveRoleOptions {
  isDev: boolean;
}

/**
 * 計算社區牆最終角色。
 *
 * 規則優先序：
 * 1. authLoading 時固定 `guest`
 * 2. demo mode 固定 `resident`
 * 3. 開發環境（`isDev === true`）可用 `devRole` 覆蓋
 * 4. 其餘依登入狀態回傳 `authRole` 或 `guest`
 *
 * @param options - 角色判斷所需輸入
 * @returns 最終生效角色
 */
export function resolveEffectiveRole({
  mode,
  authLoading,
  isAuthenticated,
  authRole,
  devRole,
  isDev,
}: _ResolveEffectiveRoleOptions): Role {
  if (authLoading) return 'guest';
  if (mode === 'demo') return 'resident';
  if (isDev && devRole) return devRole;
  return isAuthenticated ? authRole : 'guest';
}

/**
 * @param options - 角色判斷所需輸入
 * @returns 最終生效角色（依 `resolveEffectiveRole` 規則）
 */
export function useEffectiveRole({
  mode,
  authLoading,
  isAuthenticated,
  authRole,
  devRole,
}: UseEffectiveRoleOptions): Role {
  return useMemo(
    () =>
      resolveEffectiveRole({
        mode,
        authLoading,
        isAuthenticated,
        authRole,
        isDev: import.meta.env.DEV,
        ...(devRole !== undefined ? { devRole } : {}),
      }),
    [authLoading, authRole, isAuthenticated, mode, devRole]
  );
}
