/**
 * 統一錯誤處理工具
 *
 * 提供標準化的錯誤訊息提取,避免各處重複判斷 `err instanceof Error`
 *
 * @example
 * ```ts
 * try {
 *   await riskyOperation();
 * } catch (err) {
 *   logger.error('[Module] 操作失敗', { error: getErrorMessage(err) });
 * }
 * ```
 */

/**
 * 從未知型別的錯誤物件中提取訊息字串
 *
 * @param error - 捕捉到的錯誤 (unknown type)
 * @returns 錯誤訊息字串,若無法提取則返回 'Unknown error'
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    // 嘗試提取常見的錯誤格式
    const err = error as { message?: unknown; msg?: unknown; error?: unknown };

    if (typeof err.message === 'string') {
      return err.message;
    }

    if (typeof err.msg === 'string') {
      return err.msg;
    }

    if (typeof err.error === 'string') {
      return err.error;
    }

    // 如果是 object 但無法提取訊息,嘗試 JSON 序列化
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return 'Unknown error';
}

/**
 * 從未知型別的錯誤物件中提取完整錯誤資訊
 *
 * @param error - 捕捉到的錯誤 (unknown type)
 * @returns 包含訊息、堆疊和原始錯誤的物件
 */
export interface ErrorInfo {
  message: string;
  stack: string | undefined;
  raw: unknown;
}

export function getErrorInfo(error: unknown): ErrorInfo {
  const message = getErrorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;

  return {
    message,
    stack,
    raw: error,
  };
}

/**
 * 安全地包裝 async 函數,自動捕捉錯誤並返回 Result 型別
 *
 * @example
 * ```ts
 * const result = await safeAsync(() => fetch('/api/data'));
 * if (!result.ok) {
 *   logger.error('[API] 請求失敗', { error: result.error });
 *   return;
 * }
 * const data = result.data;
 * ```
 */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}

/**
 * 安全地包裝同步函數,自動捕捉錯誤並返回 Result 型別
 */
export function safeSync<T>(
  fn: () => T
): Result<T> {
  try {
    const data = fn();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: getErrorMessage(error) };
  }
}
