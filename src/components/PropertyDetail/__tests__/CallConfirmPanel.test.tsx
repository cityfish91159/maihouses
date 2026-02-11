import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('../../MaiMai', () => ({
  MaiMaiBase: ({ mood }: { mood: string }) => <div data-testid="maimai-base" data-mood={mood} />,
}));

const waitForPanelReady = () =>
  waitFor(() => {
    expect(screen.queryByTestId('call-panel-skeleton')).not.toBeInTheDocument();
  });

describe('CallConfirmPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton first and then shows panel content', async () => {
    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone="0912-345-678"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByTestId('call-panel-skeleton')).toBeInTheDocument();
    await waitForPanelReady();
    expect(screen.getByText('撥打電話前確認一下～')).toBeInTheDocument();
  });

  it('shows formatted phone number in dial card', async () => {
    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone="0912345678"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await waitForPanelReady();

    expect(await screen.findByText('0912-345-678')).toBeInTheDocument();
  });

  it('dials with tel scheme on mobile', async () => {
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
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await waitForPanelReady();
    await user.click(screen.getByRole('button', { name: /撥打電話/i }));

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

  it('shows inline validation error for invalid fallback phone', async () => {
    const user = userEvent.setup();
    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await waitForPanelReady();

    const input = screen.getByLabelText('你的電話');
    await user.type(input, '123');
    await user.tab();

    expect(screen.getByText(/請輸入有效電話號碼/)).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.className).toContain('border-red-500');
  });

  it('uses fallback form when agent phone is missing', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onFallbackContact = vi.fn();

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={onClose}
        agentName="游杰倫"
        isLoggedIn={false}
        trustEnabled={false}
        onFallbackContact={onFallbackContact}
      />
    );

    await waitForPanelReady();
    await user.type(screen.getByLabelText('你的電話'), '0912-345-678');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledWith(false);
    expect(track).toHaveBeenCalledWith(
      'call_dial_attempt',
      expect.objectContaining({ has_phone: false })
    );
  });

  it('uses stronger backdrop style with blur', () => {
    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement;
    expect(backdrop?.className).toContain('bg-black/60');
    expect(backdrop?.className).toContain('backdrop-blur-sm');
  });

  it('shows warning and stays open when trust action fails', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTrustAction = vi.fn().mockRejectedValue(new Error('trust failed'));

    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={onClose}
        agentPhone="0912-345-678"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
        onTrustAction={onTrustAction}
      />
    );

    await waitForPanelReady();
    await user.click(screen.getByRole('button', { name: /撥打電話/i }));

    expect(onTrustAction).toHaveBeenCalledTimes(1);
    expect(notify.warning).toHaveBeenCalledWith('操作未完成', '請稍後再試');
    expect(onClose).not.toHaveBeenCalled();
  });
});
