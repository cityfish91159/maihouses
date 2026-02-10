import { render, screen, waitFor } from '@testing-library/react';
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

  it('renders accessible dialog', () => {
    render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentLineId="maihouses_demo"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('shows panel welcome copy for both with/without line id', () => {
    const { rerender } = render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentLineId="maihouses_demo"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByText('加 LINE 直接聊，回覆最快喔！')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      'maimai_panel_welcome',
      expect.objectContaining({ panelType: 'line', hasContact: true })
    );

    rerender(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByText('房仲還沒設定 LINE，用表單留言吧')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      'maimai_panel_welcome',
      expect.objectContaining({ panelType: 'line', hasContact: false })
    );
  });

  it('opens LINE deep link when line id exists', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const openSpy = vi.fn().mockReturnValue({ closed: false });
    vi.spyOn(window, 'open').mockImplementation(openSpy);

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentLineId="maihouses_demo"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: /開啟 LINE/i }));

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

  it('uses fallback flow when line id is missing', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onFallbackContact = vi.fn();

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentName="游杰倫"
        isLoggedIn={false}
        trustEnabled={false}
        onFallbackContact={onFallbackContact}
      />
    );

    await user.type(screen.getByLabelText('你的 LINE ID'), 'demo_line_01');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledWith(false);
    expect(track).toHaveBeenCalledWith(
      'line_deeplink_open',
      expect.objectContaining({ has_line_id: false, user_line_id_provided: true })
    );
  });

  it('supports panel slide-in animation classes', async () => {
    render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('duration-200');
    await waitFor(() => {
      expect(dialog.className).toContain('translate-y-0');
      expect(dialog.className).toContain('opacity-100');
    });
  });

  it('applies reduced-motion transition classes to fallback controls', () => {
    render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={false}
      />
    );

    const fallbackButton = screen.getByRole('button', { name: '改用聯絡表單' });
    const fallbackInput = screen.getByLabelText('你的 LINE ID');
    expect(fallbackButton.className).toContain('motion-reduce:transition-none');
    expect(fallbackInput.className).toContain('motion-reduce:transition-none');
  });

  it('closes when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentLineId="maihouses_demo"
        agentName="游杰倫"
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

  it('wires focus trap escape handler to onClose', () => {
    const onClose = vi.fn();

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentLineId="maihouses_demo"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const focusTrapMock = vi.mocked(useFocusTrap);
    const config = focusTrapMock.mock.calls[0]?.[0];
    config?.onEscape?.();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to location.href when popup is blocked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue(null);

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '' },
    });

    render(
      <LineLinkPanel
        isOpen={true}
        onClose={onClose}
        agentLineId="maihouses_demo"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: /開啟 LINE/i }));

    expect(window.location.href).toBe('https://line.me/R/ti/p/maihouses_demo');
    expect(notify.info).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
});
