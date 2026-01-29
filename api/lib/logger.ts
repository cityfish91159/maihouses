/**
 * API 層 Logger 工具
 *
 * 取代 console.log/warn/error，整合 Sentry 錯誤監控
 *
 * 使用方式：
 * ```typescript
 * import { logger } from "../lib/logger";
 *
 * logger.info("[模組] 訊息", { context });
 * logger.warn("[模組] 警告", { context });
 * logger.error("[模組] 錯誤", error, { context });
 * ```
 *
 * 特性：
 * - 生產環境：只發送到 Sentry，不輸出到 stdout/stderr
 * - 開發環境：輸出到 stderr（不污染 stdout），方便調試
 * - 結構化日誌：支援 context 物件
 */

import { captureError, captureWarning, addBreadcrumb } from './sentry';

// ============================================================================
// Types
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

// ============================================================================
// Configuration
// ============================================================================

const isProduction = process.env.NODE_ENV === 'production';

// ============================================================================
// Logger Implementation
// ============================================================================

/**
 * 格式化日誌訊息（開發環境用）
 * 僅在開發環境呼叫此函數，避免生產環境的效能開銷
 */
function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}\n`;
}

/**
 * 輸出到 stderr（開發環境）
 * 前置條件：呼叫者應先檢查 isProduction 以避免無意義的格式化開銷
 */
function writeToStderr(formatted: string): void {
  process.stderr.write(formatted);
}

/**
 * API Logger
 *
 * 統一的日誌介面，自動整合 Sentry
 */
export const logger = {
  /**
   * Debug 級別日誌
   * - 僅開發環境輸出
   * - 不發送到 Sentry
   */
  debug(message: string, context?: LogContext): void {
    if (!isProduction) {
      writeToStderr(formatLogMessage('debug', message, context));
    }
  },

  /**
   * Info 級別日誌
   * - 開發環境輸出到 stderr
   * - 生產環境添加 Sentry breadcrumb（不輸出到 stderr）
   */
  info(message: string, context?: LogContext): void {
    if (isProduction) {
      // 生產環境：僅記錄 breadcrumb，不輸出到 stderr
      addBreadcrumb(message, 'api.log', context);
    } else {
      // 開發環境：輸出到 stderr
      writeToStderr(formatLogMessage('info', message, context));
    }
  },

  /**
   * Warning 級別日誌
   * - 開發環境輸出到 stderr
   * - 生產環境發送到 Sentry（不輸出到 stderr）
   */
  warn(message: string, context?: LogContext): void {
    if (isProduction) {
      captureWarning(message, context);
    } else {
      writeToStderr(formatLogMessage('warn', message, context));
    }
  },

  /**
   * Error 級別日誌
   * - 開發環境輸出到 stderr
   * - 生產環境發送到 Sentry（不輸出到 stderr）
   *
   * @param message 錯誤訊息
   * @param error 可選的 Error 物件
   * @param context 可選的上下文
   */
  error(message: string, error?: unknown, context?: LogContext): void {
    if (isProduction) {
      // 生產環境：發送到 Sentry，不輸出到 stderr
      if (error instanceof Error) {
        captureError(error, { message, ...context });
      } else if (error) {
        captureError(new Error(message), { originalError: error, ...context });
      } else {
        captureWarning(message, context);
      }
    } else {
      // 開發環境：輸出到 stderr
      const errorMessage = error instanceof Error ? `${message}: ${error.message}` : message;
      writeToStderr(formatLogMessage('error', errorMessage, context));
    }
  },
};

// ============================================================================
// Export
// ============================================================================

export default logger;
