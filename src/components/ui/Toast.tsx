/**
 * Toast 通知組件
 * 
 * 用於替代 alert()，提供更好的用戶體驗
 * 支援：成功、錯誤、警告、資訊四種類型
 * 支援：重試按鈕、自動消失、手動關閉
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';

// Toast 類型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Toast 配置
export interface ToastConfig {
  id?: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // 毫秒，0 = 不自動關閉
  showRetry?: boolean;
  onRetry?: () => void;
  showContactSupport?: boolean;
}

// Toast 狀態
interface ToastState extends ToastConfig {
  id: string;
  visible: boolean;
}

// Context
interface ToastContextType {
  showToast: (config: ToastConfig) => string;
  hideToast: (id: string) => void;
  hideAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// 圖標配置
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

// 樣式配置
const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
};

// 預設持續時間
const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  error: 0, // 錯誤不自動關閉
  warning: 5000,
  info: 4000,
};

// 單個 Toast 組件
const ToastItem: React.FC<{
  toast: ToastState;
  onClose: () => void;
}> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(onClose, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg
        transform transition-all duration-300 ease-out
        ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${STYLES[toast.type]}
      `}
      role="alert"
    >
      {/* 圖標 */}
      <div className="flex-shrink-0 mt-0.5">
        {ICONS[toast.type]}
      </div>
      
      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">
          {toast.title}
        </p>
        {toast.message && (
          <p className="mt-1 text-sm text-slate-600">
            {toast.message}
          </p>
        )}
        
        {/* 操作按鈕 */}
        {(toast.showRetry || toast.showContactSupport) && (
          <div className="mt-3 flex gap-2">
            {toast.showRetry && toast.onRetry && (
              <button
                onClick={() => {
                  toast.onRetry?.();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                  bg-white border border-slate-200 rounded-lg
                  hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                重試
              </button>
            )}
            {toast.showContactSupport && (
              <a
                href="mailto:support@maihouses.com"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                  text-blue-600 bg-blue-50 border border-blue-200 rounded-lg
                  hover:bg-blue-100 transition-colors"
              >
                聯絡客服
              </a>
            )}
          </div>
        )}
      </div>
      
      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
        aria-label="關閉通知"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};

// Toast 容器
const ToastContainer: React.FC<{
  toasts: ToastState[];
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;
  
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            toast={toast}
            onClose={() => onClose(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  
  const showToast = useCallback((config: ToastConfig): string => {
    const id = config.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const duration = config.duration ?? DEFAULT_DURATION[config.type];
    
    const newToast: ToastState = {
      ...config,
      id,
      duration,
      visible: false,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // 觸發動畫
    requestAnimationFrame(() => {
      setToasts(prev => 
        prev.map(t => t.id === id ? { ...t, visible: true } : t)
      );
    });
    
    return id;
  }, []);
  
  const hideToast = useCallback((id: string) => {
    // 先觸發退出動畫
    setToasts(prev => 
      prev.map(t => t.id === id ? { ...t, visible: false } : t)
    );
    
    // 動畫結束後移除
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  }, []);
  
  const hideAll = useCallback(() => {
    setToasts(prev => prev.map(t => ({ ...t, visible: false })));
    setTimeout(() => setToasts([]), 300);
  }, []);
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast, hideAll }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// 便捷函數（需在 Provider 內使用）
export const toast = {
  success: (title: string, message?: string) => {
    // 這個函數需要透過 context，此處僅作為類型定義參考
    console.warn('toast.success should be used via useToast hook');
  },
  error: (title: string, message?: string, options?: { onRetry?: () => void }) => {
    console.warn('toast.error should be used via useToast hook');
  },
  warning: (title: string, message?: string) => {
    console.warn('toast.warning should be used via useToast hook');
  },
  info: (title: string, message?: string) => {
    console.warn('toast.info should be used via useToast hook');
  },
};

export default ToastProvider;
