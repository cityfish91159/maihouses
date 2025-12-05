/**
 * useMockState - 統一管理 Mock 狀態的唯一來源
 * 
 * Single Source of Truth for mock state management.
 * Handles URL, localStorage, and state synchronization in one place.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const MOCK_PARAM = 'mock';
const MOCK_STORAGE_KEY = 'community-wall-use-mock';

const parseBoolParam = (value: string | null): boolean | null => {
  if (value === null) return null;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return null;
};

const safeGetBoolean = (key: string, fallback: boolean): boolean => {
  try {
    const stored = localStorage.getItem(key);
    const parsed = parseBoolParam(stored);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

const safeSetBoolean = (key: string, value: boolean): void => {
  try {
    localStorage.setItem(key, String(value));
  } catch (error) {
    console.warn(`[useMockState] Failed to save ${key}:`, error);
  }
};

export interface UseMockStateReturn {
  useMock: boolean;
  setUseMock: (value: boolean) => void;
}

/**
 * 統一管理 Mock 狀態
 * 
 * 優先順序：URL > localStorage > defaultValue
 * 
 * @param defaultValue - 預設值（當 URL 和 localStorage 都沒有時使用）
 */
export function useMockState(defaultValue = false): UseMockStateReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const isInitialized = useRef(false);

  // 計算初始值：URL > localStorage > default
  const getInitialValue = (): boolean => {
    const urlValue = parseBoolParam(searchParams.get(MOCK_PARAM));
    if (urlValue !== null) return urlValue;
    return safeGetBoolean(MOCK_STORAGE_KEY, defaultValue);
  };

  const [useMock, setUseMockInternal] = useState(getInitialValue);

  // 統一的 setter：同時更新 state、URL、localStorage
  const setUseMock = useCallback((value: boolean) => {
    setUseMockInternal(value);
    
    // 更新 URL
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(MOCK_PARAM, 'true');
      } else {
        next.delete(MOCK_PARAM);
      }
      return next;
    }, { replace: true });

    // 更新 localStorage
    safeSetBoolean(MOCK_STORAGE_KEY, value);
  }, [setSearchParams]);

  // 監聽 URL 變化（外部修改 URL 時同步）
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      return;
    }
    const urlValue = parseBoolParam(searchParams.get(MOCK_PARAM));
    if (urlValue !== null && urlValue !== useMock) {
      setUseMockInternal(urlValue);
      safeSetBoolean(MOCK_STORAGE_KEY, urlValue);
    }
  }, [searchParams, useMock]);

  // 監聽其他分頁的 localStorage 變化
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== MOCK_STORAGE_KEY || event.storageArea !== localStorage) return;
      const parsed = parseBoolParam(event.newValue);
      if (parsed !== null && parsed !== useMock) {
        setUseMockInternal(parsed);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [useMock]);

  return { useMock, setUseMock };
}

export default useMockState;
