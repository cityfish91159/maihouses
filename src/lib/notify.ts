import { toast } from "sonner";
import { TOAST_DURATION } from "../constants/toast";

export type NotifyOptions = {
  id?: string | number;
  description?: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
};

type ToastOptions = {
  id?: string | number;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  action?: { label: string; onClick: () => void };
};

const mapOptions = (
  options: NotifyOptions = {},
  description?: string,
  defaultDuration = 3200,
): ToastOptions => {
  const mapped: ToastOptions = {
    duration: options.duration ?? defaultDuration,
    dismissible: options.dismissible ?? true,
  };

  if (options.id !== undefined) {
    mapped.id = options.id;
  }

  if (description !== undefined) {
    mapped.description = description;
  } else if (options.description !== undefined) {
    mapped.description = options.description;
  }

  if (options.actionLabel && options.onAction) {
    mapped.action = { label: options.actionLabel, onClick: options.onAction };
  }

  return mapped;
};

export const notify = {
  success: (title: string, description?: string, options?: NotifyOptions) =>
    toast.success(title, mapOptions(options, description, TOAST_DURATION.SUCCESS)),

  error: (title: string, description?: string, options?: NotifyOptions) =>
    toast.error(
      title,
      mapOptions(options, description, options?.duration ?? TOAST_DURATION.ERROR),
    ),

  warning: (title: string, description?: string, options?: NotifyOptions) =>
    toast.warning(
      title,
      mapOptions(options, description, options?.duration ?? TOAST_DURATION.WARNING),
    ),

  info: (title: string, description?: string, options?: NotifyOptions) =>
    toast.info(title, mapOptions(options, description, TOAST_DURATION.INFO)),

  loading: (title: string, options?: NotifyOptions) =>
    toast.loading(
      title,
      mapOptions(options, options?.description, options?.duration ?? Infinity),
    ),

  dev: (message = "此功能開發中", options?: NotifyOptions) =>
    toast.info(
      "開發中",
      mapOptions(options, message, options?.duration ?? 2200),
    ),

  dismiss: (id?: string | number) => toast.dismiss(id),
};
