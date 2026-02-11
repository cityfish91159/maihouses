import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineLinkPanel } from '../LineLinkPanel';
import { notify } from '../../../lib/notify';
import { track } from '../../../analytics/track';

let capturedOnEscape: (() => void) | undefined;

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn((opts: { onEscape?: () => void }) => {
    capturedOnEscape = opts.onEscape;
  }),
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
    expect(screen.queryByTestId('line-panel-skeleton')).not.toBeInTheDocument();
  });

describe('LineLinkPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton first and then shows panel content', async () => {
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

    expect(screen.getByTestId('line-panel-skeleton')).toBeInTheDocument();

    await waitForPanelReady();
    expect(screen.getByText('加 LINE 直接聊，回覆最快喔！')).toBeInTheDocument();
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

    await waitForPanelReady();
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

  it('shows inline validation error for invalid fallback line id', async () => {
    const user = userEvent.setup();
    render(
      <LineLinkPanel
        isOpen={true}
        onClose={vi.fn()}
        agentName="游杰倫"
        isLoggedIn={true}
        trustEnabled={true}
      />
    );

    await waitForPanelReady();

    const input = screen.getByLabelText('你的 LINE ID');
    await user.type(input, 'a');
    await user.tab();

    expect(screen.getByText(/LINE ID 格式不正確/)).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.className).toContain('border-red-500');
  });

  it('submits fallback flow with valid line id', async () => {
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

    await waitForPanelReady();

    await user.type(screen.getByLabelText('你的 LINE ID'), 'demo_line_01');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onFallbackContact).toHaveBeenCalledWith(false);
    expect(track).toHaveBeenCalledWith(
      'line_deeplink_open',
      expect.objectContaining({ has_line_id: false, user_line_id_provided: true })
    );
  });

  it('uses stronger backdrop style with blur', () => {
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
    const backdrop = dialog.parentElement;
    expect(backdrop?.className).toContain('bg-black/60');
    expect(backdrop?.className).toContain('backdrop-blur-sm');
  });

  it('closes on Escape via useDetailPanelShell onEscape callback', () => {
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

    expect(capturedOnEscape).toBeDefined();
    capturedOnEscape?.();
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

    await waitForPanelReady();
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
