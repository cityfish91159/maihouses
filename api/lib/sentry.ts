/**
 * Sentry 錯誤監控模組
 *
 * 提供統一的錯誤捕獲和上報機制
 * 支援 Vercel Serverless Functions 環境
 *
 * 使用方式：
 * ```typescript
 * import { withSentryHandler } from "../lib/sentry";
 *
 * async function handler(req, res) { ... }
 * export default withSentryHandler(handler, "api-name");
 * ```
 */

import * as Sentry from '@sentry/node';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureValidEnv } from './env';

// ============================================================================
// Types
// ============================================================================

type VercelHandler = (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void>;

interface SentryConfig {
  dsn: string | undefined;
  environment: string;
  isProduction: boolean;
  isEnabled: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

// Sentry 初始化狀態
let isInitialized = false;

/**
 * 基礎設施層日誌輸出
 *
 * 在 Sentry/Logger 初始化之前使用，避免循環依賴
 * 使用 stderr 輸出，符合 logger 設計原則
 */
function infraLog(level: 'info' | 'error', message: string): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // 生產環境：僅輸出 error 級別（嚴重配置問題）
  // 開發環境：輸出所有級別
  if (isProduction && level !== 'error') {
    return;
  }

  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  process.stderr.write(formatted);
}

/**
 * 獲取 Sentry 配置
 */
function getSentryConfig(): SentryConfig {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  const isEnabled = Boolean(dsn) && isProduction;

  return { dsn, environment, isProduction, isEnabled };
}

/**
 * 初始化 Sentry（僅在生產環境且有 DSN 時啟用）
 * 同時驗證必要的環境變數
 */
export function initSentry(): void {
  if (isInitialized) return;

  // 驗證環境變數（生產環境缺少必要配置會拋出錯誤）
  ensureValidEnv();

  const config = getSentryConfig();

  if (!config.dsn) {
    if (config.isProduction) {
      // 生產環境缺少 DSN 是嚴重配置錯誤，必須記錄
      infraLog(
        'error',
        '[SENTRY] CRITICAL: SENTRY_DSN not configured in production. Error monitoring disabled.'
      );
    }
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    enabled: config.isEnabled,
    // Performance Tracing 採樣率
    tracesSampleRate: config.isProduction ? 0.2 : 0,
    // Profiling 採樣率（相對於 traces）
    profilesSampleRate: config.isProduction ? 0.1 : 0,
    // 忽略常見的非關鍵錯誤
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'AbortError',
      'The operation was aborted',
      'ECONNRESET',
      'ETIMEDOUT',
    ],
    // 發送前處理
    beforeSend(event) {
      // 過濾敏感資訊
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      return event;
    },
  });

  isInitialized = true;
  // 開發環境：輸出初始化確認（生產環境會被 infraLog 過濾）
  infraLog('info', `[SENTRY] Initialized (env: ${config.environment})`);
}

// ============================================================================
// Error Capture
// ============================================================================

/**
 * 捕獲並上報錯誤
 */
export function captureError(error: Error | unknown, context?: Record<string, unknown>): void {
  initSentry();

  if (error instanceof Error) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureMessage(String(error), {
      level: 'error',
      extra: context,
    });
  }
}

/**
 * 捕獲警告級別訊息
 */
export function captureWarning(message: string, context?: Record<string, unknown>): void {
  initSentry();
  Sentry.captureMessage(message, {
    level: 'warning',
    extra: context,
  });
}

// ============================================================================
// Context & Breadcrumbs
// ============================================================================

/**
 * 設置用戶上下文
 */
export function setUserContext(userId: string, email?: string): void {
  Sentry.setUser({ id: userId, email });
}

/**
 * 清除用戶上下文
 */
export function clearUserContext(): void {
  Sentry.setUser(null);
}

/**
 * 添加麵包屑
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// ============================================================================
// Performance Tracing
// ============================================================================

/**
 * 開始一個 Transaction（用於追蹤 API 效能）
 */
export function startTransaction(
  name: string,
  op: string
): ReturnType<typeof Sentry.startInactiveSpan> {
  initSentry();
  return Sentry.startInactiveSpan({
    name,
    op,
    forceTransaction: true,
  });
}

/**
 * 開始一個子 Span
 */
export function startSpan(name: string, op: string): ReturnType<typeof Sentry.startInactiveSpan> {
  return Sentry.startInactiveSpan({ name, op });
}

// ============================================================================
// API Handler Wrapper
// ============================================================================

/**
 * 包裝 Vercel API Handler，提供完整的 Sentry 整合
 *
 * 功能：
 * - 自動初始化 Sentry
 * - 自動捕獲未處理的錯誤
 * - 自動添加 Transaction 追蹤
 * - 自動記錄請求資訊
 *
 * @param handler - API Handler 函數
 * @param handlerName - Handler 名稱（用於識別）
 * @returns 包裝後的 Handler
 */
export function withSentryHandler(handler: VercelHandler, handlerName: string): VercelHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    initSentry();

    // 開始 Transaction
    const transaction = startTransaction(`API ${handlerName}`, 'http.server');

    // 設置請求上下文
    Sentry.setContext('request', {
      method: req.method,
      url: req.url,
      query: req.query,
    });

    // 添加麵包屑
    addBreadcrumb(`${req.method} ${handlerName}`, 'http', {
      url: req.url,
    });

    try {
      const result = await handler(req, res);
      transaction?.end();
      return result;
    } catch (error) {
      // 捕獲錯誤
      captureError(error, {
        handler: handlerName,
        method: req.method,
        url: req.url,
        query: req.query,
        // 不記錄完整 body，可能包含敏感資訊
        hasBody: Boolean(req.body),
      });

      transaction?.end();

      // 如果響應尚未發送，返回 500
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }

      throw error;
    }
  };
}

/**
 * 舊版 wrapper（向後兼容）
 * @deprecated 請使用 withSentryHandler
 */
export function withSentry<T extends (...args: unknown[]) => Promise<unknown>>(handler: T): T {
  initSentry();

  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      captureError(error, {
        handler: handler.name || 'anonymous',
      });
      throw error;
    }
  }) as T;
}

// ============================================================================
// Metrics (Custom)
// ============================================================================

/**
 * 記錄自定義指標
 */
export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  // Sentry 的 metrics 功能
  // 如果不可用，至少記錄到 console
  try {
    Sentry.setMeasurement(name, value, 'none');
    if (tags) {
      Sentry.setTags(tags);
    }
  } catch {
    // Metrics 不可用時靜默失敗
  }
}
