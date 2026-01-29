import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { MaiMaiMood } from '../components/MaiMai/types';
import { safeLocalStorage } from '../lib/safeStorage';
import { logger } from '../lib/logger';

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

// [NASA TypeScript Safety] 類型守衛驗證 MaiMaiMood
function isValidMood(mood: unknown): mood is MaiMaiMood {
  return typeof mood === 'string' && VALID_MOODS.has(mood as never);
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
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.slice(-MAX_MESSAGES) : [];
      } catch {
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
      logger.warn('[MaiMaiContext] Failed to save mood', { error: e });
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
        logger.warn('[MaiMaiContext] Failed to save messages', { error: e });
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
      logger.warn('[MaiMaiContext] Failed to reset messages', { error: e });
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
