
import { render, screen } from '@testing-library/react';
import { RequirePermission } from '../Guard';
import { Permission } from '../../../types/permissions';
import { vi, describe, it, expect } from 'vitest';
import { usePermission } from '../../../hooks/usePermission';

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

describe('RequirePermission', () => {
    it('should render children when permission is granted', () => {
        (usePermission as any).mockReturnValue({
            hasPermission: () => true
        });

        render(
            <RequirePermission permission={Permission.VIEW_PRIVATE_WALL}>
                <div>Protected Content</div>
            </RequirePermission>
        );

        expect(screen.getByText('Protected Content')).toBeDefined();
    });

    it('should render fallback when permission is denied', () => {
        (usePermission as any).mockReturnValue({
            hasPermission: () => false
        });

        render(
            <RequirePermission
                permission={Permission.VIEW_PRIVATE_WALL}
                fallback={<div>Access Denied</div>}
            >
                <div>Protected Content</div>
            </RequirePermission>
        );

        expect(screen.queryByText('Protected Content')).toBeNull();
        expect(screen.getByText('Access Denied')).toBeDefined();
    });
});
