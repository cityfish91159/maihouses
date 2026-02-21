/**
 * Safe Storage Wrapper
 *
 * iOS Safari in Private Mode (and some other restrictive environments)
 * throws a "SecurityError" when accessing localStorage/sessionStorage.
 * This wrapper catches these errors to prevent the app from crashing.
 */

import { getErrorMessage } from './error';
import { logger } from './logger';

interface SafeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  length: number;
  key: (index: number) => string | null;
}

const noopStorage: SafeStorage = Object.freeze({
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  length: 0,
  key: (_index: number) => null,
});

function getStorage(type: 'localStorage' | 'sessionStorage'): SafeStorage {
  // 1. 先檢查 window 是否存在（SSR 安全）
  if (typeof window === 'undefined') {
    return noopStorage;
  }

  // 2. 整個存取過程都用 try-catch 包裝，因為 iOS Safari 私密模式
  //    可能在任何存取 localStorage 的步驟都拋 SecurityError
  try {
    // 直接嘗試取得 storage，不做任何前置檢查
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;

    if (!storage) {
      return noopStorage;
    }

    // 探測 storage 是否真正可用
    // 使用較長值模擬實際寫入，iOS 私隱模式探測寫入可能通過但後續配額超限
    const testKey = '__storage_test__';
    const testValue = 'x'.repeat(64);
    storage.setItem(testKey, testValue);
    const readBack = storage.getItem(testKey);
    storage.removeItem(testKey);
    if (readBack !== testValue) {
      return noopStorage;
    }
    return storage;
  } catch (error) {
    logger.warn('[safeStorage] Storage unavailable', {
      type,
      error: getErrorMessage(error),
    });
    return noopStorage;
  }
}

// 模組載入時即 eager evaluate（CSR-only 架構，無 SSR/RSC）。
// SSR 環境 typeof window === 'undefined'，會回傳 noopStorage 且後續不重算——屬已知設計取捨。
export const safeLocalStorage = getStorage('localStorage');
export const safeSessionStorage = getStorage('sessionStorage');

interface StorageHelper {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
  remove: (key: string) => void;
}

export const storage: StorageHelper = {
  get: (key: string) => safeLocalStorage.getItem(key),
  set: (key: string, value: string) => {
    try {
      safeLocalStorage.setItem(key, value);
    } catch (error) {
      logger.warn('[safeStorage] Storage setItem failed', { error: getErrorMessage(error) });
    }
  },
  remove: (key: string) => {
    try {
      safeLocalStorage.removeItem(key);
    } catch (error) {
      logger.warn('[safeStorage] Storage removeItem failed', { error: getErrorMessage(error) });
    }
  },
};
