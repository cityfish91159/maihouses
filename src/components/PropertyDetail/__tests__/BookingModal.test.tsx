import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingModal } from '../BookingModal';
import { notify } from '../../../lib/notify';

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../../lib/notify', () => ({
  notify: {
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('BookingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('手機格式不合法時不應送出', async () => {
    const user = userEvent.setup();
    const onSubmitBooking = vi.fn().mockResolvedValue(undefined);

    render(
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), 'abc');
    expect(screen.getByRole('button', { name: '確認預約' })).toBeDisabled();

    expect(onSubmitBooking).not.toHaveBeenCalled();
  });

  it('空字串電話時送出按鈕應維持 disabled', async () => {
    const user = userEvent.setup();
    render(
      <BookingModal isOpen={true} onClose={vi.fn()} agentName="測試經紀人" onSubmitBooking={vi.fn()} />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    expect(screen.getByRole('button', { name: '確認預約' })).toBeDisabled();
  });

  it('7 位數電話應視為有效（最小邊界）', async () => {
    const user = userEvent.setup();
    const onSubmitBooking = vi.fn().mockResolvedValue(undefined);

    render(
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), '1234567');
    await user.click(screen.getByRole('button', { name: '確認預約' }));

    expect(onSubmitBooking).toHaveBeenCalledWith({
      selectedSlot: expect.any(String),
      phone: '1234567',
      trustAssureChecked: false,
    });
  });

  it('16 位數電話應視為無效（超過最大邊界）', async () => {
    const user = userEvent.setup();
    const onSubmitBooking = vi.fn().mockResolvedValue(undefined);

    render(
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), '1234567890123456');

    expect(screen.getByRole('button', { name: '確認預約' })).toBeDisabled();
    expect(onSubmitBooking).not.toHaveBeenCalled();
  });

  it('應送出清洗後的電話號碼', async () => {
    const user = userEvent.setup();
    const onSubmitBooking = vi.fn().mockResolvedValue(undefined);

    render(
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), '0912-345-678');
    await user.click(screen.getByRole('button', { name: '確認預約' }));

    expect(onSubmitBooking).toHaveBeenCalledWith({
      selectedSlot: expect.any(String),
      phone: '0912345678',
      trustAssureChecked: false,
    });
  });

  it('應送出清洗後的國際格式電話號碼', async () => {
    const user = userEvent.setup();
    const onSubmitBooking = vi.fn().mockResolvedValue(undefined);

    render(
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), '+886-912-345-678');
    await user.click(screen.getByRole('button', { name: '確認預約' }));

    expect(onSubmitBooking).toHaveBeenCalledWith({
      selectedSlot: expect.any(String),
      phone: '+886912345678',
      trustAssureChecked: false,
    });
  });

  it('預約成功但安心留痕失敗時應提示部分成功', async () => {
    const user = userEvent.setup();
    const onSubmitBooking = vi.fn().mockResolvedValue(undefined);
    const onTrustAction = vi.fn().mockRejectedValue(new Error('trust failed'));

    render(
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
        onTrustAction={onTrustAction}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), '0912-345-678');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '確認預約' }));

    expect(onSubmitBooking).toHaveBeenCalledTimes(1);
    expect(onTrustAction).toHaveBeenCalledWith(true);
    expect(screen.getByText('預約成功！')).toBeInTheDocument();
    expect(notify.warning).toHaveBeenCalledWith(
      '預約已送出',
      '安心留痕未完成，你可以稍後再試一次。'
    );
  });

  it('快速連點送出只應觸發一次（submit lock）', async () => {
    const user = userEvent.setup();
    let releaseSubmit: (() => void) | undefined;
    const onSubmitBooking = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          releaseSubmit = () => resolve();
        })
    );

    render(
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), '0912-345-678');
    const submitButton = screen.getByRole('button', { name: '確認預約' });

    await Promise.all([user.click(submitButton), user.click(submitButton)]);
    expect(onSubmitBooking).toHaveBeenCalledTimes(1);

    releaseSubmit?.();
  });

  it('送出失敗時應提示錯誤且不呼叫安心留痕 action', async () => {
    const user = userEvent.setup();
    const onSubmitBooking = vi.fn().mockRejectedValue(new Error('submit failed'));
    const onTrustAction = vi.fn().mockResolvedValue(undefined);

    render(
      <BookingModal
        isOpen={true}
        onClose={vi.fn()}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
        onTrustAction={onTrustAction}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), '0912-345-678');
    await user.click(screen.getByRole('button', { name: '確認預約' }));

    await waitFor(() => {
      expect(notify.error).toHaveBeenCalledWith('預約送出失敗', '請稍後再試');
    });
    expect(onTrustAction).not.toHaveBeenCalled();
  });

  it('unmount 時應清除自動關閉 timer', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSubmitBooking = vi.fn().mockResolvedValue(undefined);
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = render(
      <BookingModal
        isOpen={true}
        onClose={onClose}
        agentName="測試經紀人"
        onSubmitBooking={onSubmitBooking}
      />
    );

    await user.click(screen.getAllByRole('button', { name: /\d{2}:\d{2}/ })[0]!);
    await user.type(screen.getByLabelText('你的手機號碼'), '0912-345-678');
    await user.click(screen.getByRole('button', { name: '確認預約' }));

    await waitFor(() => {
      expect(onSubmitBooking).toHaveBeenCalledTimes(1);
    });

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
