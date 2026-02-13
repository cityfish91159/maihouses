import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

const mockUsePageMode = vi.fn<() => 'visitor' | 'demo' | 'live'>();

const notifyMocks = vi.hoisted(() => ({
  info: vi.fn(),
}));

const maimaiContextMocks = vi.hoisted(() => ({
  addMessage: vi.fn(),
  setMood: vi.fn(),
}));

vi.mock('../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../lib/notify', () => ({
  notify: {
    info: notifyMocks.info,
  },
}));

vi.mock('../../context/MaiMaiContext', () => ({
  useMaiMai: () => maimaiContextMocks,
}));

vi.mock('../MaiMai', () => ({
  MaiMaiBase: () => <div data-testid="maimai-base" />,
}));

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

describe('Header + DemoGate integration', () => {
  beforeEach(() => {
    mockUsePageMode.mockReset();
    mockUsePageMode.mockReturnValue('visitor');
    notifyMocks.info.mockReset();
    maimaiContextMocks.addMessage.mockReset();
    maimaiContextMocks.setMood.mockReset();

    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it('visitor 點 Logo 一次不應被攔截（保留按鈕預設行為）', () => {
    const { getByRole } = render(<Header />);
    const logoButton = getByRole('button', { name: /邁房子/ });

    const isCanceled = wasCanceledByHandler(logoButton);

    expect(isCanceled).toBe(false);
    expect(notifyMocks.info).not.toHaveBeenCalled();
  });

  it('visitor 點 Logo 五次時，第五次應觸發 DemoGate 攔截', () => {
    const { getByRole } = render(<Header />);
    const logoButton = getByRole('button', { name: /邁房子/ });

    for (let index = 0; index < 4; index += 1) {
      const canceled = wasCanceledByHandler(logoButton);
      expect(canceled).toBe(false);
    }

    const canceledOnFifth = wasCanceledByHandler(logoButton);
    expect(canceledOnFifth).toBe(true);
    expect(notifyMocks.info).toHaveBeenCalledWith(
      '已解鎖演示模式',
      '點擊「進入演示」後會重新整理頁面。',
      expect.any(Object)
    );
  });

  it('demo 模式點登入應被攔截並顯示提示', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { container } = render(<Header />);

    const loginAnchor = container.querySelector('a[href*="auth.html?mode=login"]');
    expect(loginAnchor).not.toBeNull();

    if (!loginAnchor) {
      throw new Error('login anchor not found');
    }

    const isCanceled = wasCanceledByHandler(loginAnchor);
    expect(isCanceled).toBe(true);
    expect(notifyMocks.info).toHaveBeenCalledWith(
      '演示模式中暫停登入',
      '演示期間不開放登入，請先完成體驗。'
    );
  });
});
