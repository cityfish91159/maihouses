import { toast } from 'sonner';
import { TOAST_DURATION } from '../constants/toast';
import { getErrorMessage } from './error';
import { logger } from './logger';

/**
 * Thin wrapper around `sonner` with project-wide defaults.
 * - Keeps a single options contract (`NotifyOptions`)
 * - Preserves legacy `actionLabel/onAction`
 * - Adds defensive logging when toast rendering throws
 */
export type NotifyAction = {
  label: string;
  onClick: () => void;
};

export type NotifyOptions = {
  id?: string | number;
  description?: string;
  duration?: number;
  action?: NotifyAction;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
};

export type ToastOptions = {
  id?: string | number;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: NotifyAction;
};

const DEFAULT_DISMISSIBLE = true;
const DEFAULT_DEV_DURATION = 2200;
const DEFAULT_DEV_TITLE = 'In progress';
const DEFAULT_DEV_MESSAGE = 'Feature under development';
const MODULE_TAG = '[notify]';
const FALLBACK_TOAST_ID = -1;

function resolveDescription(options: NotifyOptions, description?: string): string | undefined {
  return description ?? options.description;
}

function resolveAction(options: NotifyOptions): NotifyAction | undefined {
  if (options.action) {
    return options.action;
  }

  if (options.actionLabel && options.onAction) {
    return { label: options.actionLabel, onClick: options.onAction };
  }

  return undefined;
}

function mapOptions(
  options: NotifyOptions = {},
  defaultDuration: number,
  description?: string
): ToastOptions {
  const mapped: ToastOptions = {
    duration: options.duration ?? defaultDuration,
    dismissible: options.dismissible ?? DEFAULT_DISMISSIBLE,
  };

  if (options.id !== undefined) {
    mapped.id = options.id;
  }

  const resolvedDescription = resolveDescription(options, description);
  if (resolvedDescription !== undefined) {
    mapped.description = resolvedDescription;
  }

  const action = resolveAction(options);
  if (action) {
    mapped.action = action;
  }

  return mapped;
}

type ToastCallResult = string | number;

function safeToast(call: () => ToastCallResult, message: string, title?: string): ToastCallResult {
  try {
    return call();
  } catch (error) {
    logger.warn(message, {
      error: getErrorMessage(error),
      title,
    });
    return FALLBACK_TOAST_ID;
  }
}

function safeDismiss(call: () => void, message: string): void {
  try {
    call();
  } catch (error) {
    logger.warn(message, {
      error: getErrorMessage(error),
    });
  }
}

export const notify = {
  success: (title: string, description?: string, options?: NotifyOptions) =>
    safeToast(
      () => toast.success(title, mapOptions(options, TOAST_DURATION.SUCCESS, description)),
      `${MODULE_TAG} toast.success failed`,
      title
    ),

  error: (title: string, description?: string, options?: NotifyOptions) =>
    safeToast(
      () => toast.error(title, mapOptions(options, TOAST_DURATION.ERROR, description)),
      `${MODULE_TAG} toast.error failed`,
      title
    ),

  warning: (title: string, description?: string, options?: NotifyOptions) =>
    safeToast(
      () => toast.warning(title, mapOptions(options, TOAST_DURATION.WARNING, description)),
      `${MODULE_TAG} toast.warning failed`,
      title
    ),

  info: (title: string, description?: string, options?: NotifyOptions) =>
    safeToast(
      () => toast.info(title, mapOptions(options, TOAST_DURATION.INFO, description)),
      `${MODULE_TAG} toast.info failed`,
      title
    ),

  loading: (title: string, options?: NotifyOptions) =>
    safeToast(
      () =>
        toast.loading(
          title,
          mapOptions(options, options?.duration ?? Number.POSITIVE_INFINITY, options?.description)
        ),
      `${MODULE_TAG} toast.loading failed`,
      title
    ),

  dev: (message = DEFAULT_DEV_MESSAGE, options?: NotifyOptions) =>
    safeToast(
      () => toast.info(DEFAULT_DEV_TITLE, mapOptions(options, DEFAULT_DEV_DURATION, message)),
      `${MODULE_TAG} toast.dev failed`,
      DEFAULT_DEV_TITLE
    ),

  dismiss: (id?: string | number) =>
    safeDismiss(() => toast.dismiss(id), `${MODULE_TAG} toast.dismiss failed`),
};
