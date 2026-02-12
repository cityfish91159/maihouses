import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEMO_STORAGE_KEY, setDemoMode } from '../../lib/pageMode';
import { usePageMode } from '../usePageMode';

const mockUseAuth = vi.fn();

vi.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('usePageMode (#1a)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
    });
  });

  it('未登入且非 demo 應回傳 visitor', () => {
    const { result } = renderHook(() => usePageMode());
    expect(result.current).toBe('visitor');
  });

  it('未登入且 demo 有效時應回傳 demo', () => {
    setDemoMode();
    const { result } = renderHook(() => usePageMode());
    expect(result.current).toBe('demo');
  });

  it('登入時應回傳 live 並清除 demo 狀態', async () => {
    setDemoMode();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePageMode());
    expect(result.current).toBe('live');

    await waitFor(() => {
      expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
    });
  });
});
