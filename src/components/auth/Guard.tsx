/**
 * RequirePermission Guard Component
 * 
 * 下一代的權限守衛組件
 * 用於包裹需要特定權限的 UI 區塊
 */

import React from 'react';
import { usePermission } from '../../hooks/usePermission';
import { Permission } from '../../types/permissions';

interface RequirePermissionProps {
    permission: Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RequirePermission({
    permission,
    children,
    fallback = null
}: RequirePermissionProps) {
    const { hasPermission } = usePermission();

    if (!hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
