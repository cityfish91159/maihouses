/**
 * MaiMai 公仔組件統一匯出
 * @description 提供所有 MaiMai 相關組件和 Hook 的單一入口
 */

// 核心組件
export { MaiMaiBase } from './MaiMaiBase';
export { MaiMaiSpeech } from './MaiMaiSpeech';

// SVG 部件（可用於組合）
export {
  Antenna,
  Roof,
  Body,
  Eyebrows,
  Eyes,
  Mouth,
  Arms,
  Legs,
  Blush,
  Effects,
} from './MaiMaiBase';

// Hooks
export { useMaiMaiMood, useMascotCelebrateEvent } from './useMaiMaiMood';
export { useConfetti } from './useConfetti';

// 型別
export type {
  MaiMaiMood,
  MaiMaiSize,
  MaiMaiBaseProps,
  MaiMaiSpeechProps,
  UseMaiMaiMoodOptions,
  ArmPose,
  EyeState,
  MouthShape,
} from './types';

// 常數
export { SIZE_CLASSES } from './types';
