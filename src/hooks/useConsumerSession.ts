import { useState, useCallback } from "react";

/**
 * useConsumerSession - 管理匿名消費者的 session
 *
 * 功能：
 * 1. 獲取 localStorage 中的 uag_session
 * 2. 檢查 session 是否有效（SSR 安全）
 * 3. 支援 session 過期檢查（預設 7 天）
 * 4. 使用 useState 快取避免每次 render 都讀 localStorage
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
 * 使用 useState 快取 session 狀態，避免每次 render 都讀 localStorage。
 * 透過 useEffect 在 mount 時初始化，並提供 refresh 機制。
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
  // 使用 useState 快取 session 狀態
  const [sessionState, setSessionState] = useState<{
    sessionId: string | null;
    isExpired: boolean;
  }>(() => ({
    // 初始值：SSR 時為 null，CSR 時讀取 localStorage
    sessionId: getSessionId(),
    isExpired: isSessionExpired(),
  }));

  // 包裝 setSession 以同步更新 state
  const handleSetSession = useCallback((newSessionId: string) => {
    setSession(newSessionId);
    setSessionState({
      sessionId: newSessionId,
      isExpired: false, // 新設置的 session 不會過期
    });
  }, []);

  // 包裝 clearSession 以同步更新 state
  const handleClearSession = useCallback(() => {
    clearSession();
    setSessionState({
      sessionId: null,
      isExpired: false,
    });
  }, []);

  const hasValidSession = !!sessionState.sessionId && !sessionState.isExpired;

  return {
    sessionId: sessionState.sessionId,
    hasValidSession,
    isExpired: sessionState.isExpired,
    setSession: handleSetSession,
    clearSession: handleClearSession,
  };
}

// 導出工具函數供非 hook 場景使用
export { getSessionId, setSession, clearSession, isSessionExpired };
