import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CallConfirmPanel } from '../CallConfirmPanel';
import { notify } from '../../../lib/notify';
import { track } from '../../../analytics/track';

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));
vi.mock('../../../lib/notify', () => ({
  notify: {
    warning: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock('../../../analytics/track', () => ({
  track: vi.fn().mockResolvedValue(undefined),
}));

describe('CallConfirmPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有電話時點擊會導向 tel:', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const originalLocation = window.location;
    const originalUserAgent = window.navigator.userAgent;

    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'iPhone',
    });

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={onClose}
        agentPhone="0912-345-678"
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: '撥打電話' }));

    expect(window.location.href).toBe('tel:0912345678');
    expect(track).toHaveBeenCalledWith(
      'call_dial_attempt',
      expect.objectContaining({ has_phone: true, mode: 'tel' })
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
  });

  it('桌面裝置會改為複製電話而非直接 tel: 跳轉', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const clipboard = { writeText } as Pick<Clipboard, 'writeText'>;
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={onClose}
        agentPhone="0912-345-678"
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: '撥打電話' }));

    expect(writeText).toHaveBeenCalledWith('0912-345-678');
    expect(notify.info).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('桌面複製失敗時應改用提示文案 fallback', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
    const clipboard = { writeText } as Pick<Clipboard, 'writeText'>;
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={onClose}
        agentPhone="0912-345-678"
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: '撥打電話' }));

    expect(writeText).toHaveBeenCalledWith('0912-345-678');
    expect(notify.info).toHaveBeenCalledWith('請使用手機撥打', '0912-345-678');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('無電話時會走 fallback 聯絡流程', async () => {
    const user = userEvent.setup();
    const onFallbackContact = vi.fn();
    const onClose = vi.fn();

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={onClose}
        agentName="測試房仲"
        isLoggedIn={false}
        trustEnabled={false}
        onFallbackContact={onFallbackContact}
      />
    );

    await user.type(screen.getByLabelText('你的電話'), '0912-345-678');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledWith(false);
    expect(track).toHaveBeenCalledWith(
      'call_dial_attempt',
      expect.objectContaining({ has_phone: false })
    );
  });

  it('勾選安心留痕後會把 checked=true 傳給 onTrustAction', async () => {
    const user = userEvent.setup();
    const onTrustAction = vi.fn().mockResolvedValue(undefined);

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone="0912345678"
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
        onTrustAction={onTrustAction}
      />
    );

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '撥打電話' }));

    expect(onTrustAction).toHaveBeenCalledWith(true);
  });

  it('電話格式不合法時會導向 fallback 並提示', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onFallbackContact = vi.fn();

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={onClose}
        agentPhone="bad-phone"
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
        onFallbackContact={onFallbackContact}
      />
    );

    await user.click(screen.getByRole('button', { name: '撥打電話' }));

    expect(notify.warning).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledWith(false);
  });

  it('無電話且勾選安心留痕時，fallback 應收到 checked=true', async () => {
    const user = userEvent.setup();
    const onFallbackContact = vi.fn();

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        isLoggedIn={true}
        trustEnabled={false}
        onFallbackContact={onFallbackContact}
      />
    );

    await user.click(screen.getByRole('checkbox'));
    await user.type(screen.getByLabelText('你的電話'), '0912-222-333');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(onFallbackContact).toHaveBeenCalledWith(true);
  });
});
