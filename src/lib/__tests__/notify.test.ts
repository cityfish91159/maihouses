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

  it('supports action object options in info', () => {
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

  it('keeps actionLabel/onAction backwards compatibility', () => {
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

  it('uses default durations for success and info', () => {
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

  it('uses provided duration in error', () => {
    notify.error('Failed', undefined, { duration: 1234 });

    expect(mockError).toHaveBeenCalledWith('Failed', expect.objectContaining({ duration: 1234 }));
  });

  it('uses warning default duration when duration is not provided', () => {
    notify.warning('Warning');

    expect(mockWarning).toHaveBeenCalledWith(
      'Warning',
      expect.objectContaining({ duration: TOAST_DURATION.WARNING })
    );
  });

  it('uses infinity duration for loading by default', () => {
    notify.loading('Loading data', { description: 'Please wait' });

    expect(mockLoading).toHaveBeenCalledWith(
      'Loading data',
      expect.objectContaining({
        description: 'Please wait',
        duration: Number.POSITIVE_INFINITY,
      })
    );
  });

  it('uses default dev message and duration', () => {
    notify.dev();

    expect(mockInfo).toHaveBeenCalledWith(
      'In progress',
      expect.objectContaining({
        description: 'Feature under development',
        duration: 2200,
      })
    );
  });

  it('passes id into dismiss', () => {
    notify.dismiss('toast-id');

    expect(mockDismiss).toHaveBeenCalledWith('toast-id');
  });

  it('logs warning and returns fallback id when toast call throws', () => {
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
});
