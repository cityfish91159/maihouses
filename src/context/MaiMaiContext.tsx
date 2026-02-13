import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { z } from 'zod';
import type { MaiMaiMood } from '../components/MaiMai/types';
import { safeLocalStorage } from '../lib/safeStorage';
import { logger } from '../lib/logger';
import { getErrorMessage } from '../lib/error';

/**
 * MaiMai 全站統一狀態管理
 * @description 提供全站共享的 MaiMai 心情和訊息狀態
 */

export interface MaiMaiContextValue {
  /** 當前 MaiMai 心情狀態 */
  mood: MaiMaiMood;
  /** 設定 MaiMai 心情 */
  setMood: (mood: MaiMaiMood) => void;
  /** 對話訊息歷史（最多 3 句） */
  messages: string[];
  /** 新增訊息 */
  addMessage: (message: string) => void;
  /** 清空訊息 */
  resetMessages: () => void;
}

const MaiMaiContext = createContext<MaiMaiContextValue | null>(null);

const STORAGE_KEY_MOOD = 'maimai-mood-v1';
const STORAGE_KEY_MESSAGES = 'maimai-messages-v1';
const MAX_MESSAGES = 3;

const VALID_MOODS = new Set<MaiMaiMood>([
  'idle',
  'wave',
  'peek',
  'happy',
  'thinking',
  'excited',
  'confused',
  'celebrate',
  'shy',
  'sleep',
]);
const VALID_MOOD_STRINGS = new Set<string>(VALID_MOODS);

// Zod schema 驗證 localStorage 中的 messages 結構
const StoredMessagesSchema = z.array(z.string()).max(MAX_MESSAGES);

// [NASA TypeScript Safety] 類型守衛驗證 MaiMaiMood
function isValidMood(mood: unknown): mood is MaiMaiMood {
  return typeof mood === 'string' && VALID_MOOD_STRINGS.has(mood);
}

export const MaiMaiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 從 localStorage 初始化 mood
  const [mood, setMoodState] = useState<MaiMaiMood>(() => {
    const stored = safeLocalStorage.getItem(STORAGE_KEY_MOOD);
    if (isValidMood(stored)) {
      return stored;
    }
    return 'idle';
  });

  // 從 localStorage 初始化 messages
  const [messages, setMessagesState] = useState<string[]>(() => {
    const stored = safeLocalStorage.getItem(STORAGE_KEY_MESSAGES);
    if (stored) {
      try {
        const raw: unknown = JSON.parse(stored);
        const result = StoredMessagesSchema.safeParse(raw);
        if (result.success) {
          return result.data.slice(-MAX_MESSAGES);
        }
        // 結構不符預期（非字串陣列等），靜默回退
        logger.warn('[MaiMaiContext] 已儲存訊息結構無效，已重設', {
          raw,
        });
        return [];
      } catch (e) {
        logger.warn('[MaiMaiContext] 解析已儲存訊息失敗', {
          error: getErrorMessage(e),
        });
        return [];
      }
    }
    return [];
  });

  // setMood: 更新心情並持久化
  const setMood = useCallback((newMood: MaiMaiMood) => {
    setMoodState(newMood);
    try {
      safeLocalStorage.setItem(STORAGE_KEY_MOOD, newMood);
    } catch (e) {
      logger.warn('[MaiMaiContext] 儲存心情失敗', { error: getErrorMessage(e) });
    }
  }, []);

  // addMessage: 新增訊息，自動保持最後 3 句
  const addMessage = useCallback((message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setMessagesState((prev) => {
      const updated = [...prev, trimmed].slice(-MAX_MESSAGES);
      try {
        safeLocalStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(updated));
      } catch (e) {
        logger.warn('[MaiMaiContext] 儲存訊息失敗', { error: getErrorMessage(e) });
      }
      return updated;
    });
  }, []);

  // resetMessages: 清空訊息
  const resetMessages = useCallback(() => {
    setMessagesState([]);
    try {
      safeLocalStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify([]));
    } catch (e) {
      logger.warn('[MaiMaiContext] 重設訊息失敗', { error: getErrorMessage(e) });
    }
  }, []);

  // 使用 useMemo 確保 context value 穩定
  const value = useMemo<MaiMaiContextValue>(
    () => ({
      mood,
      setMood,
      messages,
      addMessage,
      resetMessages,
    }),
    [mood, setMood, messages, addMessage, resetMessages]
  );

  return <MaiMaiContext.Provider value={value}>{children}</MaiMaiContext.Provider>;
};

/**
 * useMaiMai Hook - 存取全站 MaiMai 狀態
 * @throws {Error} 如果在 MaiMaiProvider 外使用
 */
export function useMaiMai(): MaiMaiContextValue {
  const ctx = useContext(MaiMaiContext);
  if (!ctx) {
    throw new Error('useMaiMai must be used within MaiMaiProvider');
  }
  return ctx;
}
