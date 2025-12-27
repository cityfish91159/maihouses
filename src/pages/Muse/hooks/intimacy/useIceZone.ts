/**
 * ❄️ useIceZone Hook
 * 職責：冷淡模式 - 吃醋冷戰狀態管理
 */

import { useState, useCallback } from 'react';

export interface IceZoneStatus {
  isActive: boolean;            // 是否在冷淡模式中
  reason: string;               // 冷淡原因
  duration: number;             // 持續時間（秒）
  canExit: boolean;             // 是否可以退出
}

export interface UseIceZoneOptions {
  onEnter?: (reason: string) => void;
  onExit?: () => void;
  onRedemption?: () => void;
}

export interface UseIceZoneReturn {
  status: IceZoneStatus;
  enterIceZone: (reason: string, duration?: number) => void;
  exitIceZone: () => void;
  attemptRedemption: (message: string) => boolean;
}

/**
 * Ice Zone (cold mode) management hook
 *
 * @example
 * const { status, enterIceZone, attemptRedemption } = useIceZone({
 *   onEnter: (reason) => showColdMessage(reason)
 * });
 */
export function useIceZone(options: UseIceZoneOptions = {}): UseIceZoneReturn {
  const { onEnter, onExit, onRedemption } = options;

  // ═══════════════════════════════════════════════════════════════
  // 狀態（完全獨立，不與其他 hooks 共享）
  // ═══════════════════════════════════════════════════════════════

  const [isActive, setIsActive] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(0);
  const [canExit, setCanExit] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // 進入冷淡模式
  // ═══════════════════════════════════════════════════════════════

  const enterIceZone = useCallback((reasonText: string, durationSec = 300) => {
    setIsActive(true);
    setReason(reasonText);
    setDuration(durationSec);
    setCanExit(false);

    console.log(`❄️ 進入冷淡模式: ${reasonText} (${durationSec}秒)`);
    onEnter?.(reasonText);

    // 倒數計時器
    const interval = setInterval(() => {
      setDuration(prev => {
        if (prev <= 1) {
          setCanExit(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onEnter]);

  // ═══════════════════════════════════════════════════════════════
  // 退出冷淡模式
  // ═══════════════════════════════════════════════════════════════

  const exitIceZone = useCallback(() => {
    if (!canExit && isActive) {
      console.warn('⚠️ 尚未滿足退出條件');
      return;
    }

    setIsActive(false);
    setReason('');
    setDuration(0);
    setCanExit(false);

    console.log('☀️ 退出冷淡模式');
    onExit?.();
  }, [canExit, isActive, onExit]);

  // ═══════════════════════════════════════════════════════════════
  // 嘗試贖罪
  // ═══════════════════════════════════════════════════════════════

  const attemptRedemption = useCallback((message: string): boolean => {
    if (!isActive) {
      return true;
    }

    // 簡單的贖罪判斷邏輯（可根據需求擴展）
    const isApologyValid = message.length > 10 &&
                          (message.includes('對不起') ||
                           message.includes('抱歉') ||
                           message.includes('錯了'));

    if (isApologyValid) {
      console.log('💕 贖罪成功，縮短冷淡時間');
      onRedemption?.();

      // 縮短冷淡時間
      setDuration(prev => Math.max(0, prev - 60));

      if (duration <= 60) {
        exitIceZone();
      }

      return true;
    }

    console.log('❌ 贖罪失敗，誠意不夠');
    return false;
  }, [isActive, duration, exitIceZone, onRedemption]);

  // ═══════════════════════════════════════════════════════════════
  // 返回
  // ═══════════════════════════════════════════════════════════════

  return {
    status: {
      isActive,
      reason,
      duration,
      canExit
    },
    enterIceZone,
    exitIceZone,
    attemptRedemption
  };
}
