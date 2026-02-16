import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  resolveEffectiveRole,
  useEffectiveRole,
  type UseEffectiveRoleOptions,
} from '../useEffectiveRole';

const baseOptions: UseEffectiveRoleOptions = {
  mode: 'visitor',
  authLoading: false,
  isAuthenticated: false,
  authRole: 'guest',
};

describe('useEffectiveRole', () => {
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
        urlRole: 'agent',
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

  it('開發模式可用 urlRole 覆蓋（供調試）', () => {
    const result = resolveEffectiveRole({
      ...baseOptions,
      urlRole: 'member',
      isDev: true,
    });

    expect(result).toBe('member');
  });

  it('生產模式忽略 urlRole 覆蓋', () => {
    const result = resolveEffectiveRole({
      ...baseOptions,
      urlRole: 'member',
      isDev: false,
    });

    expect(result).toBe('guest');
  });
});
