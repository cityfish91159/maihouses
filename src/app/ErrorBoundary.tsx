import { Component, ReactNode } from 'react';
import { trackEvent } from '../services/analytics';
import { logger } from '../lib/logger';

interface Props {
  children: ReactNode;
}
type State = {
  hasError: boolean;
  errorId?: string;
};

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    // [Team 8 修復] 生成錯誤 ID 供用戶報告
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, errorId };
  }

  override componentDidCatch(err: unknown) {
    const errorId = this.state.errorId;
    logger.error('[ErrorBoundary] Uncaught error', { error: err, errorId });
    try {
      // [NASA TypeScript Safety] 使用 instanceof 類型守衛取代 as Error
      const message = err instanceof Error ? err.message : String(err);
      trackEvent('error_boundary', '*', message);
    } catch {}
  }

  // [Team 8 修復] 提供重試機制
  handleRetry = () => {
    this.setState({ hasError: false });
  };

  // [Team 8 修復] 回到首頁
  handleGoHome = () => {
    window.location.href = '/maihouses/';
  };

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // [Team 8 修復] 改進 Fallback UI - 提供重試、回首頁、錯誤 ID
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <svg
                className="size-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h2 className="mb-2 text-center text-xl font-bold text-slate-900">系統發生錯誤</h2>

          <p className="mb-4 text-center text-sm text-slate-600">
            很抱歉，頁面載入時發生問題。您可以嘗試重新載入，或回到首頁。
          </p>

          {this.state.errorId && (
            <div className="mb-4 rounded-lg bg-slate-100 p-3">
              <p className="text-xs text-slate-500">錯誤編號（供客服查詢）</p>
              <p className="font-mono text-sm font-semibold text-slate-700">{this.state.errorId}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              重新載入
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              回到首頁
            </button>
          </div>
        </div>
      </div>
    );
  }
}
