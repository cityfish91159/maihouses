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

describe('CallConfirmPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows panel welcome copy for both with/without phone', () => {
    const { rerender } = render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone="0912-345-678"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByText('撥打電話前確認一下～')).toBeInTheDocument();
    expect(screen.getByTestId('maimai-base')).toHaveAttribute('data-mood', 'happy');
    expect(track).toHaveBeenCalledWith(
      'maimai_panel_welcome',
      expect.objectContaining({ panelType: 'call', hasContact: true })
    );

    rerender(
      <CallConfirmPanel
        isOpen={false}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    rerender(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone={null}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByText('房仲還沒設定電話，用表單留言吧')).toBeInTheDocument();
    expect(screen.getByTestId('maimai-base')).toHaveAttribute('data-mood', 'thinking');
    expect(track).toHaveBeenCalledWith(
      'maimai_panel_welcome',
      expect.objectContaining({ panelType: 'call', hasContact: false })
    );
  });

  it('tracks welcome once per open even if props change while open', () => {
    const { rerender } = render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone="0912-345-678"
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const initialTrackCalls = vi.mocked(track).mock.calls.filter(
      ([eventName]) => eventName === 'maimai_panel_welcome'
    ).length;
    expect(initialTrackCalls).toBe(1);

    rerender(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    const finalTrackCalls = vi.mocked(track).mock.calls.filter(
      ([eventName]) => eventName === 'maimai_panel_welcome'
    ).length;
    expect(finalTrackCalls).toBe(1);
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

  it('copies phone number on desktop when dialing', async () => {
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
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: /撥打電話/i }));

    expect(writeText).toHaveBeenCalledWith('0912-345-678');
    expect(notify.info).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
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

    await user.type(screen.getByLabelText('你的電話'), '0912-345-678');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledWith(false);
    expect(track).toHaveBeenCalledWith(
      'call_dial_attempt',
      expect.objectContaining({ has_phone: false })
    );
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

    await user.click(screen.getByRole('button', { name: /撥打電話/i }));

    expect(onTrustAction).toHaveBeenCalledTimes(1);
    expect(notify.warning).toHaveBeenCalledWith('操作未完成', '請稍後再試');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('supports panel slide-in animation classes', async () => {
    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={false}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('duration-200');
    await waitFor(() => {
      expect(dialog.className).toContain('translate-y-0');
      expect(dialog.className).toContain('opacity-100');
    });
  });

  it('applies reduced-motion classes to fallback controls', () => {
    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={false}
      />
    );

    const fallbackButton = screen.getByRole('button', { name: '改用聯絡表單' });
    const fallbackInput = screen.getByLabelText('你的電話');
    expect(fallbackButton.className).toContain('motion-reduce:transition-none');
    expect(fallbackInput.className).toContain('motion-reduce:transition-none');
  });

  it('handles empty string vs null vs undefined agentPhone', () => {
    const { rerender } = render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone=""
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByText('房仲還沒設定電話，用表單留言吧')).toBeInTheDocument();

    rerender(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone={null}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByText('房仲還沒設定電話，用表單留言吧')).toBeInTheDocument();

    rerender(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.getByText('房仲還沒設定電話，用表單留言吧')).toBeInTheDocument();
  });

  it('sanitizes agentName to prevent XSS', () => {
    render(
      <CallConfirmPanel
        isOpen={true}
        onClose={vi.fn()}
        agentPhone="0912-345-678"
        agentName="<script>alert('xss')</script>"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    expect(screen.queryByRole('script')).not.toBeInTheDocument();
    const headerText = screen.getByText(/的聯絡電話已準備好/);
    expect(headerText).toBeInTheDocument();
  });
});
