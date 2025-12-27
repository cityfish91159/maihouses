
import { renderHook } from '@testing-library/react';
import { usePermission } from '../usePermission';
import { PERMISSIONS } from '../../types/permissions';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../useAuth', () => ({
    useAuth: () => mockUseAuth()
}));

describe('usePermission', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should deny everything for guest', () => {
        mockUseAuth.mockReturnValue({ role: 'guest', isAuthenticated: false });
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission(PERMISSIONS.VIEW_PRIVATE_WALL)).toBe(false);
    });

    it('should deny private wall post for agent', () => {
        mockUseAuth.mockReturnValue({ role: 'agent', isAuthenticated: true });
        const { result } = renderHook(() => usePermission());

        // Agent can VIEW but NOT POST
        expect(result.current.hasPermission(PERMISSIONS.VIEW_PRIVATE_WALL)).toBe(true);
        expect(result.current.hasPermission(PERMISSIONS.POST_PRIVATE_WALL)).toBe(false);
    });

    it('should allow everything for resident', () => {
        mockUseAuth.mockReturnValue({ role: 'resident', isAuthenticated: true });
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission(PERMISSIONS.VIEW_PRIVATE_WALL)).toBe(true);
        expect(result.current.hasPermission(PERMISSIONS.POST_PRIVATE_WALL)).toBe(true);
    });

    it('should deny for unknown role', () => {
        mockUseAuth.mockReturnValue({ role: 'hacker', isAuthenticated: true });
        const { result } = renderHook(() => usePermission());

        expect(result.current.hasPermission(PERMISSIONS.VIEW_PRIVATE_WALL)).toBe(false);
    });

    // P7-Audit-C10: Test isLoading state
    it('should return isLoading true when auth is loading', () => {
        mockUseAuth.mockReturnValue({ role: undefined, isAuthenticated: false, loading: true });
        const { result } = renderHook(() => usePermission());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.hasPermission(PERMISSIONS.VIEW_PRIVATE_WALL)).toBe(false);
    });
});
