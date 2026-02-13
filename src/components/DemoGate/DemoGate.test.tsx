import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemoGate } from './DemoGate';

const mockUsePageMode = vi.fn<() => 'visitor' | 'demo' | 'live'>();

const pageModeMocks = vi.hoisted(() => ({
  reloadPage: vi.fn(),
  setDemoMode: vi.fn(),
}));

const notifyMocks = vi.hoisted(() => ({
  dismiss: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));

vi.mock('../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../lib/pageMode', () => ({
  reloadPage: pageModeMocks.reloadPage,
  setDemoMode: pageModeMocks.setDemoMode,
}));

vi.mock('../../lib/notify', () => ({
  notify: {
    dismiss: notifyMocks.dismiss,
    error: notifyMocks.error,
    info: notifyMocks.info,
  },
}));

interface DemoToastOptions {
  id?: string | number;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function wasCanceledByHandler(target: Element): boolean {
  let wasPrevented = false;

  window.addEventListener(
    'click',
    (event) => {
      wasPrevented = event.defaultPrevented;
      event.preventDefault();
    },
    { once: true }
  );

  fireEvent.click(target);
  return wasPrevented;
}

function parseDemoToastAction(value: unknown): { label: string; onClick: () => void } | null {
  if (typeof value !== 'object' || value === null) return null;
  if (!('label' in value) || !('onClick' in value)) return null;
  if (typeof value.label !== 'string') return null;
  if (typeof value.onClick !== 'function') return null;

  const rawOnClick = value.onClick;

  return {
    label: value.label,
    onClick: () => {
      rawOnClick();
    },
  };
}

function parseDemoToastOptions(value: unknown): DemoToastOptions | null {
  if (typeof value !== 'object' || value === null) return null;

  const actionValue = 'action' in value ? value.action : undefined;
  const action = parseDemoToastAction(actionValue);
  if (!action) return null;

  const idValue = 'id' in value ? value.id : undefined;
  const durationValue = 'duration' in value ? value.duration : undefined;

  if (idValue !== undefined && typeof idValue !== 'string' && typeof idValue !== 'number') return null;
  if (durationValue !== undefined && typeof durationValue !== 'number') return null;

  const options: DemoToastOptions = { action };
  if (idValue !== undefined) options.id = idValue;
  if (durationValue !== undefined) options.duration = durationValue;

  return options;
}

describe('DemoGate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-13T00:00:00.000Z'));
    mockUsePageMode.mockReset();
    mockUsePageMode.mockReturnValue('visitor');
    pageModeMocks.reloadPage.mockReset();
    pageModeMocks.setDemoMode.mockReset();
    pageModeMocks.setDemoMode.mockReturnValue(true);
    notifyMocks.dismiss.mockReset();
    notifyMocks.error.mockReset();
    notifyMocks.info.mockReset();
  });

  it('5 連按（1500ms 內）會觸發 demo 確認 toast', () => {
    render(
      <DemoGate>
        <button type="button">logo</button>
      </DemoGate>
    );

    const logoButton = screen.getByRole('button', { name: 'logo' });
    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(logoButton);
      act(() => {
        vi.advanceTimersByTime(200);
      });
    }

    expect(notifyMocks.info).toHaveBeenCalledTimes(1);
    expect(notifyMocks.info).toHaveBeenCalledWith(
      '已解鎖演示模式',
      '點擊「進入演示」後會重新整理頁面。',
      expect.objectContaining({
        id: 'demo-gate-confirm',
        duration: Number.POSITIVE_INFINITY,
      })
    );
  });

  it('未達 5 次或超過 1500ms 視窗不應觸發', () => {
    render(
      <DemoGate>
        <button type="button">logo</button>
      </DemoGate>
    );

    const logoButton = screen.getByRole('button', { name: 'logo' });

    for (let index = 0; index < 4; index += 1) {
      fireEvent.click(logoButton);
      act(() => {
        vi.advanceTimersByTime(250);
      });
    }

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    fireEvent.click(logoButton);

    expect(notifyMocks.info).not.toHaveBeenCalled();
    expect(pageModeMocks.setDemoMode).not.toHaveBeenCalled();
  });

  it('visitor 模式在未達門檻前不應取消子元素預設行為', () => {
    render(
      <DemoGate>
        <a href="/maihouses/">logo-link</a>
      </DemoGate>
    );

    const logoLink = screen.getByRole('link', { name: 'logo-link' });

    for (let index = 0; index < 4; index += 1) {
      const canceled = wasCanceledByHandler(logoLink);
      expect(canceled).toBe(false);
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }

    const isCanceledOnThreshold = wasCanceledByHandler(logoLink);
    expect(isCanceledOnThreshold).toBe(true);
    expect(notifyMocks.info).toHaveBeenCalledTimes(1);
  });

  it('點擊 toast action 後應執行 setDemoMode + reload', () => {
    render(
      <DemoGate>
        <button type="button">logo</button>
      </DemoGate>
    );

    const logoButton = screen.getByRole('button', { name: 'logo' });
    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(logoButton);
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }

    const toastCall = notifyMocks.info.mock.calls[0];
    const options = parseDemoToastOptions(toastCall?.[2]);
    expect(options).not.toBeNull();
    expect(options?.action?.label).toBe('進入演示');

    options?.action?.onClick();

    expect(notifyMocks.dismiss).toHaveBeenCalledWith('demo-gate-confirm');
    expect(pageModeMocks.setDemoMode).toHaveBeenCalledTimes(1);
    expect(pageModeMocks.reloadPage).toHaveBeenCalledTimes(1);
  });

  it.each(['demo', 'live'] as const)('%s 模式下不應觸發', (mode) => {
    mockUsePageMode.mockReturnValue(mode);
    render(
      <DemoGate>
        <button type="button">logo</button>
      </DemoGate>
    );

    const logoButton = screen.getByRole('button', { name: 'logo' });
    for (let index = 0; index < 8; index += 1) {
      fireEvent.click(logoButton);
    }

    expect(notifyMocks.info).not.toHaveBeenCalled();
    expect(pageModeMocks.setDemoMode).not.toHaveBeenCalled();
    expect(pageModeMocks.reloadPage).not.toHaveBeenCalled();
  });

  it('觸發後應有 shake class，500ms 後移除', () => {
    render(
      <DemoGate>
        <span data-testid="logo-text">logo</span>
      </DemoGate>
    );

    const child = screen.getByTestId('logo-text');
    const gateWrapper = child.parentElement;
    expect(gateWrapper).not.toBeNull();
    expect(gateWrapper).not.toHaveClass('motion-safe:animate-shake');

    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(child);
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }

    expect(gateWrapper).toHaveClass('motion-safe:animate-shake');

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(gateWrapper).not.toHaveClass('motion-safe:animate-shake');
  });
});
