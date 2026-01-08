/**
 * useConsumerSession - 管理匿名消費者的 session
 *
 * 功能：
 * 1. 獲取 localStorage 中的 uag_session
 * 2. 檢查 session 是否有效（SSR 安全）
 * 3. 支援 session 過期檢查（預設 7 天）
 */

const SESSION_KEY = "uag_session";
const SESSION_CREATED_KEY = "uag_session_created";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

/**
 * 獲取 session ID（SSR 安全）
 */
function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * 獲取 session 建立時間
 */
function getSessionCreatedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const ts = localStorage.getItem(SESSION_CREATED_KEY);
    return ts ? parseInt(ts, 10) : null;
  } catch {
    return null;
  }
}

/**
 * 檢查 session 是否過期
 */
function isSessionExpired(): boolean {
  const createdAt = getSessionCreatedAt();
  if (!createdAt) {
    // 沒有建立時間記錄，視為未過期（向後相容舊 session）
    return false;
  }
  return Date.now() - createdAt > SESSION_TTL_MS;
}

/**
 * 設置 session（同時記錄建立時間）
 */
function setSession(sessionId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, sessionId);
    // 只有在沒有建立時間時才設置（避免覆蓋）
    if (!localStorage.getItem(SESSION_CREATED_KEY)) {
      localStorage.setItem(SESSION_CREATED_KEY, String(Date.now()));
    }
  } catch {
    // localStorage 不可用時忽略
  }
}

/**
 * 清除 session
 */
function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_CREATED_KEY);
  } catch {
    // localStorage 不可用時忽略
  }
}

export interface ConsumerSessionResult {
  /** Session ID，null 表示無 session */
  sessionId: string | null;
  /** 是否有有效 session（非空且未過期） */
  hasValidSession: boolean;
  /** Session 是否已過期 */
  isExpired: boolean;
  /** 設置新 session */
  setSession: (sessionId: string) => void;
  /** 清除 session */
  clearSession: () => void;
}

/**
 * Hook: 管理匿名消費者的 session
 *
 * @example
 * ```tsx
 * const { sessionId, hasValidSession, isExpired } = useConsumerSession();
 *
 * if (!isAuthenticated && !hasValidSession) {
 *   return <LoginPrompt />;
 * }
 *
 * if (isExpired) {
 *   return <SessionExpiredPrompt />;
 * }
 * ```
 */
export function useConsumerSession(): ConsumerSessionResult {
  const sessionId = getSessionId();
  const isExpired = isSessionExpired();
  const hasValidSession = !!sessionId && !isExpired;

  return {
    sessionId,
    hasValidSession,
    isExpired,
    setSession,
    clearSession,
  };
}

// 導出工具函數供非 hook 場景使用
export { getSessionId, setSession, clearSession, isSessionExpired };
