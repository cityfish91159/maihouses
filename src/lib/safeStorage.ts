/**
 * Safe Storage Wrapper
 *
 * iOS Safari in Private Mode (and some other restrictive environments)
 * throws a "SecurityError" when accessing localStorage/sessionStorage.
 * This wrapper catches these errors to prevent the app from crashing.
 */

import { logger } from "./logger";

const noopStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
  clear: () => {},
  length: 0,
  key: (_index: number) => null,
};

function getStorage(type: "localStorage" | "sessionStorage") {
  // 1. 先檢查 window 是否存在（SSR 安全）
  if (typeof window === "undefined") {
    return noopStorage;
  }

  // 2. 整個存取過程都用 try-catch 包裝，因為 iOS Safari 私密模式
  //    可能在任何存取 localStorage 的步驟都拋 SecurityError
  try {
    // 直接嘗試取得 storage，不做任何前置檢查
    const storage =
      type === "localStorage" ? window.localStorage : window.sessionStorage;

    if (!storage) {
      return noopStorage;
    }

    // Test storage to verify it actually works
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return storage;
  } catch {
    // 靜默失敗，直接返回 noopStorage
    return noopStorage;
  }
}

export const safeLocalStorage = getStorage("localStorage");
export const safeSessionStorage = getStorage("sessionStorage");

// Helper for type-safe usage (optional)
export const storage = {
  get: (key: string) => safeLocalStorage.getItem(key),
  set: (key: string, value: string) => {
    try {
      safeLocalStorage.setItem(key, value);
    } catch (e) {
      logger.warn("[safeStorage] Storage setItem failed", { error: e });
    }
  },
  remove: (key: string) => safeLocalStorage.removeItem(key),
};
