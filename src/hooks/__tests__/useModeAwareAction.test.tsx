import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useModeAwareAction } from '../useModeAwareAction';

const mockUsePageMode = vi.fn();

vi.mock('../usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

describe('useModeAwareAction', () => {
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

  it('returns normalized error when handler fails', async () => {
    mockUsePageMode.mockReturnValue('visitor');
    const { result } = renderHook(() =>
      useModeAwareAction({
        visitor: () => {
          throw { error: { message: 'boom' } };
        },
        demo: vi.fn(),
        live: vi.fn(),
      })
    );

    let output: Awaited<ReturnType<typeof result.current>> | null = null;
    await act(async () => {
      output = await result.current(undefined);
    });

    expect(output).toEqual({ ok: false, error: 'boom' });
  });
});
