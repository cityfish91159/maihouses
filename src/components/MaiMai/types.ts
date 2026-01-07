/**
 * MaiMai 公仔核心型別定義 (v3.0)
 * @description 統一定義所有心情狀態與組件介面
 */

// ============ 基礎型別 ============

/** MaiMai 心情狀態 */
export type MaiMaiMood =
  | "idle" // 待機,輕微呼吸
  | "wave" // 揮手打招呼
  | "peek" // 偷看(輸入密碼)
  | "happy" // 開心
  | "thinking" // 思考中
  | "excited" // 超興奮
  | "confused" // 困惑
  | "celebrate" // 慶祝,撒花
  | "shy" // 害羞/錯誤
  | "sleep"; // 睡著

/** 尺寸配置 */
export type MaiMaiSize = "xs" | "sm" | "md" | "lg" | "xl";

/** 嘴巴形狀 */
export type MouthShape =
  | "smile"
  | "big-smile"
  | "wow"
  | "focused"
  | "worried"
  | "sleep"
  | "line";

// ============ 組件介面 ============

/** 眼睛數據定義 */
export interface EyeData {
  type: "circle" | "path" | "group";
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  strokeWidth?: number;
  fill?: string;
  children?: EyeData[];
  className?: string | undefined;
}

/** 手臂姿勢定義 */
export interface ArmPose {
  left: string;
  right?: string;
  extraType?: "wave" | "peek";
}

/** 眼睛狀態 */
export interface EyeState {
  type: "open" | "closed" | "happy" | "peek" | "worried";
  y?: number;
  size?: number;
}

/** MaiMai Base 組件 Props */
export interface MaiMaiBaseProps {
  mood?: MaiMaiMood | undefined;
  size?: MaiMaiSize | undefined;
  className?: string;
  animated?: boolean;
  onClick?: () => void;
  speechBubble?: string;
  showEffects?: boolean;
}

/** MaiMai 心情狀態機 Hook 參數 */
export interface UseMaiMaiMoodOptions {
  externalMood?: MaiMaiMood | undefined;
  isSuccess?: boolean;
  hasError?: boolean;
  isLoading?: boolean;
  isTypingPassword?: boolean;
  isTypingEmail?: boolean;
  isCelebrating?: boolean;
  /** 是否處於 Hover 狀態 */
  isHovered?: boolean;
}

/** MaiMai 對話氣泡 Props */
export interface MaiMaiSpeechProps {
  messages: string[];
  className?: string;
}

/** 心情配置定義 */
export interface MoodConfig {
  eyebrows: { left: string; right: string };
  eyes: { left: EyeData; right: EyeData };
  mouth: string;
  arms: ArmPose;
  antenna?: { droopy: boolean };
}

// ============ 特效定義 ============

export type EffectItem =
  | {
      kind: "text";
      x: number;
      y: number;
      icon: string;
      size?: number;
      opacity?: number;
      className?: string;
    }
  | {
      kind: "star";
      x: number;
      y: number;
      size: number;
      opacity?: number;
      className?: string;
    }
  | {
      kind: "sparkle";
      x: number;
      y: number;
      size: number;
      opacity?: number;
      className?: string;
    }
  | {
      kind: "confetti";
      x: number;
      y: number;
      size: number;
      opacity?: number;
      className?: string;
    }
  | {
      kind: "circle";
      x: number;
      y: number;
      r: number;
      opacity?: number;
      className?: string;
    }
  | {
      kind: "ellipse";
      x: number;
      y: number;
      rx: number;
      ry: number;
      className?: string;
    };

// ============ Re-exports ============
// 為了向後相容,從 constants 重新匯出所有內容
// Note: configs.ts 已移除重新匯出以避免循環依賴,請直接從 './configs' 引入

export * from "./constants";
