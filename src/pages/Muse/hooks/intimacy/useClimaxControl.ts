/**
 * 💦 useClimaxControl Hook
 * 職責：高潮計時器、邊緣控制、釋放管理
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ClimaxMetrics {
  isEdging: boolean;           // 是否在邊緣控制中
  edgingCount: number;          // 邊緣次數
  climaxProgress: number;       // 高潮進度 0-100
  timeToClimax: number;         // 距離高潮秒數
  canClimax: boolean;           // 是否允許高潮
}

export interface UseClimaxControlOptions {
  enabled: boolean;
  edgingThreshold?: number;     // 邊緣閾值 (預設 85)
  climaxCooldown?: number;      // 高潮冷卻時間（秒）
  onEdge?: () => void;
  onClimax?: () => void;
  onDenied?: () => void;
}

export interface UseClimaxControlReturn {
  metrics: ClimaxMetrics;
  startEdging: () => void;
  stopEdging: () => void;
  requestClimax: () => Promise<boolean>;
  denyClimax: () => void;
  reset: () => void;
}

/**
 * Climax control and edging management hook
 *
 * @example
 * const { metrics, startEdging, requestClimax } = useClimaxControl({
 *   enabled: isIntimateMode,
 *   onEdge: () => playEdgingSound()
 * });
 */
export function useClimaxControl(options: UseClimaxControlOptions): UseClimaxControlReturn {
  const {
    enabled,
    edgingThreshold = 85,
    climaxCooldown = 300,
    onEdge,
    onClimax,
    onDenied
  } = options;

  // ═══════════════════════════════════════════════════════════════
  // 狀態
  // ═══════════════════════════════════════════════════════════════

  const [isEdging, setIsEdging] = useState(false);
  const [edgingCount, setEdgingCount] = useState(0);
  const [climaxProgress, setClimaxProgress] = useState(0);
  const [canClimax, setCanClimax] = useState(true);
  const [timeToClimax, setTimeToClimax] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // 開始邊緣控制
  // ═══════════════════════════════════════════════════════════════

  const startEdging = useCallback(() => {
    if (!enabled || isEdging) return;

    setIsEdging(true);
    setClimaxProgress(edgingThreshold);
    setEdgingCount(prev => prev + 1);

    console.log('🔥 開始邊緣控制');
    onEdge?.();

    // 啟動進度條計時器
    timerRef.current = setInterval(() => {
      setClimaxProgress(prev => {
        const next = prev + 1;
        if (next >= 100) {
          // 自動進入高潮倒數
          setTimeToClimax(10);
          return 100;
        }
        return next;
      });
    }, 1000);
  }, [enabled, isEdging, edgingThreshold, onEdge]);

  // ═══════════════════════════════════════════════════════════════
  // 停止邊緣控制
  // ═══════════════════════════════════════════════════════════════

  const stopEdging = useCallback(() => {
    if (!isEdging) return;

    setIsEdging(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 緩慢降低進度
    const decayInterval = setInterval(() => {
      setClimaxProgress(prev => {
        if (prev <= 0) {
          clearInterval(decayInterval);
          return 0;
        }
        return prev - 2;
      });
    }, 1000);

    console.log('⏹️ 停止邊緣控制');
  }, [isEdging]);

  // ═══════════════════════════════════════════════════════════════
  // 請求高潮
  // ═══════════════════════════════════════════════════════════════

  const requestClimax = useCallback(async (): Promise<boolean> => {
    if (!enabled || !canClimax) {
      onDenied?.();
      return false;
    }

    console.log('💦 允許高潮');
    onClimax?.();

    // 清空進度
    setClimaxProgress(0);
    setIsEdging(false);
    setCanClimax(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 冷卻計時器
    setTimeToClimax(climaxCooldown);
    cooldownTimerRef.current = setInterval(() => {
      setTimeToClimax(prev => {
        if (prev <= 1) {
          setCanClimax(true);
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return true;
  }, [enabled, canClimax, climaxCooldown, onClimax, onDenied]);

  // ═══════════════════════════════════════════════════════════════
  // 拒絕高潮
  // ═══════════════════════════════════════════════════════════════

  const denyClimax = useCallback(() => {
    console.log('🚫 拒絕高潮');
    onDenied?.();

    // 重置到邊緣狀態
    setClimaxProgress(edgingThreshold);
    setIsEdging(true);
  }, [edgingThreshold, onDenied]);

  // ═══════════════════════════════════════════════════════════════
  // 重置
  // ═══════════════════════════════════════════════════════════════

  const reset = useCallback(() => {
    setIsEdging(false);
    setEdgingCount(0);
    setClimaxProgress(0);
    setCanClimax(true);
    setTimeToClimax(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }

    console.log('🔄 重置高潮控制');
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 清理
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 返回
  // ═══════════════════════════════════════════════════════════════

  return {
    metrics: {
      isEdging,
      edgingCount,
      climaxProgress,
      timeToClimax,
      canClimax
    },
    startEdging,
    stopEdging,
    requestClimax,
    denyClimax,
    reset
  };
}
