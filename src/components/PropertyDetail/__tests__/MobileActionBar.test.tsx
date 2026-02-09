import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileActionBar } from '../MobileActionBar';

describe('MobileActionBar', () => {
  const socialProof = { currentViewers: 6, trustCasesCount: 3, isHot: true };

  it('renders two CTA buttons and social proof', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
        trustEnabled={true}
      />
    );

    expect(screen.getByRole('button', { name: '加 LINE 聊聊' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '致電諮詢' })).toBeInTheDocument();
    expect(screen.getByText('6 人瀏覽中')).toBeInTheDocument();
    expect(screen.queryByText('認證經紀人')).not.toBeInTheDocument();
  });

  it('disables both buttons when action is locked', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
        trustEnabled={true}
        isActionLocked={true}
      />
    );

    expect(screen.getByRole('button', { name: '加 LINE 聊聊' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '致電諮詢' })).toBeDisabled();
  });

  it('fires click callbacks', async () => {
    const user = userEvent.setup();
    const onLineClick = vi.fn();
    const onCallClick = vi.fn();

    render(
      <MobileActionBar
        onLineClick={onLineClick}
        onCallClick={onCallClick}
        socialProof={socialProof}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: '加 LINE 聊聊' }));
    await user.click(screen.getByRole('button', { name: '致電諮詢' }));

    expect(onLineClick).toHaveBeenCalledTimes(1);
    expect(onCallClick).toHaveBeenCalledTimes(1);
  });

  it('hides hot badge when isHot=false', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={{ ...socialProof, isHot: false }}
        trustEnabled={true}
      />
    );

    expect(screen.queryByText('熱門')).not.toBeInTheDocument();
  });

  it('hides trust cases and hot badge when trust is disabled', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
        trustEnabled={false}
      />
    );

    expect(screen.queryByText('3 組已賞屋')).not.toBeInTheDocument();
    expect(screen.queryByText('熱門')).not.toBeInTheDocument();
  });

  it('renders 0 viewers by default social proof', () => {
    render(<MobileActionBar onLineClick={vi.fn()} onCallClick={vi.fn()} trustEnabled={true} />);

    expect(screen.getByText('0 人瀏覽中')).toBeInTheDocument();
  });

  it('keeps 44px minimum button height', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
        trustEnabled={true}
      />
    );

    const lineButton = screen.getByRole('button', { name: '加 LINE 聊聊' });
    const callButton = screen.getByRole('button', { name: '致電諮詢' });
    expect(lineButton.className).toContain('min-h-[44px]');
    expect(callButton.className).toContain('min-h-[44px]');
  });

  it('hides certification label when isVerified=false', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
        trustEnabled={true}
        isVerified={false}
      />
    );

    expect(screen.queryByText('認證經紀人')).not.toBeInTheDocument();
  });

  it('shows certification label when isVerified=true', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
        trustEnabled={true}
        isVerified={true}
      />
    );

    expect(screen.getByText('認證經紀人')).toBeInTheDocument();
  });
});
