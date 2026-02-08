import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileCTA } from '../MobileCTA';

describe('MobileCTA', () => {
  it('點擊雙按鈕時應觸發對應 callback', async () => {
    const user = userEvent.setup();
    const onLineClick = vi.fn();
    const onCallClick = vi.fn();

    render(
      <MobileCTA
        onLineClick={onLineClick}
        onCallClick={onCallClick}
        socialProof={{ currentViewers: 5, trustCasesCount: 9, isHot: true }}
        trustEnabled={true}
      />
    );

    await user.click(screen.getByRole('button', { name: '加 LINE 聊聊' }));
    await user.click(screen.getByRole('button', { name: '致電諮詢' }));

    expect(onLineClick).toHaveBeenCalledTimes(1);
    expect(onCallClick).toHaveBeenCalledTimes(1);
  });

  it('應渲染雙按鈕與賞屋提示文字', () => {
    const { container } = render(
      <MobileCTA
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={{ currentViewers: 5, trustCasesCount: 9, isHot: true }}
        trustEnabled={true}
      />
    );

    expect(screen.getByRole('button', { name: '加 LINE 聊聊' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '致電諮詢' })).toBeInTheDocument();
    expect(screen.getByText('本物件 9 組客戶已賞屋，把握機會！')).toBeInTheDocument();
    expect(container.querySelector('.text-slate-700')).toBeInTheDocument();
  });

  it('trustCasesCount=0 時不顯示提示文字', () => {
    render(
      <MobileCTA
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={{ currentViewers: 5, trustCasesCount: 0, isHot: false }}
        trustEnabled={true}
      />
    );

    expect(screen.queryByText(/組客戶已賞屋/)).not.toBeInTheDocument();
  });

  it('action lock 時雙按鈕應 disabled', () => {
    render(
      <MobileCTA
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={{ currentViewers: 5, trustCasesCount: 3, isHot: true }}
        trustEnabled={true}
        isActionLocked={true}
      />
    );

    expect(screen.getByRole('button', { name: '加 LINE 聊聊' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '致電諮詢' })).toBeDisabled();
  });

  it('按鈕應保留可觸控高度與 reduced-motion class', () => {
    render(
      <MobileCTA
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        socialProof={{ currentViewers: 5, trustCasesCount: 3, isHot: true }}
        trustEnabled={true}
      />
    );

    const lineButton = screen.getByRole('button', { name: '加 LINE 聊聊' });
    const callButton = screen.getByRole('button', { name: '致電諮詢' });

    expect(lineButton.className).toContain('min-h-[44px]');
    expect(callButton.className).toContain('min-h-[44px]');
    expect(lineButton.className).toContain('motion-reduce:transition-none');
  });
});
