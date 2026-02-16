import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useEffectiveRole, type UseEffectiveRoleOptions } from '../useEffectiveRole';

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

  it('允許覆蓋時使用 urlRole', () => {
    const { result } = renderHook(() =>
      useEffectiveRole({
        ...baseOptions,
        urlRole: 'member',
        allowUrlRoleOverride: true,
      })
    );

    expect(result.current).toBe('member');
  });

  it('不允許覆蓋時忽略 urlRole', () => {
    const { result } = renderHook(() =>
      useEffectiveRole({
        ...baseOptions,
        urlRole: 'member',
        allowUrlRoleOverride: false,
      })
    );

    expect(result.current).toBe('guest');
  });
});
