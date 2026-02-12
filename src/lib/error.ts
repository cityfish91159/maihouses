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

export const UNKNOWN_ERROR_MESSAGE = 'Unknown error';
const ERROR_MESSAGE_KEYS = ['message', 'msg', 'error'] as const;
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apiKey'] as const;
const REDACTED_VALUE = '[REDACTED]';
const CIRCULAR_REFERENCE_VALUE = '[Circular]';
const TRUNCATED_VALUE = '[Truncated]';
const SERIALIZATION_MAX_DEPTH = 8;

type ErrorRecord = Record<string, unknown>;
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

// 標準化鍵名：移除分隔符並轉小寫，支援模糊匹配
// 例如 refresh_token / refreshToken / refresh-token 會對齊為 refreshtoken
function normalizeSensitiveKey(key: string): string {
  return key.replace(/[_-]/g, '').toLowerCase();
}

const SENSITIVE_KEY_SET = new Set<string>(
  SENSITIVE_KEYS.map((key) => normalizeSensitiveKey(key))
);

function isErrorRecord(value: unknown): value is ErrorRecord {
  return typeof value === 'object' && value !== null;
}

function isSensitiveKey(key: string): boolean {
  const normalized = normalizeSensitiveKey(key);
  if (SENSITIVE_KEY_SET.has(normalized)) {
    return true;
  }

  for (const sensitiveKey of SENSITIVE_KEY_SET) {
    if (normalized.includes(sensitiveKey)) {
      return true;
    }
  }

  return false;
}

function normalizeMessage(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : UNKNOWN_ERROR_MESSAGE;
}

function getMessageFromRecord(record: ErrorRecord, visited: WeakSet<object>): string | null {
  if (visited.has(record)) {
    return null;
  }

  visited.add(record);

  for (const key of ERROR_MESSAGE_KEYS) {
    const candidate = record[key];

    if (typeof candidate === 'string') {
      const normalized = candidate.trim();
      if (normalized.length > 0) {
        return normalized;
      }
      continue;
    }

    if (!isErrorRecord(candidate)) {
      continue;
    }

    const nestedMessage = getMessageFromRecord(candidate, visited);
    if (nestedMessage) {
      return nestedMessage;
    }
  }

  return null;
}

function sanitizeForSerialization(
  value: unknown,
  visited: WeakSet<object>,
  depth = 0
): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (depth >= SERIALIZATION_MAX_DEPTH) {
    return TRUNCATED_VALUE;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (!isErrorRecord(value)) {
    return String(value);
  }

  if (visited.has(value)) {
    return CIRCULAR_REFERENCE_VALUE;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForSerialization(item, visited, depth + 1));
  }

  const sanitized: { [key: string]: JsonValue } = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = REDACTED_VALUE;
      continue;
    }

    sanitized[key] = sanitizeForSerialization(nestedValue, visited, depth + 1);
  }

  return sanitized;
}

function serializeUnknownError(error: unknown): string {
  const sanitized = sanitizeForSerialization(error, new WeakSet<object>());

  try {
    const serialized = JSON.stringify(sanitized);
    if (typeof serialized === 'string' && serialized.length > 0) {
      return serialized;
    }
  } catch {
    // Circular reference or unsupported value, fallback to String(error)
  }

  const fallback = String(error);
  return fallback.length > 0 ? fallback : UNKNOWN_ERROR_MESSAGE;
}

/**
 * 從未知型別的錯誤物件中提取訊息字串
 *
 * @param error - 捕捉到的錯誤 (unknown type)
 * @returns 錯誤訊息字串,若無法提取則返回 'Unknown error'
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return normalizeMessage(error.message);
  }

  if (typeof error === 'string') {
    return normalizeMessage(error);
  }

  if (!isErrorRecord(error)) {
    return UNKNOWN_ERROR_MESSAGE;
  }

  const messageFromRecord = getMessageFromRecord(error, new WeakSet<object>());
  if (messageFromRecord) {
    return normalizeMessage(messageFromRecord);
  }

  return normalizeMessage(serializeUnknownError(error));
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
