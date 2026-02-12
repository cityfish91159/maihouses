/**
 * WallErrorBoundary
 *
 * 社區牆專用 Error Boundary
 * - 捕獲 runtime errors，防止白屏
 * - 提供友善的錯誤 UI
 * - 開發環境顯示詳細錯誤堆疊
 * - 生產環境記錄錯誤（可整合 Sentry）
 */

import React from 'react';
import { getErrorMessage, UNKNOWN_ERROR_MESSAGE } from '../../../lib/error';
import { logger } from '../../../lib/logger';

// DEV 模式除錯用
declare global {
  interface Window {
    __triggerCommunityWallError?: () => void;
  }
}

type ErrorCategory = 'network' | 'permission' | 'notFound' | 'runtime' | 'unknown';

interface CategorizedError {
  category: ErrorCategory;
  title: string;
  message: string;
  actionText: string;
  actionHref?: string;
  onAction?: () => void;
}

const collectErrorChainMessage = (error: Error): string => {
  const messages: string[] = [];
  let current: unknown = error;

  while (current !== undefined && current !== null) {
    const message = getErrorMessage(current);
    if (message !== UNKNOWN_ERROR_MESSAGE) {
      messages.push(message);
    }

    if (!(current instanceof Error)) {
      break;
    }

    current = current.cause;
  }

  if (messages.length === 0) {
    return UNKNOWN_ERROR_MESSAGE;
  }

  return messages.join(' ');
};

const categorizeError = (error: Error): CategorizedError => {
  const message = collectErrorChainMessage(error).toLowerCase();
  const runtimeMessage = getErrorMessage(error);

  if (message.includes('401') || message.includes('403') || message.includes('unauthorized')) {
    return {
      category: 'permission',
      title: '需要登入',
      message: '請先登入後再查看社區牆內容',
      actionText: '前往登入',
      actionHref: '/auth',
    };
  }

  if (message.includes('404') || message.includes('not found')) {
    return {
      category: 'notFound',
      title: '找不到社區牆',
      message: '此社區不存在或已被移除',
      actionText: '回到首頁',
      actionHref: '/maihouses/',
    };
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return {
      category: 'network',
      title: '連線異常',
      message: '目前無法連接到伺服器，請稍後重試',
      actionText: '重新載入',
      onAction: () => window.location.reload(),
    };
  }

  return {
    category: 'runtime',
    title: '載入失敗',
    message:
      runtimeMessage === UNKNOWN_ERROR_MESSAGE
        ? '發生未預期的錯誤，我們正在處理中'
        : runtimeMessage,
    actionText: '重試',
  };
};

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
}

export class WallErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    if (import.meta.env.DEV) {
      logger.error('[WallErrorBoundary] Community Wall Error', {
        error,
        componentStack: errorInfo.componentStack,
      });
    }

    if (import.meta.env.PROD && typeof window !== 'undefined') {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: getErrorMessage(error),
            stack: error.stack,
            name: error.name,
          },
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }).catch((reportError) => {
        logger.error('[WallErrorBoundary] Failed to report error', {
          error: getErrorMessage(reportError),
        });
      });
    }

    this.props.onError?.(error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  copyErrorToClipboard = () => {
    if (!this.state.error) return;
    const { error, errorInfo, errorId } = this.state;
    const payload = [
      `Message: ${getErrorMessage(error)}`,
      `Stack: ${error.stack ?? 'N/A'}`,
      `Component Stack: ${errorInfo?.componentStack ?? 'N/A'}`,
      `URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}`,
      `Timestamp: ${new Date().toISOString()}`,
      errorId ? `Error ID: ${errorId}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(payload).catch(() => {
        logger.warn('[WallErrorBoundary] Failed to copy error details');
      });
    }
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      const categorized = categorizeError(this.state.error);

      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft px-4">
          <div className="border-error-200 max-w-md rounded-2xl border bg-white p-8 text-center shadow-xl">
            <div className="mb-4 text-5xl">
              {categorized.category === 'network' && '📡'}
              {categorized.category === 'permission' && '🔒'}
              {categorized.category === 'notFound' && '🔍'}
              {categorized.category === 'runtime' && '💥'}
              {categorized.category === 'unknown' && '⚠️'}
            </div>
            <h2 className="mb-2 text-xl font-bold text-ink-900">{categorized.title}</h2>
            <p className="mb-6 text-sm text-ink-600">{categorized.message}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              {categorized.onAction && (
                <button
                  onClick={categorized.onAction ?? this.resetErrorBoundary}
                  className="border-brand/40 hover:bg-brand/10 rounded-lg border px-4 py-2 text-sm font-semibold text-brand transition"
                >
                  {categorized.actionText}
                </button>
              )}
              {categorized.actionHref && (
                <a
                  href={categorized.actionHref}
                  className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
                >
                  {categorized.actionText}
                </a>
              )}
              {!categorized.onAction && !categorized.actionHref && (
                <button
                  onClick={this.resetErrorBoundary}
                  className="border-brand/40 hover:bg-brand/10 rounded-lg border px-4 py-2 text-sm font-semibold text-brand transition"
                >
                  🔄 重試
                </button>
              )}
            </div>

            {import.meta.env.DEV && (
              <details className="mt-6 text-left">
                <summary className="text-ink-500 cursor-pointer text-xs hover:text-ink-700">
                  🛠️ 開發者除錯資訊
                </summary>
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={this.copyErrorToClipboard}
                    className="border-ink-200 hover:bg-ink-50 w-full rounded border px-2 py-1 text-xs text-ink-700"
                  >
                    📋 複製錯誤資訊
                  </button>
                  <pre className="bg-ink-50 text-error-600 max-h-60 overflow-auto rounded p-3 text-xs">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="bg-ink-50 max-h-40 overflow-auto rounded p-3 text-xs text-ink-700">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

if (import.meta.env.DEV) {
  window.__triggerCommunityWallError = () => {
    throw new Error('手動觸發社區牆 ErrorBoundary 測試錯誤');
  };
}
