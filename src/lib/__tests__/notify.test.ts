import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TOAST_DURATION } from '../../constants/toast';
import { notify } from '../notify';

const mockSuccess = vi.fn();
const mockError = vi.fn();
const mockWarning = vi.fn();
const mockInfo = vi.fn();
const mockLoading = vi.fn();
const mockDismiss = vi.fn();
const mockLoggerWarn = vi.fn();

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

vi.mock('../logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  },
}));

vi.mock('../error', () => ({
  getErrorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));

describe('notify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSuccess.mockReturnValue('success-id');
    mockError.mockReturnValue('error-id');
    mockWarning.mockReturnValue('warning-id');
    mockInfo.mockReturnValue('info-id');
    mockLoading.mockReturnValue('loading-id');
  });

  it('info 應支援 action 物件選項', () => {
    const onClick = vi.fn();

    notify.info('Sign up required', 'Please create an account first', {
      action: { label: 'Sign up', onClick },
      duration: 5000,
    });

    expect(mockInfo).toHaveBeenCalledWith(
      'Sign up required',
      expect.objectContaining({
        description: 'Please create an account first',
        duration: 5000,
        action: expect.objectContaining({
          label: 'Sign up',
          onClick,
        }),
      })
    );
  });

  it('應保持 actionLabel/onAction 向後相容', () => {
    const onAction = vi.fn();

    notify.warning('Permission denied', 'Please login first', {
      actionLabel: 'Go to login',
      onAction,
    });

    expect(mockWarning).toHaveBeenCalledWith(
      'Permission denied',
      expect.objectContaining({
        description: 'Please login first',
        duration: TOAST_DURATION.WARNING,
        action: expect.objectContaining({
          label: 'Go to login',
          onClick: onAction,
        }),
      })
    );
  });

  it('actionLabel 無 onAction 時應發出警告', () => {
    notify.info('Invalid action config', undefined, { actionLabel: 'Click me' });

    expect(mockLoggerWarn).toHaveBeenCalledWith('[notify] actionLabel provided without onAction', {
      actionLabel: 'Click me',
    });
    expect(mockInfo).toHaveBeenCalledWith(
      'Invalid action config',
      expect.not.objectContaining({ action: expect.anything() })
    );
  });

  it('action 與 legacy 欄位並存時應優先使用 action', () => {
    const modernOnClick = vi.fn();
    const legacyOnAction = vi.fn();

    notify.info('Priority check', undefined, {
      action: { label: 'Modern action', onClick: modernOnClick },
      actionLabel: 'Legacy action',
      onAction: legacyOnAction,
    });

    expect(mockInfo).toHaveBeenCalledWith(
      'Priority check',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'Modern action',
          onClick: modernOnClick,
        }),
      })
    );
  });

  it('應接受空操作回呼函式', () => {
    const emptyOnClick = () => undefined;

    notify.info('Empty callback', undefined, {
      action: { label: 'No-op', onClick: emptyOnClick },
    });

    expect(mockInfo).toHaveBeenCalledWith(
      'Empty callback',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'No-op',
          onClick: emptyOnClick,
        }),
      })
    );
  });

  it('success 和 info 應使用預設 duration', () => {
    notify.success('Saved');
    notify.info('Heads up');

    expect(mockSuccess).toHaveBeenCalledWith(
      'Saved',
      expect.objectContaining({ duration: TOAST_DURATION.SUCCESS, dismissible: true })
    );
    expect(mockInfo).toHaveBeenCalledWith(
      'Heads up',
      expect.objectContaining({ duration: TOAST_DURATION.INFO, dismissible: true })
    );
  });

  it('error 應使用自訂 duration', () => {
    notify.error('Failed', undefined, { duration: 1234 });

    expect(mockError).toHaveBeenCalledWith('Failed', expect.objectContaining({ duration: 1234 }));
  });

  it('warning 未提供 duration 時應使用預設值', () => {
    notify.warning('Warning');

    expect(mockWarning).toHaveBeenCalledWith(
      'Warning',
      expect.objectContaining({ duration: TOAST_DURATION.WARNING })
    );
  });

  it('loading 預設應使用 Infinity duration', () => {
    notify.loading('Loading data', { description: 'Please wait' });

    expect(mockLoading).toHaveBeenCalledWith(
      'Loading data',
      expect.objectContaining({
        description: 'Please wait',
        duration: Number.POSITIVE_INFINITY,
      })
    );
  });

  it('dev 應使用預設訊息和 duration', () => {
    notify.dev();

    expect(mockInfo).toHaveBeenCalledWith(
      '開發中',
      expect.objectContaining({
        description: '此功能開發中',
        duration: 2200,
      })
    );
  });

  it('dismiss 應傳遞 id', () => {
    notify.dismiss('toast-id');

    expect(mockDismiss).toHaveBeenCalledWith('toast-id');
  });

  it('toast 拋錯時應記錄警告並回傳 fallback id', () => {
    mockInfo.mockImplementationOnce(() => {
      throw new Error('toast crash');
    });

    const result = notify.info('Will crash');

    expect(result).toBe(-1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('[notify] toast.info failed', {
      error: 'toast crash',
      title: 'Will crash',
    });
  });

  it('sonner 回傳數字時應回傳 numeric toast id', () => {
    mockSuccess.mockReturnValueOnce(77);

    const result = notify.success('Numeric id');

    expect(result).toBe(77);
  });
});
