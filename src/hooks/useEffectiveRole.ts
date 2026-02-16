import { useMemo } from 'react';
import type { Role } from '../types/community';
import type { PageMode } from './usePageMode';

export interface UseEffectiveRoleOptions {
  mode: PageMode;
  authLoading: boolean;
  isAuthenticated: boolean;
  authRole: Role;
  urlRole?: Role;
  allowUrlRoleOverride?: boolean;
}

/**
 * 統一社區牆角色計算（依優先序）：
 * 1. `authLoading === true` 時固定回傳 `guest`
 * 2. `mode === 'demo'` 時固定回傳 `resident`
 * 3. `allowUrlRoleOverride === true` 且有 `urlRole` 時回傳 `urlRole`
 * 4. 其餘情況回傳 `isAuthenticated ? authRole : 'guest'`
 *
 * @param options - 角色推導所需的輸入條件
 * @param options.mode - 目前頁面模式（visitor/demo/live）
 * @param options.authLoading - 認證狀態是否仍在載入中
 * @param options.isAuthenticated - 是否已登入
 * @param options.authRole - 由 auth/後端得出的角色
 * @param options.urlRole - 開發調試可覆蓋的角色
 * @param options.allowUrlRoleOverride - 是否允許 urlRole 覆蓋（建議由呼叫端控制）
 * @returns 最終生效角色
 */
export function useEffectiveRole({
  mode,
  authLoading,
  isAuthenticated,
  authRole,
  urlRole,
  allowUrlRoleOverride = false,
}: UseEffectiveRoleOptions): Role {
  return useMemo<Role>(() => {
    if (authLoading) return 'guest';
    if (mode === 'demo') return 'resident';
    if (allowUrlRoleOverride && urlRole) return urlRole;
    return isAuthenticated ? authRole : 'guest';
  }, [allowUrlRoleOverride, authLoading, authRole, isAuthenticated, mode, urlRole]);
}
