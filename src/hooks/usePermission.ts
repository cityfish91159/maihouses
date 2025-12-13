/**
 * usePermission Hook (L7+ Optimized)
 * 
 * 統一的權限檢查 Hook
 * 整合 useAuth 身分狀態與 ROLE_PERMISSIONS 矩陣
 * 
 * 優化重點:
 * 1. O(1) 查詢: 使用 Set 取代 Array.includes
 * 2. 批量檢查: 支援 hasAny / hasAll
 * 3. 完整狀態: 正確處理 Loading 與 Unauthenticated
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Permission, ROLE_PERMISSIONS } from '../types/permissions';
import { Role } from '../types/community';

export function usePermission() {
    const { user, role, isAuthenticated, loading: authLoading } = useAuth();

    /**
     * 權限集合 (O(1) Lookup)
     * 根據當前角色動態產生權限 Set，並進行 Memoize 避免不必要的重算
     */
    const permissions = useMemo<Set<Permission>>(() => {
        if (!isAuthenticated || !role) {
            return new Set();
        }

        // P7-Audit-B1: Type Guard to avoid unsafe assertion
        const isValidRole = (r: unknown): r is Role => {
            return typeof r === 'string' && r in ROLE_PERMISSIONS;
        };

        const rolePermissions = isValidRole(role) ? ROLE_PERMISSIONS[role] : [];
        return new Set(rolePermissions);
    }, [isAuthenticated, role]);

    /**
     * 檢查當前用戶是否擁有指定權限
     * @param permission - 欲檢查的權限能力
     */
    const hasPermission = useCallback((permission: Permission): boolean => {
        return permissions.has(permission);
    }, [permissions]);

    /**
     * 檢查當前用戶是否擁有「任意一個」指定權限 (OR)
     * @param requiredPermissions - 權限陣列
     */
    const hasAnyPermission = useCallback((requiredPermissions: Permission[]): boolean => {
        return requiredPermissions.some(p => permissions.has(p));
    }, [permissions]);

    /**
     * 檢查當前用戶是否擁有「所有」指定權限 (AND)
     * @param requiredPermissions - 權限陣列
     */
    const hasAllPermissions = useCallback((requiredPermissions: Permission[]): boolean => {
        return requiredPermissions.every(p => permissions.has(p));
    }, [permissions]);

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        role,
        isAuthenticated,
        isLoading: authLoading, // Forward auth loading state
        permissions, // Expose raw Set for advanced usage (debugging)
    };
}
