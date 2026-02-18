import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDemoExit } from '../useDemoExit';

const pageModeMocks = vi.hoisted(() => ({
  exitDemoMode: vi.fn(),
}));

const notifyMocks = vi.hoisted(() => ({
  dismiss: vi.fn(),
  info: vi.fn(),
}));

vi.mock('../../lib/pageMode', () => ({
  exitDemoMode: pageModeMocks.exitDemoMode,
}));

vi.mock('../../lib/notify', () => ({
  notify: {
    dismiss: notifyMocks.dismiss,
    info: notifyMocks.info,
  },
}));

interface DemoExitToastAction {
  label: string;
  onClick: () => void;
}

function parseToastAction(value: unknown): DemoExitToastAction | null {
  if (typeof value !== 'object' || value === null) return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj['label'] !== 'string') return null;
  if (typeof obj['onClick'] !== 'function') return null;
  return { label: obj['label'], onClick: obj['onClick'] as () => void };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDemoExit', () => {
  beforeEach(() => {
    pageModeMocks.exitDemoMode.mockReset();
    notifyMocks.dismiss.mockReset();
    notifyMocks.info.mockReset();
  });

  it('requestDemoExit 應顯示確認 toast', () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => useDemoExit(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.requestDemoExit();
    });

    expect(notifyMocks.info).toHaveBeenCalledTimes(1);
    expect(notifyMocks.info).toHaveBeenCalledWith(
      '確定退出演示模式？',
      '退出後將返回訪客首頁。',
      expect.objectContaining({
        id: 'demo-exit-confirm',
        duration: Number.POSITIVE_INFINITY,
      })
    );
  });

  it('點擊 toast action 應執行退出流程', () => {
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useDemoExit(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.requestDemoExit();
    });

    const toastCall = notifyMocks.info.mock.calls[0];
    const thirdArg = toastCall?.[2] as Record<string, unknown> | undefined;
    const action = parseToastAction(thirdArg?.['action']);
    expect(action).not.toBeNull();
    expect(action?.label).toBe('確定退出');

    act(() => {
      action?.onClick();
    });

    expect(notifyMocks.dismiss).toHaveBeenCalledWith('demo-exit-confirm');
    expect(pageModeMocks.exitDemoMode).toHaveBeenCalledTimes(1);
    expect(pageModeMocks.exitDemoMode).toHaveBeenCalledWith(queryClient);
  });
});
