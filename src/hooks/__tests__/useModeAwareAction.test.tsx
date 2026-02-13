import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useModeAwareAction } from '../useModeAwareAction';
import type { PageMode } from '../usePageMode';

const mockUsePageMode = vi.fn<() => PageMode>();

vi.mock('../usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

describe('useModeAwareAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches to visitor handler', async () => {
    mockUsePageMode.mockReturnValue('visitor');
    const visitor = vi.fn();
    const demo = vi.fn();
    const live = vi.fn();

    const { result } = renderHook(() =>
      useModeAwareAction<number>({
        visitor,
        demo,
        live,
      })
    );

    let output: Awaited<ReturnType<typeof result.current>> | null = null;
    await act(async () => {
      output = await result.current(42);
    });

    expect(visitor).toHaveBeenCalledWith(42);
    expect(demo).not.toHaveBeenCalled();
    expect(live).not.toHaveBeenCalled();
    expect(output).toEqual({ ok: true });
  });

  it('dispatches to demo handler', async () => {
    mockUsePageMode.mockReturnValue('demo');
    const visitor = vi.fn();
    const demo = vi.fn();
    const live = vi.fn();

    const { result } = renderHook(() =>
      useModeAwareAction<string>({
        visitor,
        demo,
        live,
      })
    );

    await act(async () => {
      await result.current('demo-value');
    });

    expect(visitor).not.toHaveBeenCalled();
    expect(demo).toHaveBeenCalledWith('demo-value');
    expect(live).not.toHaveBeenCalled();
  });

  it('dispatches to live handler', async () => {
    mockUsePageMode.mockReturnValue('live');
    const visitor = vi.fn();
    const demo = vi.fn();
    const live = vi.fn();

    const { result } = renderHook(() =>
      useModeAwareAction<{ id: string }>({
        visitor,
        demo,
        live,
      })
    );

    await act(async () => {
      await result.current({ id: 'abc' });
    });

    expect(visitor).not.toHaveBeenCalled();
    expect(demo).not.toHaveBeenCalled();
    expect(live).toHaveBeenCalledWith({ id: 'abc' });
  });

  it('handles async resolve and reject handlers', async () => {
    mockUsePageMode.mockReturnValue('demo');
    const successDemo = vi.fn().mockResolvedValue(undefined);
    const failDemo = vi.fn().mockRejectedValue(new Error('async-failed'));

    const successHook = renderHook(() =>
      useModeAwareAction<string>({
        visitor: vi.fn(),
        demo: successDemo,
        live: vi.fn(),
      })
    );

    const failHook = renderHook(() =>
      useModeAwareAction<string>({
        visitor: vi.fn(),
        demo: failDemo,
        live: vi.fn(),
      })
    );

    await act(async () => {
      await expect(successHook.result.current('ok')).resolves.toEqual({ ok: true });
      await expect(failHook.result.current('ng')).resolves.toEqual({
        ok: false,
        error: 'async-failed',
      });
    });
  });

  it('returns normalized error for non-Error throws', async () => {
    mockUsePageMode.mockReturnValue('visitor');

    const { result, rerender } = renderHook(
      ({ thrown }: { thrown: unknown }) =>
        useModeAwareAction({
          visitor: () => {
            throw thrown;
          },
          demo: vi.fn(),
          live: vi.fn(),
        }),
      {
        initialProps: { thrown: 'boom-string' as unknown },
      }
    );

    await act(async () => {
      await expect(result.current(undefined)).resolves.toEqual({
        ok: false,
        error: 'boom-string',
      });
    });

    rerender({ thrown: null });
    await act(async () => {
      await expect(result.current(undefined)).resolves.toEqual({
        ok: false,
        error: 'Unknown error',
      });
    });

    rerender({ thrown: undefined });
    await act(async () => {
      await expect(result.current(undefined)).resolves.toEqual({
        ok: false,
        error: 'Unknown error',
      });
    });
  });

  it('supports void payload action', async () => {
    mockUsePageMode.mockReturnValue('visitor');
    const visitor = vi.fn();

    const { result } = renderHook(() =>
      useModeAwareAction<void>({
        visitor,
        demo: vi.fn(),
        live: vi.fn(),
      })
    );

    await act(async () => {
      await result.current();
    });

    expect(visitor).toHaveBeenCalledTimes(1);
  });

  it('dispatches to updated mode after rerender', async () => {
    let mode: PageMode = 'visitor';
    mockUsePageMode.mockImplementation(() => mode);

    const visitor = vi.fn();
    const demo = vi.fn();
    const live = vi.fn();

    const { result, rerender } = renderHook(() =>
      useModeAwareAction<string>({
        visitor,
        demo,
        live,
      })
    );

    await act(async () => {
      await result.current('v');
    });

    mode = 'demo';
    rerender();
    await act(async () => {
      await result.current('d');
    });

    mode = 'live';
    rerender();
    await act(async () => {
      await result.current('l');
    });

    expect(visitor).toHaveBeenCalledWith('v');
    expect(demo).toHaveBeenCalledWith('d');
    expect(live).toHaveBeenCalledWith('l');
  });

  it('keeps stable action reference and uses latest handlers', async () => {
    mockUsePageMode.mockReturnValue('visitor');
    const visitorV1 = vi.fn();
    const visitorV2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ visitor }: { visitor: (data: string) => void }) =>
        useModeAwareAction<string>({
          visitor,
          demo: vi.fn(),
          live: vi.fn(),
        }),
      {
        initialProps: { visitor: visitorV1 },
      }
    );

    const firstAction = result.current;

    rerender({ visitor: visitorV2 });
    const secondAction = result.current;

    expect(secondAction).toBe(firstAction);

    await act(async () => {
      await secondAction('payload');
    });

    expect(visitorV1).not.toHaveBeenCalled();
    expect(visitorV2).toHaveBeenCalledWith('payload');
  });
});
