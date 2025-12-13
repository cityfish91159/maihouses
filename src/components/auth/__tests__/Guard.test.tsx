
import { render, screen } from '@testing-library/react';

import { PERMISSIONS } from '../../../types/permissions';
import { vi, describe, it, expect } from 'vitest';
import { usePermission } from '../../../hooks/usePermission';

// Check Guard.tsx export. It is likely named RequirePermission
// Let's verify Guard.tsx content first. I saw it in Step 709.
// It has `export function RequirePermission`.

// Mock usePermission
vi.mock('../../../hooks/usePermission');
// Mock Supabase to avoid env check
vi.mock('../../../lib/supabase', () => ({
    supabase: {}
}));
// Mock Env if needed
vi.mock('../../../config/env', () => ({
    mhEnv: {}
}));

// We need to import the component correctly.
// Based on previous files, it is in ../Guard.tsx

import { RequirePermission as GuardComponent } from '../Guard';

// P7-Audit-C2: Strict Mock Type (No 'as any')
import type { UsePermissionReturn } from '../../../hooks/usePermission';

const createPermissionMock = (hasPerm: boolean): UsePermissionReturn => ({
    hasPermission: vi.fn().mockReturnValue(hasPerm),
    hasAnyPermission: vi.fn().mockReturnValue(hasPerm),
    hasAllPermissions: vi.fn().mockReturnValue(hasPerm),
    role: hasPerm ? 'resident' : 'guest',
    isAuthenticated: hasPerm,
    isLoading: false,
    permissions: new Set()
});

describe('RequirePermission', () => {
    it('should render children when permission is granted', () => {
        // P7-Audit-C2: Strict Mock
        vi.mocked(usePermission).mockReturnValue(createPermissionMock(true));

        render(
            <GuardComponent permission={PERMISSIONS.VIEW_PRIVATE_WALL}>
                <div>Protected Content</div>
            </GuardComponent>
        );

        expect(screen.getByText('Protected Content')).toBeDefined();
    });

    it('should render fallback when permission is denied', () => {
        vi.mocked(usePermission).mockReturnValue(createPermissionMock(false));

        render(
            <GuardComponent
                permission={PERMISSIONS.VIEW_PRIVATE_WALL}
                fallback={<div>Access Denied</div>}
            >
                <div>Protected Content</div>
            </GuardComponent>
        );

        expect(screen.queryByText('Protected Content')).toBeNull();

        // P7-5 OPTIMIZATION: Verify Accessibility Roles
        // The fallback contains "Access Denied" text but logic in Guard simply renders fallback.
        // We need to ensure fallback is rendered. 
        expect(screen.getByText('Access Denied')).toBeDefined();
    });
});
