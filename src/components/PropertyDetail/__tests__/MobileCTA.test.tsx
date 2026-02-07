import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MobileCTA } from '../MobileCTA';

describe('MobileCTA', () => {
  it('點擊三按鈕時應觸發對應 callback', async () => {
    const user = userEvent.setup();
    const onLineClick = vi.fn();
    const onCallClick = vi.fn();
    const onBookingClick = vi.fn();

    render(
      <MobileCTA
        onLineClick={onLineClick}
        onCallClick={onCallClick}
        onBookingClick={onBookingClick}
        weeklyBookings={9}
      />
    );

    await user.click(screen.getByRole('button', { name: '加 LINE 聊聊' }));
    await user.click(screen.getByRole('button', { name: '致電諮詢' }));
    await user.click(screen.getByRole('button', { name: '預約看屋' }));

    expect(onLineClick).toHaveBeenCalledTimes(1);
    expect(onCallClick).toHaveBeenCalledTimes(1);
    expect(onBookingClick).toHaveBeenCalledTimes(1);
  });

  it('應渲染三按鈕與預約提示文字', () => {
    const { container } = render(
      <MobileCTA
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        onBookingClick={vi.fn()}
        weeklyBookings={9}
      />
    );

    expect(screen.getByRole('button', { name: '加 LINE 聊聊' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '致電諮詢' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '預約看屋' })).toBeInTheDocument();
    expect(screen.getByText('本物件 9 組預約中，把握機會！')).toBeInTheDocument();
    expect(container.querySelector('.text-slate-700')).toBeInTheDocument();
  });

  it('weeklyBookings=0 時仍應顯示完整文案', () => {
    render(
      <MobileCTA
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        onBookingClick={vi.fn()}
        weeklyBookings={0}
      />
    );

    expect(screen.getByText('目前尚無預約，搶先安排看屋！')).toBeInTheDocument();
  });

  it('action lock 時三按鈕應 disabled', () => {
    render(
      <MobileCTA
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        onBookingClick={vi.fn()}
        weeklyBookings={3}
        isActionLocked={true}
      />
    );

    expect(screen.getByRole('button', { name: '加 LINE 聊聊' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '致電諮詢' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '預約看屋' })).toBeDisabled();
  });

  it('按鈕應保留可觸控高度與 reduced-motion class', () => {
    render(
      <MobileCTA
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        onBookingClick={vi.fn()}
        weeklyBookings={3}
      />
    );

    const lineButton = screen.getByRole('button', { name: '加 LINE 聊聊' });
    const callButton = screen.getByRole('button', { name: '致電諮詢' });
    const bookingButton = screen.getByRole('button', { name: '預約看屋' });

    expect(lineButton.className).toContain('min-h-[44px]');
    expect(callButton.className).toContain('min-h-[44px]');
    expect(bookingButton.className).toContain('min-h-[44px]');
    expect(lineButton.className).toContain('motion-reduce:transition-none');
  });
});
