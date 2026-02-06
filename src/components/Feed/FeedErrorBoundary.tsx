/**
 * FeedErrorBoundary Component
 *
 * 動態牆錯誤邊界，捕獲並顯示錯誤狀態
 * 提供重試功能讓用戶恢復正常瀏覽
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | undefined;
}

interface ErrorFallbackProps {
  onReset: () => void;
}

/**
 * 錯誤提示 UI
 *
 * 註：不使用 memo 優化
 * - 只在錯誤發生時渲染（機率 < 0.01%）
 * - 正常情況下永遠不會重新渲染
 * - memo 優化收益：0 次
 * - 遵循「測量後再優化」原則（Donald Knuth）
 */
function ErrorFallback({ onReset }: ErrorFallbackProps) {
  return (
    <div className="p-4 text-center">
      <h2 className="text-xl font-bold text-red-600">動態牆載入失敗</h2>
      <p className="mt-2 text-sm text-gray-600">請稍後重試，或聯繫客服協助</p>
      <button
        className="mt-4 rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        onClick={onReset}
        type="button"
      >
        重新載入
      </button>
    </div>
  );
}

export class FeedErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[FeedErrorBoundary] Uncaught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  public override render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
