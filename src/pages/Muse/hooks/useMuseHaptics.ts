/**
 * 📳 useMuseHaptics Hook
 * 職責：震動模式管理 - 心跳、節奏、模式控制
 */

import { useCallback, useRef } from 'react';

export type VibrationPattern = number | number[];

export interface UseMuseHapticsReturn {
  // 基礎震動
  vibrate: (pattern: VibrationPattern) => void;
  stopVibration: () => void;

  // 預設模式
  playHeartbeat: () => void;
  playPulse: (intensity: number) => void;
  playEdging: () => void;
  playClimax: () => void;

  // 檢查支援
  isSupported: boolean;
}

/**
 * Haptics/Vibration management hook
 *
 * @example
 * const { playHeartbeat, playClimax, isSupported } = useMuseHaptics();
 * if (isSupported) {
 *   playHeartbeat();
 * }
 */
export function useMuseHaptics(): UseMuseHapticsReturn {
  const vibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 檢查震動支援
  // ═══════════════════════════════════════════════════════════════

  const isSupported = 'vibrate' in navigator;

  // ═══════════════════════════════════════════════════════════════
  // 基礎震動
  // ═══════════════════════════════════════════════════════════════

  const vibrate = useCallback((pattern: VibrationPattern) => {
    if (!isSupported) {
      console.warn('⚠️ 此設備不支援震動');
      return;
    }

    try {
      navigator.vibrate(pattern);
      console.log('📳 震動:', pattern);
    } catch (error) {
      console.error('❌ 震動失敗:', error);
    }
  }, [isSupported]);

  // ═══════════════════════════════════════════════════════════════
  // 停止震動
  // ═══════════════════════════════════════════════════════════════

  const stopVibration = useCallback(() => {
    if (!isSupported) return;

    navigator.vibrate(0);

    if (vibrationTimeoutRef.current) {
      clearTimeout(vibrationTimeoutRef.current);
      vibrationTimeoutRef.current = null;
    }

    console.log('⏹️ 停止震動');
  }, [isSupported]);

  // ═══════════════════════════════════════════════════════════════
  // 預設模式：心跳
  // ═══════════════════════════════════════════════════════════════

  const playHeartbeat = useCallback(() => {
    // 模擬心跳：短震-停-短震-長停
    vibrate([100, 100, 100, 500]);
  }, [vibrate]);

  // ═══════════════════════════════════════════════════════════════
  // 預設模式：脈衝（根據強度調整）
  // ═══════════════════════════════════════════════════════════════

  const playPulse = useCallback((intensity: number) => {
    // intensity: 0-100
    const duration = Math.floor(50 + (intensity / 100) * 200); // 50-250ms
    const pause = Math.floor(300 - (intensity / 100) * 200); // 300-100ms

    vibrate([duration, pause, duration]);
  }, [vibrate]);

  // ═══════════════════════════════════════════════════════════════
  // 預設模式：邊緣控制（快速短震）
  // ═══════════════════════════════════════════════════════════════

  const playEdging = useCallback(() => {
    // 快速短震：模擬邊緣的緊張感
    vibrate([50, 50, 50, 50, 50, 100]);
  }, [vibrate]);

  // ═══════════════════════════════════════════════════════════════
  // 預設模式：高潮（強烈連續震動）
  // ═══════════════════════════════════════════════════════════════

  const playClimax = useCallback(() => {
    // 強烈連續震動
    vibrate([200, 50, 200, 50, 200, 50, 300]);
  }, [vibrate]);

  return {
    // 基礎
    vibrate,
    stopVibration,

    // 預設模式
    playHeartbeat,
    playPulse,
    playEdging,
    playClimax,

    // 支援檢查
    isSupported
  };
}
