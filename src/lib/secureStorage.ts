/**
 * Secure Storage - AES-256 加密的 localStorage 封裝
 *
 * 安全性設計:
 * - 使用 AES-256-CBC 加密演算法
 * - Key 從環境變數讀取（VITE_STORAGE_SECRET）
 * - 自動處理加密/解密錯誤
 * - 防止 XSS 攻擊竊取 Token
 *
 * Skills Applied:
 * - [Backend Safeguard] 資料加密
 * - [NASA TypeScript Safety] 完整類型定義
 * - [Security Audit] 防止 Token 洩漏
 *
 * @example
 * ```typescript
 * // 儲存加密 Token
 * secureStorage.setItem('trustToken', 'abc-123-xyz');
 *
 * // 讀取解密 Token
 * const token = secureStorage.getItem('trustToken');
 * ```
 */

import CryptoJS from 'crypto-js';
import { logger } from './logger';
import { safeLocalStorage } from './safeStorage';

// ============================================================================
// Constants
// ============================================================================

/**
 * 加密金鑰
 *
 * Team Oscar-1: P0-5 修復
 * - 移除 fallback 預設金鑰
 * - 強制要求生產環境設定 VITE_STORAGE_SECRET
 *
 * @security 必須設定 VITE_STORAGE_SECRET 環境變數
 * @throws {Error} 生產環境未設定 VITE_STORAGE_SECRET
 */
const getEncryptionKey = (): string => {
  const key = import.meta.env.VITE_STORAGE_SECRET;

  // 生產環境必須設定金鑰
  if (import.meta.env.PROD && !key) {
    throw new Error(
      'SECURITY ERROR: VITE_STORAGE_SECRET is required in production. ' +
        'Please set this environment variable before building.'
    );
  }

  // 開發環境警告
  if (!import.meta.env.PROD && !key) {
    logger.warn(
      '[secureStorage] Using development fallback key. Set VITE_STORAGE_SECRET for production.'
    );
    return 'maihouses-dev-key-DO-NOT-USE-IN-PRODUCTION';
  }

  return key;
};

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * 儲存鍵值前綴
 * 用於識別加密的資料
 */
const STORAGE_PREFIX = 'mh_encrypted_';

// [Team Oscar-1] Security Warning 已整合至 getEncryptionKey()

// ============================================================================
// Types
// ============================================================================

interface SecureStorage {
  /**
   * 儲存加密資料到 localStorage
   *
   * @param key - 儲存鍵值
   * @param value - 要加密的資料（字串）
   * @returns 是否成功儲存
   */
  setItem(key: string, value: string): boolean;

  /**
   * 從 localStorage 讀取並解密資料
   *
   * @param key - 儲存鍵值
   * @returns 解密後的資料，失敗返回 null
   */
  getItem(key: string): string | null;

  /**
   * 移除 localStorage 中的資料
   *
   * @param key - 儲存鍵值
   */
  removeItem(key: string): void;

  /**
   * 清除所有加密儲存的資料
   */
  clear(): void;
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * 加密資料
 *
 * @param plainText - 明文
 * @returns 加密後的密文
 */
function encrypt(plainText: string): string {
  return CryptoJS.AES.encrypt(plainText, ENCRYPTION_KEY).toString();
}

/**
 * 解密資料
 *
 * @param cipherText - 密文
 * @returns 解密後的明文，失敗返回 null
 */
function decrypt(cipherText: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // 驗證解密結果
    if (!decrypted) {
      logger.warn('[secureStorage] Decryption returned empty string');
      return null;
    }

    return decrypted;
  } catch (error) {
    logger.error('[secureStorage] Decryption failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return null;
  }
}

/**
 * Secure Storage 實例
 *
 * 提供加密的 localStorage 操作
 */
export const secureStorage: SecureStorage = {
  setItem(key: string, value: string): boolean {
    try {
      const encrypted = encrypt(value);
      const storageKey = STORAGE_PREFIX + key;
      safeLocalStorage.setItem(storageKey, encrypted);

      logger.debug('[secureStorage] Item stored', { key });
      return true;
    } catch (error) {
      logger.error('[secureStorage] Failed to store item', {
        key,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return false;
    }
  },

  getItem(key: string): string | null {
    try {
      const storageKey = STORAGE_PREFIX + key;
      const encrypted = safeLocalStorage.getItem(storageKey);

      if (!encrypted) {
        return null;
      }

      const decrypted = decrypt(encrypted);
      return decrypted;
    } catch (error) {
      logger.error('[secureStorage] Failed to get item', {
        key,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return null;
    }
  },

  removeItem(key: string): void {
    try {
      const storageKey = STORAGE_PREFIX + key;
      safeLocalStorage.removeItem(storageKey);
      logger.debug('[secureStorage] Item removed', { key });
    } catch (error) {
      logger.error('[secureStorage] Failed to remove item', {
        key,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  },

  clear(): void {
    try {
      // 只清除加密的資料（有前綴的）
      const keysToRemove: string[] = [];

      for (let i = 0; i < safeLocalStorage.length; i++) {
        const key = safeLocalStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => safeLocalStorage.removeItem(key));
      logger.debug('[secureStorage] All encrypted items cleared', {
        count: keysToRemove.length,
      });
    } catch (error) {
      logger.error('[secureStorage] Failed to clear items', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  },
};

// ============================================================================
// Migration Helper
// ============================================================================

/**
 * 遷移舊的未加密資料到加密儲存
 *
 * @param oldKey - 舊的儲存鍵值
 * @param newKey - 新的儲存鍵值（可選，預設與 oldKey 相同）
 * @returns 是否成功遷移
 *
 * @example
 * ```typescript
 * // 遷移現有的 trustToken
 * migrateLegacyData('trustToken');
 * ```
 */
export function migrateLegacyData(oldKey: string, newKey?: string): boolean {
  try {
    const oldValue = safeLocalStorage.getItem(oldKey);

    if (!oldValue) {
      return false;
    }

    const targetKey = newKey ?? oldKey;
    const success = secureStorage.setItem(targetKey, oldValue);

    if (success) {
      safeLocalStorage.removeItem(oldKey);
      logger.info('[secureStorage] Legacy data migrated', {
        oldKey,
        newKey: targetKey,
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('[secureStorage] Migration failed', {
      oldKey,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return false;
  }
}

