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

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WallErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 記錄錯誤到 console
    console.error('Community Wall Error:', error, errorInfo);
    
    // TODO: 整合 Sentry 或其他監控服務
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { 
    //     contexts: { react: errorInfo },
    //     tags: { component: 'CommunityWall' }
    //   });
    // }
  }

  override render() {
    if (this.state.hasError) {
      // 如果有自定義 fallback，使用它
      if (this.props.fallback) return this.props.fallback;

      // 預設錯誤 UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-bg-base to-bg-soft">
          <div className="max-w-md rounded-2xl border border-error-200 bg-white p-8 text-center shadow-xl">
            <div className="mb-4 text-5xl">💥</div>
            <h2 className="mb-2 text-xl font-bold text-ink-900">社區牆載入失敗</h2>
            <p className="mb-6 text-sm text-ink-600">
              {this.state.error?.message || '發生未預期的錯誤，請稍後再試'}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-brand/40 px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
              >
                🔄 重新載入
              </button>
              <a
                href="/maihouses/"
                className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600"
              >
                回到首頁
              </a>
            </div>
            
            {/* 開發環境顯示錯誤詳情 */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-xs text-ink-500 hover:text-ink-700">
                  顯示錯誤詳情
                </summary>
                <pre className="mt-2 max-h-60 overflow-auto rounded bg-ink-50 p-3 text-xs text-error-600">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
