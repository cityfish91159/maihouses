import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileActionBar } from '../MobileActionBar';

describe('MobileActionBar', () => {
  const socialProof = { currentViewers: 6, isHot: true };

  it('應渲染雙按鈕與可讀字體資訊列', () => {
    const { container } = render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
      />
    );

    expect(screen.getByRole('button', { name: '加 LINE 聊聊' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '致電諮詢' })).toBeInTheDocument();
    expect(container.querySelector('.text-xs')).toBeInTheDocument();
  });

  it('action lock 時雙按鈕應 disabled', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
        isActionLocked={true}
      />
    );

    expect(screen.getByRole('button', { name: '加 LINE 聊聊' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '致電諮詢' })).toBeDisabled();
  });

  it('雙按鈕點擊時應觸發對應 callback', async () => {
    const user = userEvent.setup();
    const onLineClick = vi.fn();
    const onCallClick = vi.fn();

    render(
      <MobileActionBar
        onLineClick={onLineClick}
        onCallClick={onCallClick}
        socialProof={socialProof}
      />
    );

    await user.click(screen.getByRole('button', { name: '加 LINE 聊聊' }));
    await user.click(screen.getByRole('button', { name: '致電諮詢' }));

    expect(onLineClick).toHaveBeenCalledTimes(1);
    expect(onCallClick).toHaveBeenCalledTimes(1);
  });

  it('isHot=false 時不應顯示熱門標籤', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={{ ...socialProof, isHot: false }}
      />
    );

    expect(screen.queryByText('熱門')).not.toBeInTheDocument();
  });

  it('currentViewers=0 時應顯示 0 人瀏覽中', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={{ currentViewers: 0, isHot: false }}
      />
    );

    expect(screen.getByText('0 人瀏覽中')).toBeInTheDocument();
  });

  it('未傳 socialProof 時應使用預設值', () => {
    render(
      <MobileActionBar onLineClick={vi.fn()} onCallClick={vi.fn()} />
    );

    expect(screen.getByText('0 人瀏覽中')).toBeInTheDocument();
  });

  it('按鈕應保留可觸控高度與 reduced-motion class', () => {
    render(
      <MobileActionBar
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={socialProof}
      />
    );

    const lineButton = screen.getByRole('button', { name: '加 LINE 聊聊' });
    const callButton = screen.getByRole('button', { name: '致電諮詢' });

    expect(lineButton.className).toContain('min-h-[44px]');
    expect(callButton.className).toContain('min-h-[44px]');
    expect(lineButton.className).toContain('motion-reduce:transition-none');
  });
});
