// MUSE Night Mode - Hooks
// ═══════════════════════════════════════════════════════════════

// 影子同步
export { useShadowSync } from './useShadowSync';

// 聊天核心
export { useMuseChat } from './useMuseChat';
export type { UseMuseChatOptions, UseMuseChatReturn } from './useMuseChat';

// Realtime 訂閱
export { useMuseRealtime } from './useMuseRealtime';
export type { UseMuseRealtimeOptions, GodViewCommand } from './useMuseRealtime';

// 多媒體管理
export { useMuseMedia } from './useMuseMedia';
export type { UseMuseMediaOptions, UseMuseMediaReturn } from './useMuseMedia';

// 震動管理
export { useMuseHaptics } from './useMuseHaptics';
export type { UseMuseHapticsReturn, VibrationPattern } from './useMuseHaptics';


// 親密功能（組合器 + 子模組）
export { useMuseIntimacy } from './intimacy';
export type { UseMuseIntimacyOptions, UseMuseIntimacyReturn } from './intimacy';

// 親密子模組（可獨立使用）
export {
  useClimaxControl,
  useSexyLock,
  useIceZone,
  useMoanDetector
} from './intimacy';

export type {
  ClimaxMetrics,
  SexyLockStatus,
  IceZoneStatus,
  MoanDetectionResult
} from './intimacy';
