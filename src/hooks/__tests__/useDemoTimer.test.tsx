import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDemoTimer } from '../useDemoTimer';

const modeState = {
  value: 'visitor' as 'visitor' | 'demo' | 'live',
};

const pageModeMocks = vi.hoisted(() => ({
  exitDemoMode: vi.fn(),
  getDemoRemainingMinutes: vi.fn(),
  getDemoTimeRemaining: vi.fn(),
}));

const notifyMocks = vi.hoisted(() => ({
  info: vi.fn(),
}));

vi.mock('../usePageMode', () => ({
  usePageMode: () => modeState.value,
}));

vi.mock('../../lib/pageMode', () => ({
  DEMO_WARN_BEFORE_MS: 5 * 60 * 1000,
  exitDemoMode: pageModeMocks.exitDemoMode,
  getDemoRemainingMinutes: pageModeMocks.getDemoRemainingMinutes,
  getDemoTimeRemaining: pageModeMocks.getDemoTimeRemaining,
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
    pageModeMocks.exitDemoMode.mockReset();
    pageModeMocks.getDemoRemainingMinutes.mockReset();
    pageModeMocks.getDemoTimeRemaining.mockReset();
    modeState.value = 'visitor';
  });

  it('非 demo 模式不應啟動任何提醒或清理', () => {
    const queryClient = new QueryClient();

    renderHook(() => useDemoTimer(), { wrapper: createWrapper(queryClient) });
    act(() => {
      vi.advanceTimersByTime(30 * 60 * 1000);
    });

    expect(notifyMocks.info).not.toHaveBeenCalled();
    expect(pageModeMocks.exitDemoMode).not.toHaveBeenCalled();
  });

  it('demo 模式應在 5 分鐘前提醒，並於到期時執行退出流程', () => {
    const queryClient = new QueryClient();

    modeState.value = 'demo';
    pageModeMocks.getDemoTimeRemaining.mockReturnValue(10 * 60 * 1000);
    pageModeMocks.getDemoRemainingMinutes.mockReturnValue(5);

    renderHook(() => useDemoTimer(), { wrapper: createWrapper(queryClient) });

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(notifyMocks.info).toHaveBeenCalledWith('演示即將結束', '剩餘 5 分鐘');
    expect(pageModeMocks.exitDemoMode).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(pageModeMocks.exitDemoMode).toHaveBeenCalledTimes(1);
    expect(pageModeMocks.exitDemoMode).toHaveBeenCalledWith(queryClient);
  });

  it('remaining < 30 秒時應跳過 warn，直接到期退出', () => {
    const queryClient = new QueryClient();

    modeState.value = 'demo';
    pageModeMocks.getDemoTimeRemaining.mockReturnValue(10_000); // 10 秒

    renderHook(() => useDemoTimer(), { wrapper: createWrapper(queryClient) });

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(notifyMocks.info).not.toHaveBeenCalled();
    expect(pageModeMocks.exitDemoMode).toHaveBeenCalledTimes(1);
    expect(pageModeMocks.exitDemoMode).toHaveBeenCalledWith(queryClient);
  });

  it('demo 模式回前景且已過期時應立即退出', () => {
    const queryClient = new QueryClient();

    modeState.value = 'demo';
    pageModeMocks.getDemoTimeRemaining.mockReturnValueOnce(60_000).mockReturnValueOnce(0);
    const visibilitySpy = vi.spyOn(document, 'visibilityState', 'get');
    visibilitySpy.mockReturnValue('visible');

    renderHook(() => useDemoTimer(), { wrapper: createWrapper(queryClient) });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(pageModeMocks.exitDemoMode).toHaveBeenCalledTimes(1);
    expect(pageModeMocks.exitDemoMode).toHaveBeenCalledWith(queryClient);

    visibilitySpy.mockRestore();
  });
});
