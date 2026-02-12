import { describe, expect, it, vi, beforeEach } from 'vitest';
import { notify } from '../notify';
import { TOAST_DURATION } from '../../constants/toast';

const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockWarning = vi.fn();
const mockInfo = vi.fn();
const mockLoading = vi.fn();
const mockDismiss = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockSuccess(...args),
    error: (...args: unknown[]) => mockError(...args),
    warning: (...args: unknown[]) => mockWarning(...args),
    info: (...args: unknown[]) => mockInfo(...args),
    loading: (...args: unknown[]) => mockLoading(...args),
    dismiss: (...args: unknown[]) => mockDismiss(...args),
  },
}));

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應支援 action 物件參數（#14a）', () => {
    const onClick = vi.fn();
    notify.info('請先註冊', '註冊後可繼續操作', {
      action: { label: '免費註冊', onClick },
      duration: 5000,
    });

    expect(mockInfo).toHaveBeenCalledWith(
      '請先註冊',
      expect.objectContaining({
        description: '註冊後可繼續操作',
        duration: 5000,
        action: expect.objectContaining({
          label: '免費註冊',
          onClick,
        }),
      })
    );
  });

  it('應保留 actionLabel/onAction 相容行為', () => {
    const onAction = vi.fn();
    notify.warning('權限不足', '請先登入', {
      actionLabel: '前往登入',
      onAction,
    });

    expect(mockWarning).toHaveBeenCalledWith(
      '權限不足',
      expect.objectContaining({
        description: '請先登入',
        duration: TOAST_DURATION.WARNING,
        action: expect.objectContaining({
          label: '前往登入',
          onClick: onAction,
        }),
      })
    );
  });
});
