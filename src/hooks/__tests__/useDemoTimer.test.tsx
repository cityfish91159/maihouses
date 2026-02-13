import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDemoTimer } from '../useDemoTimer';

const modeState = {
  value: 'visitor' as 'visitor' | 'demo' | 'live',
};

const pageModeMocks = vi.hoisted(() => ({
  clearDemoMode: vi.fn(),
  getDemoRemainingMinutes: vi.fn(),
  getDemoTimeRemaining: vi.fn(),
  reloadPage: vi.fn(),
}));

const notifyMocks = vi.hoisted(() => ({
  info: vi.fn(),
}));

vi.mock('../usePageMode', () => ({
  usePageMode: () => modeState.value,
}));

vi.mock('../../lib/pageMode', () => ({
  DEMO_WARN_BEFORE_MS: 5 * 60 * 1000,
  clearDemoMode: pageModeMocks.clearDemoMode,
  getDemoRemainingMinutes: pageModeMocks.getDemoRemainingMinutes,
  getDemoTimeRemaining: pageModeMocks.getDemoTimeRemaining,
  reloadPage: pageModeMocks.reloadPage,
}));

vi.mock('../../lib/notify', () => ({
  notify: {
    info: notifyMocks.info,
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDemoTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    notifyMocks.info.mockReset();
    pageModeMocks.clearDemoMode.mockReset();
    pageModeMocks.getDemoRemainingMinutes.mockReset();
    pageModeMocks.getDemoTimeRemaining.mockReset();
    pageModeMocks.reloadPage.mockReset();
    modeState.value = 'visitor';
  });

  it('非 demo 模式不應啟動任何提醒或清理', () => {
    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    renderHook(() => useDemoTimer(), { wrapper: createWrapper(queryClient) });
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });

    expect(notifyMocks.info).not.toHaveBeenCalled();
    expect(pageModeMocks.clearDemoMode).not.toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(pageModeMocks.reloadPage).not.toHaveBeenCalled();
  });

  it('demo 模式應在 5 分鐘前提醒，並於到期時清理與 reload', () => {
    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    modeState.value = 'demo';
    pageModeMocks.getDemoTimeRemaining.mockReturnValue(10 * 60 * 1000);
    pageModeMocks.getDemoRemainingMinutes.mockReturnValue(5);

    renderHook(() => useDemoTimer(), { wrapper: createWrapper(queryClient) });

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(notifyMocks.info).toHaveBeenCalledWith('演示即將結束', '剩餘 5 分鐘');
    expect(pageModeMocks.clearDemoMode).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(pageModeMocks.clearDemoMode).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(pageModeMocks.reloadPage).toHaveBeenCalledTimes(1);
  });

  it('remaining < 30 秒時應跳過 warn，直接到期清理', () => {
    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    modeState.value = 'demo';
    pageModeMocks.getDemoTimeRemaining.mockReturnValue(10_000); // 10 秒

    renderHook(() => useDemoTimer(), { wrapper: createWrapper(queryClient) });

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(notifyMocks.info).not.toHaveBeenCalled();
    expect(pageModeMocks.clearDemoMode).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(pageModeMocks.reloadPage).toHaveBeenCalledTimes(1);
  });
});
