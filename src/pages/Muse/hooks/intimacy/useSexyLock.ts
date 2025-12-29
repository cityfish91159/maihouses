/**
 * 🔒 useSexyLock Hook
 * 職責：色色限制邏輯 - 時段控制、解鎖狀態管理
 */

import { useState, useEffect, useCallback } from 'react';
import { isInSexyLockedHours } from '../../utils';

export interface SexyLockStatus {
  isLocked: boolean;            // 目前是否上鎖
  isUnlocked: boolean;          // 是否已解鎖（手動）
  canUnlock: boolean;           // 是否可以解鎖
  restrictedHours: boolean;     // 是否在限制時段（8-17）
  unlockAttempts: number;       // 解鎖嘗試次數
}

export interface UseSexyLockOptions {
  enabled: boolean;
  onLocked?: () => void;
  onUnlocked?: () => void;
  onAttemptBlocked?: () => void;
}

export interface UseSexyLockReturn {
  status: SexyLockStatus;
  requestUnlock: () => boolean;
  lock: () => void;
  checkStatus: () => void;
}

/**
 * Sexy content lock management hook
 *
 * @example
 * const { status, requestUnlock } = useSexyLock({
 *   enabled: true,
 *   onLocked: () => showLockedMessage()
 * });
 */
export function useSexyLock(options: UseSexyLockOptions): UseSexyLockReturn {
  const {
    enabled,
    onLocked,
    onUnlocked,
    onAttemptBlocked
  } = options;

  // ═══════════════════════════════════════════════════════════════
  // 狀態
  // ═══════════════════════════════════════════════════════════════

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockAttempts, setUnlockAttempts] = useState(0);
  const [restrictedHours, setRestrictedHours] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // 檢查時段狀態
  // ═══════════════════════════════════════════════════════════════

  const checkStatus = useCallback(() => {
    const inRestrictedHours = isInSexyLockedHours();
    setRestrictedHours(inRestrictedHours);

    // 判斷是否上鎖
    const shouldLock = enabled && inRestrictedHours && !isUnlocked;
    setIsLocked(shouldLock);

    if (shouldLock) {
      console.log('🔒 色色內容已上鎖（限制時段：8:00-17:00）');
      onLocked?.();
    }

    return shouldLock;
  }, [enabled, isUnlocked, onLocked]);

  // ═══════════════════════════════════════════════════════════════
  // 請求解鎖
  // ═══════════════════════════════════════════════════════════════

  const requestUnlock = useCallback((): boolean => {
    if (!enabled) return true;

    const inRestrictedHours = isInSexyLockedHours();

    // 非限制時段，直接通過
    if (!inRestrictedHours) {
      console.log('✅ 非限制時段，色色內容可用');
      return true;
    }

    // 已解鎖，直接通過
    if (isUnlocked) {
      console.log('✅ 已解鎖，色色內容可用');
      return true;
    }

    // 嘗試解鎖
    setUnlockAttempts(prev => prev + 1);

    // 解鎖條件：嘗試 3 次後可解鎖（可自訂邏輯）
    if (unlockAttempts >= 2) {
      setIsUnlocked(true);
      setIsLocked(false);
      console.log('🔓 解鎖成功');
      onUnlocked?.();
      return true;
    }

    // 解鎖失敗
    console.log(`🚫 解鎖失敗（${unlockAttempts + 1}/3 次嘗試）`);
    onAttemptBlocked?.();
    return false;
  }, [enabled, isUnlocked, unlockAttempts, onUnlocked, onAttemptBlocked]);

  // ═══════════════════════════════════════════════════════════════
  // 上鎖
  // ═══════════════════════════════════════════════════════════════

  const lock = useCallback(() => {
    setIsUnlocked(false);
    setUnlockAttempts(0);
    checkStatus();
    console.log('🔒 重新上鎖');
  }, [checkStatus]);

  // ═══════════════════════════════════════════════════════════════
  // 自動檢查時段變化（每分鐘檢查一次）
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!enabled) return;

    // 初始檢查
    checkStatus();

    // 定期檢查（每分鐘）
    const interval = setInterval(() => {
      checkStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, [enabled, checkStatus]);

  // ═══════════════════════════════════════════════════════════════
  // 返回
  // ═══════════════════════════════════════════════════════════════

  return {
    status: {
      isLocked,
      isUnlocked,
      canUnlock: unlockAttempts < 3,
      restrictedHours,
      unlockAttempts
    },
    requestUnlock,
    lock,
    checkStatus
  };
}
