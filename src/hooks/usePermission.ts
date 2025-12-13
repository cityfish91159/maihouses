/**
 * usePermission Hook
 * 
 * 統一的權限檢查 Hook
 * 整合 useAuth 身分狀態與 ROLE_PERMISSIONS 矩陣
 */

import { useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Permission, ROLE_PERMISSIONS } from '../types/permissions';
import { Role } from '../types/community';

export function usePermission() {
    const { user, role, isAuthenticated } = useAuth();

    /**
     * 檢查當前用戶是否擁有指定權限
     * @param permission - 欲檢查的權限能力
     * @returns boolean
     */
    const hasPermission = useCallback((permission: Permission): boolean => {
        // 1. 未登入或是無效角色，直接拒絕
        if (!isAuthenticated || !role || !ROLE_PERMISSIONS[role as Role]) {
            return false;
        }

        // 2. 查表確認角色是否擁有該權限
        const userPermissions = ROLE_PERMISSIONS[role as Role];
        return userPermissions.includes(permission);
    }, [isAuthenticated, role]);

    /**
     * 檢查當前用戶是否擁有任意一個指定權限
     * @param permissions - 權限陣列
     */
    const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
        return permissions.some(hasPermission);
    }, [hasPermission]);

    return {
        hasPermission,
        hasAnyPermission,
        role,
        isAuthenticated
    };
}
