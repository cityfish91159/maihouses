import { useCallback, useEffect, useRef, useState } from 'react';
import type { MaiMaiMood } from '../components/MaiMai';

const ANIMATION_CONFIG = {
  waveDisplayTime: 3000,
  happyDisplayTime: 1500,
  celebrateDuration: 3000,
  /** 30 秒無操作後顯示 idle 陪伴 */
  idleDelay: 30000,
} as const;

type TriggerOptions = {
  duration?: number;
  confetti?: boolean;
  persist?: boolean;
  onComplete?: () => void;
};

export interface TrustRoomMaiMaiState {
  visible: boolean;
  mood: MaiMaiMood;
  showConfetti: boolean;
}

const scheduleOnFrame = (cb: () => void) => {
  if (typeof window === 'undefined') {
    cb();
    return;
  }
  window.requestAnimationFrame(cb);
};

/**
 * TrustRoom 專用 MaiMai 狀態管理 Hook
 * - 首次進入 wave
 * - 步驟完成 happy
 * - 全完成 celebrate + confetti
 * - 錯誤 shy（可持續顯示）
 */
export function useTrustRoomMaiMai() {
  const [state, setState] = useState<TrustRoomMaiMaiState>({
    visible: false,
    mood: 'idle',
    showConfetti: false,
  });
  const hasShownInitial = useRef(false);
  const persistentError = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    if (idleTimer.current) {
      clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, []);

  const setStateSafe = useCallback((next: TrustRoomMaiMaiState) => {
    scheduleOnFrame(() => setState(next));
  }, []);

  const startIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (persistentError.current) return;
      setStateSafe({ visible: true, mood: 'idle', showConfetti: false });
    }, ANIMATION_CONFIG.idleDelay);
  }, [setStateSafe]);

  const hide = useCallback(() => {
    if (persistentError.current) return;
    setStateSafe({ visible: false, mood: 'idle', showConfetti: false });
  }, [setStateSafe]);

  const trigger = useCallback(
    (mood: MaiMaiMood, options: TriggerOptions = {}) => {
      const { duration, confetti = false, persist = false, onComplete } = options;
      clearTimers();
      if (persist) persistentError.current = true;
      setStateSafe({ visible: true, mood, showConfetti: confetti });
      if (duration) {
        hideTimer.current = setTimeout(() => {
          if (persist) return;
          hide();
          onComplete?.();
        }, duration);
      }
      startIdleTimer();
    },
    [clearTimers, hide, setStateSafe, startIdleTimer]
  );

  /** 觸發「happy」短暫提示 */
  const triggerHappy = useCallback(() => {
    trigger('happy', { duration: ANIMATION_CONFIG.happyDisplayTime });
  }, [trigger]);

  /** 觸發「celebrate」並顯示 confetti */
  const triggerCelebrate = useCallback(() => {
    trigger('celebrate', {
      duration: ANIMATION_CONFIG.celebrateDuration,
      confetti: true,
    });
  }, [trigger]);

  /** 觸發「shy」短暫提示（錯誤用） */
  const triggerShyOnce = useCallback(() => {
    trigger('shy', { duration: ANIMATION_CONFIG.happyDisplayTime });
  }, [trigger]);

  /** 觸發「shy」常駐顯示（錯誤狀態） */
  const triggerError = useCallback(() => {
    persistentError.current = true;
    trigger('shy', { persist: true });
  }, [trigger]);

  /** 清除錯誤狀態並隱藏 */
  const clearError = useCallback(() => {
    persistentError.current = false;
    hide();
  }, [hide]);

  useEffect(() => {
    if (hasShownInitial.current) return;
    hasShownInitial.current = true;
    trigger('wave', { duration: ANIMATION_CONFIG.waveDisplayTime });
  }, [trigger]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return {
    maiMaiState: state,
    triggerHappy,
    triggerCelebrate,
    triggerShyOnce,
    triggerError,
    clearError,
  } as const;
}
