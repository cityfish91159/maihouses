import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VipModal } from '../VipModal';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

vi.mock('../../../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(),
}));

describe('VipModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isOpen=false 時不應渲染', () => {
    render(
      <VipModal
        isOpen={false}
        onClose={vi.fn()}
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        reason="測試原因"
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('應帶有 dialog 語意與 aria-modal', () => {
    render(
      <VipModal
        isOpen={true}
        onClose={vi.fn()}
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        reason="測試原因"
      />
    );

    const dialog = screen.getByRole('dialog');
    const title = screen.getByRole('heading', { name: '發現您對此物件很有興趣！' });

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(title.id).toBeTruthy();
    expect(dialog).toHaveAttribute('aria-labelledby', title.id);
  });

  it('focus trap 的 onEscape 應可觸發關閉', () => {
    const onClose = vi.fn();

    render(
      <VipModal
        isOpen={true}
        onClose={onClose}
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        reason="測試原因"
      />
    );

    const focusTrapMock = vi.mocked(useFocusTrap);
    expect(focusTrapMock).toHaveBeenCalled();

    const config = focusTrapMock.mock.calls[0]?.[0];
    config?.onEscape?.();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('點擊 backdrop 應關閉，點擊 dialog 內容不應關閉', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <VipModal
        isOpen={true}
        onClose={onClose}
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        reason="測試原因"
      />
    );

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement;
    expect(backdrop).not.toBeNull();
    if (!backdrop) return;

    await user.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('應使用手機底部滑出布局 class', () => {
    render(
      <VipModal
        isOpen={true}
        onClose={vi.fn()}
        onLineClick={vi.fn()}
        onCallClick={vi.fn()}
        reason="測試原因"
      />
    );

    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement;
    expect(backdrop?.className).toContain('items-end');
    expect(backdrop?.className).toContain('sm:items-center');
    expect(dialog.className).toContain('rounded-t-2xl');
  });
});

