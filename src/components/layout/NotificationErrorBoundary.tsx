/**
 * NotificationErrorBoundary
 *
 * MSG-2: Error Boundary for NotificationDropdown
 * 捕獲通知組件的錯誤，顯示友善的錯誤訊息
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { logger } from '../../lib/logger';

interface Props {
  children: ReactNode;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class NotificationErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('NotificationErrorBoundary.caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="absolute right-0 top-full mt-2 w-[380px] rounded-xl border border-red-100 bg-white p-6 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 rounded-full bg-red-50 p-3">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <h4 className="mb-1 text-sm font-bold text-gray-900">無法載入通知</h4>
            <p className="mb-4 text-xs text-gray-500">請稍後再試</p>
            <div className="flex gap-2">
              <button
                onClick={this.handleRetry}
                className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
              >
                重試
              </button>
              {this.props.onClose && (
                <button
                  onClick={this.props.onClose}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  關閉
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
