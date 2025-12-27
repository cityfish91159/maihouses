import { toast } from 'sonner'

export type NotifyOptions = {
  id?: string | number
  description?: string
  duration?: number
  actionLabel?: string
  onAction?: () => void
  dismissible?: boolean
}

type ToastOptions = {
  id?: string | number
  description?: string
  duration?: number
  dismissible?: boolean
  action?: { label: string; onClick: () => void }
}

const mapOptions = (options: NotifyOptions = {}, description?: string, defaultDuration = 3200): ToastOptions => {
  const mapped: ToastOptions = {
    duration: options.duration ?? defaultDuration,
    dismissible: options.dismissible ?? true,
  }

  if (options.id !== undefined) {
    mapped.id = options.id
  }

  if (description !== undefined) {
    mapped.description = description
  } else if (options.description !== undefined) {
    mapped.description = options.description
  }

  if (options.actionLabel && options.onAction) {
    mapped.action = { label: options.actionLabel, onClick: options.onAction }
  }

  return mapped
}

export const notify = {
  success: (title: string, description?: string, options?: NotifyOptions) =>
    toast.success(title, mapOptions(options, description, 3200)),

  error: (title: string, description?: string, options?: NotifyOptions) =>
    toast.error(title, mapOptions(options, description, options?.duration ?? 5000)),

  warning: (title: string, description?: string, options?: NotifyOptions) =>
    toast.warning(title, mapOptions(options, description, options?.duration ?? 4500)),

  info: (title: string, description?: string, options?: NotifyOptions) =>
    toast.info(title, mapOptions(options, description, 3200)),

  loading: (title: string, options?: NotifyOptions) =>
    toast.loading(title, mapOptions(options, options?.description, options?.duration ?? Infinity)),

  dev: (message = '此功能開發中', options?: NotifyOptions) =>
    toast.info('開發中', mapOptions(options, message, options?.duration ?? 2200)),

  dismiss: (id?: string | number) => toast.dismiss(id),
}
