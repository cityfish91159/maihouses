import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';

const mockUsePageMode = vi.fn<() => 'visitor' | 'demo' | 'live'>();

const notifyMocks = vi.hoisted(() => ({
  info: vi.fn(),
}));

const demoExitMocks = vi.hoisted(() => ({
  requestDemoExit: vi.fn(),
}));

const maimaiContextMocks = vi.hoisted(() => ({
  addMessage: vi.fn(),
  setMood: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null,
  role: 'guest' as const,
  signOut: vi.fn(),
  loading: false,
}));

vi.mock('../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => authMocks,
}));

vi.mock('../../hooks/useDemoExit', () => ({
  useDemoExit: () => demoExitMocks,
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
    demoExitMocks.requestDemoExit.mockReset();
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
    const logoButton = getByRole('link', { name: /邁房子/ });

    const isCanceled = wasCanceledByHandler(logoButton);

    expect(isCanceled).toBe(false);
    expect(notifyMocks.info).not.toHaveBeenCalled();
  });

  it('visitor 點 Logo 五次時，第五次應觸發 DemoGate 攔截', () => {
    const { getByRole } = render(<Header />);
    const logoButton = getByRole('link', { name: /邁房子/ });

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

  it('demo 模式不應顯示登入/註冊按鈕', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { container } = render(<Header />);

    const loginAnchor = container.querySelector('a[href*="auth.html?mode=login"]');
    const signupAnchor = container.querySelector('a[href*="auth.html?mode=signup"]');
    expect(loginAnchor).toBeNull();
    expect(signupAnchor).toBeNull();
  });

  it('demo 模式應顯示退出演示按鈕', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { getByRole } = render(<Header />);

    const exitButton = getByRole('button', { name: /退出演示/ });
    expect(exitButton).toBeDefined();
  });

  it('點擊退出演示按鈕應呼叫 requestDemoExit', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { getByRole } = render(<Header />);

    const exitButton = getByRole('button', { name: /退出演示/ });
    fireEvent.click(exitButton);

    expect(demoExitMocks.requestDemoExit).toHaveBeenCalledTimes(1);
  });
});
