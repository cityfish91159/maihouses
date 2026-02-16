import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEffectiveRole, type UseEffectiveRoleOptions } from '../useEffectiveRole';

const baseOptions: UseEffectiveRoleOptions = {
  mode: 'visitor',
  authLoading: false,
  isAuthenticated: false,
  authRole: 'guest',
};

describe('useEffectiveRole', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('auth loading 時回傳 guest', () => {
    const { result } = renderHook(() =>
      useEffectiveRole({
        ...baseOptions,
        authLoading: true,
        authRole: 'agent',
        isAuthenticated: true,
      })
    );

    expect(result.current).toBe('guest');
  });

  it('demo mode 時一律回傳 resident', () => {
    const { result } = renderHook(() =>
      useEffectiveRole({
        ...baseOptions,
        mode: 'demo',
        devRole: 'agent',
      })
    );

    expect(result.current).toBe('resident');
  });

  it('live mode 且已登入時回傳 authRole', () => {
    const { result } = renderHook(() =>
      useEffectiveRole({
        ...baseOptions,
        mode: 'live',
        isAuthenticated: true,
        authRole: 'agent',
      })
    );

    expect(result.current).toBe('agent');
  });

  it('未登入且非 demo 時回傳 guest', () => {
    const { result } = renderHook(() => useEffectiveRole(baseOptions));
    expect(result.current).toBe('guest');
  });

  it('開發模式下可用 devRole 覆蓋（供調試）', () => {
    vi.stubEnv('DEV', true);

    const { result } = renderHook(() =>
      useEffectiveRole({
        ...baseOptions,
        devRole: 'member',
      })
    );

    expect(result.current).toBe('member');
  });

  it('生產模式下忽略 devRole 覆蓋', () => {
    vi.stubEnv('DEV', false);

    const { result } = renderHook(() =>
      useEffectiveRole({
        ...baseOptions,
        devRole: 'member',
      })
    );

    expect(result.current).toBe('guest');
  });
});
