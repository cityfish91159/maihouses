import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineLinkPanel } from '../LineLinkPanel';
import { notify } from '../../../lib/notify';
import { track } from '../../../analytics/track';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

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

describe('LineLinkPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應帶有 dialog 語意並標示 aria-modal', () => {
    render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentLineId="maihouses_demo"
        agentName="測試經紀人"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('有 lineId 時點擊會開啟 LINE 連結', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const openSpy = vi.fn().mockReturnValue({ closed: false });
    vi.spyOn(window, 'open').mockImplementation(openSpy);

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentLineId="maihouses_demo"
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: '開啟 LINE' }));

    expect(openSpy).toHaveBeenCalledWith(
      'https://line.me/R/ti/p/maihouses_demo',
      '_blank',
      'noopener,noreferrer'
    );
    expect(track).toHaveBeenCalledWith(
      'line_deeplink_open',
      expect.objectContaining({ has_line_id: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('lineId 格式不合法時應走 fallback 聯絡流程', async () => {
    render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentLineId=" bad id<> "
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByRole('button', { name: '改用聯絡表單' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '開啟 LINE' })).not.toBeInTheDocument();
  });

  it('無 lineId 時會走 fallback 聯絡流程', async () => {
    const user = userEvent.setup();
    const onFallbackContact = vi.fn();
    const onClose = vi.fn();

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentName="測試房仲"
        isLoggedIn={false}
        trustEnabled={false}
        onFallbackContact={onFallbackContact}
      />
    );

    await user.type(screen.getByLabelText('你的 LINE ID'), 'demo_line_01');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledWith(false);
    expect(track).toHaveBeenCalledWith(
      'line_deeplink_open',
      expect.objectContaining({ has_line_id: false })
    );
  });

  it('勾選安心留痕後會把 checked=true 傳給 onTrustAction', async () => {
    const user = userEvent.setup();
    const onTrustAction = vi.fn().mockResolvedValue(undefined);

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentLineId="maihouses_demo"
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
        onTrustAction={onTrustAction}
      />
    );

    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '開啟 LINE' }));

    expect(onTrustAction).toHaveBeenCalledWith(true);
  });

  it('無 lineId 且勾選安心留痕時，fallback 應收到 checked=true', async () => {
    const user = userEvent.setup();
    const onFallbackContact = vi.fn();

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        isLoggedIn={true}
        trustEnabled={false}
        onFallbackContact={onFallbackContact}
      />
    );

    await user.click(screen.getByRole('checkbox'));
    await user.type(screen.getByLabelText('你的 LINE ID'), 'demo_line_02');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(onFallbackContact).toHaveBeenCalledWith(true);
  });

  it('彈窗被阻擋時會提示並改在同頁開啟 LINE', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const originalLocation = window.location;
    vi.spyOn(window, 'open').mockReturnValue(null);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentLineId="maihouses_demo"
        agentName="測試房仲"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: '開啟 LINE' }));

    expect(window.location.href).toBe('https://line.me/R/ti/p/maihouses_demo');
    expect(notify.info).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('點擊 backdrop 應關閉面板', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentLineId="maihouses_demo"
        agentName="測試經紀人"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement;
    expect(backdrop).not.toBeNull();
    if (!backdrop) return;
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('focus trap 的 onEscape 應可觸發關閉', () => {
    const onClose = vi.fn();

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentLineId="maihouses_demo"
        agentName="測試經紀人"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const focusTrapMock = vi.mocked(useFocusTrap);
    expect(focusTrapMock).toHaveBeenCalled();
    const config = focusTrapMock.mock.calls[0]?.[0];
    config?.onEscape?.();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
