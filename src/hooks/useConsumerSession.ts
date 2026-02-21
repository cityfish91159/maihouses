import { useState, useCallback, useEffect } from 'react';
import { safeLocalStorage } from '../lib/safeStorage';

/**
 * useConsumerSession - 管理匿名消費者的 session
 *
 * 功能：
 * 1. 獲取 localStorage 中的 uag_session
 * 2. 檢查 session 是否有效（SSR 安全）
 * 3. 支援 session 過期檢查（預設 7 天）
 * 4. 使用 useState 快取避免每次 render 都讀 localStorage
 */

const SESSION_KEY = 'uag_session';
const SESSION_CREATED_KEY = 'uag_session_created';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天
const SESSION_SYNC_INTERVAL_MS = 60 * 1000;

/**
 * 獲取 session ID（SSR 安全）
 */
function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return safeLocalStorage.getItem(SESSION_KEY);
}

/**
 * 獲取 session 建立時間
 */
function getSessionCreatedAt(): number | null {
  if (typeof window === 'undefined') return null;
  const ts = safeLocalStorage.getItem(SESSION_CREATED_KEY);
  return ts ? parseInt(ts, 10) : null;
}

/**
 * 檢查 session 是否過期
 */
function isSessionExpired(): boolean {
  const sessionId = getSessionId();
  if (!sessionId) return false;

  const createdAt = getSessionCreatedAt();
  if (!createdAt || Number.isNaN(createdAt) || createdAt <= 0) {
    // 缺少建立時間時視為過期，避免舊資料永久有效
    return true;
  }
  return Date.now() - createdAt > SESSION_TTL_MS;
}

function readSessionState() {
  const sessionId = getSessionId();
  if (!sessionId) {
    return {
      sessionId: null,
      isExpired: false,
    };
  }

  return {
    sessionId,
    isExpired: isSessionExpired(),
  };
}

function shouldResetSessionCreatedAt(createdAtRaw: string | null): boolean {
  if (!createdAtRaw) return true;
  const createdAt = Number.parseInt(createdAtRaw, 10);
  if (Number.isNaN(createdAt) || createdAt <= 0) return true;
  return Date.now() - createdAt > SESSION_TTL_MS;
}

/**
 * 設置 session（同時記錄建立時間）
 */
function setSession(sessionId: string): void {
  if (typeof window === 'undefined') return;
  safeLocalStorage.setItem(SESSION_KEY, sessionId);
  const createdAtRaw = safeLocalStorage.getItem(SESSION_CREATED_KEY);
  // 建立時間缺失/無效/已過期時重設，避免新 session 套用到舊時間戳
  if (shouldResetSessionCreatedAt(createdAtRaw)) {
    safeLocalStorage.setItem(SESSION_CREATED_KEY, String(Date.now()));
  }
}

/**
 * 清除 session
 */
function clearSession(): void {
  if (typeof window === 'undefined') return;
  safeLocalStorage.removeItem(SESSION_KEY);
  safeLocalStorage.removeItem(SESSION_CREATED_KEY);
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
  }>(() => readSessionState());

  const syncSessionState = useCallback(() => {
    setSessionState(readSessionState());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== SESSION_KEY && event.key !== SESSION_CREATED_KEY) {
        return;
      }
      syncSessionState();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSessionState();
      }
    };

    const intervalId = window.setInterval(syncSessionState, SESSION_SYNC_INTERVAL_MS);
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncSessionState]);

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
