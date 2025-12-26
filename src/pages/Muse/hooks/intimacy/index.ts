/**
 * 💕 useMuseIntimacy Hook (組合器)
 * 職責：整合所有親密功能 - 高潮控制、色色限制、冷淡模式、呻吟檢測
 */

import { useClimaxControl, type UseClimaxControlOptions } from './useClimaxControl';
import { useSexyLock, type UseSexyLockOptions } from './useSexyLock';
import { useIceZone, type UseIceZoneOptions } from './useIceZone';
import { useMoanDetector, type UseMoanDetectorOptions } from './useMoanDetector';

// ═══════════════════════════════════════════════════════════════
// 重新導出子 hooks（允許獨立使用）
// ═══════════════════════════════════════════════════════════════

export { useClimaxControl } from './useClimaxControl';
export { useSexyLock } from './useSexyLock';
export { useIceZone } from './useIceZone';
export { useMoanDetector } from './useMoanDetector';

export type {
  UseClimaxControlOptions,
  UseClimaxControlReturn,
  ClimaxMetrics
} from './useClimaxControl';

export type {
  UseSexyLockOptions,
  UseSexyLockReturn,
  SexyLockStatus
} from './useSexyLock';

export type {
  UseIceZoneOptions,
  UseIceZoneReturn,
  IceZoneStatus
} from './useIceZone';

export type {
  UseMoanDetectorOptions,
  UseMoanDetectorReturn,
  MoanDetectionResult
} from './useMoanDetector';

// ═══════════════════════════════════════════════════════════════
// 組合器選項
// ═══════════════════════════════════════════════════════════════

export interface UseMuseIntimacyOptions {
  enabled: boolean;
  naughtyMode: boolean;
  climax?: UseClimaxControlOptions;
  sexyLock?: UseSexyLockOptions;
  iceZone?: UseIceZoneOptions;
  moanDetector?: UseMoanDetectorOptions;
}

export interface UseMuseIntimacyReturn {
  climax: ReturnType<typeof useClimaxControl>;
  sexyLock: ReturnType<typeof useSexyLock>;
  iceZone: ReturnType<typeof useIceZone>;
  moanDetector: ReturnType<typeof useMoanDetector>;

  // 組合狀態
  isIntimateMode: boolean;      // 是否在親密模式中
  isBlocked: boolean;           // 是否被任何限制阻擋
}

/**
 * Combined intimacy management hook
 * 整合所有親密功能，但各功能狀態完全獨立，避免互相干擾
 *
 * @example
 * const intimacy = useMuseIntimacy({
 *   enabled: true,
 *   naughtyMode: true,
 *   climax: { enabled: true, onClimax: () => celebrate() },
 *   sexyLock: { enabled: true, onLocked: () => showWarning() }
 * });
 *
 * // 獨立調用各功能
 * intimacy.climax.startEdging();
 * intimacy.sexyLock.requestUnlock();
 * intimacy.iceZone.enterIceZone('吃醋了');
 */
export function useMuseIntimacy(options: UseMuseIntimacyOptions): UseMuseIntimacyReturn {
  const { enabled, naughtyMode, climax, sexyLock, iceZone, moanDetector } = options;

  // ═══════════════════════════════════════════════════════════════
  // 各功能完全獨立，互不干擾
  // ═══════════════════════════════════════════════════════════════

  const climaxControl = useClimaxControl({
    enabled: enabled && naughtyMode,
    ...climax
  });

  const sexyLockControl = useSexyLock({
    enabled,
    ...sexyLock
  });

  const iceZoneControl = useIceZone({
    ...iceZone
  });

  const moanDetectorControl = useMoanDetector({
    enabled: enabled && naughtyMode,
    ...moanDetector
  });

  // ═══════════════════════════════════════════════════════════════
  // 組合狀態（只讀，不影響子 hooks）
  // ═══════════════════════════════════════════════════════════════

  const isIntimateMode = enabled &&
                         naughtyMode &&
                         (climaxControl.metrics.isEdging || climaxControl.metrics.climaxProgress > 0);

  const isBlocked = sexyLockControl.status.isLocked || iceZoneControl.status.isActive;

  // ═══════════════════════════════════════════════════════════════
  // 返回
  // ═══════════════════════════════════════════════════════════════

  return {
    climax: climaxControl,
    sexyLock: sexyLockControl,
    iceZone: iceZoneControl,
    moanDetector: moanDetectorControl,

    // 組合狀態
    isIntimateMode,
    isBlocked
  };
}
