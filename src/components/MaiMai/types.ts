/**
 * MaiMai 公仔核心型別定義
 * @description 統一定義所有心情狀態與組件介面
 */

/** MaiMai 心情狀態 */
export type MaiMaiMood =
  | 'idle'      // 待機，輕微呼吸
  | 'wave'      // 揮手打招呼
  | 'peek'      // 偷看（輸入密碼）
  | 'happy'     // 開心
  | 'thinking'  // 思考中
  | 'excited'   // 超興奮
  | 'confused'  // 困惑
  | 'celebrate' // 慶祝，撒花
  | 'shy'       // 害羞/錯誤
  | 'sleep';    // 睡著

/** 尺寸配置 */
export type MaiMaiSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/** 手臂姿勢 */
export interface ArmPose {
  left: string;   // SVG path d 屬性
  right: string;  // SVG path d 屬性
}

/** 眼睛狀態 */
export interface EyeState {
  type: 'open' | 'closed' | 'happy' | 'peek' | 'worried';
  y?: number;
  size?: number;
}

/** 嘴巴形狀 */
export type MouthShape = 
  | 'smile' 
  | 'big-smile' 
  | 'wow' 
  | 'focused' 
  | 'worried' 
  | 'sleep' 
  | 'line';

/** MaiMai Base 組件 Props */
export interface MaiMaiBaseProps {
  mood?: MaiMaiMood | undefined;
  size?: MaiMaiSize | undefined;
  className?: string;
  animated?: boolean;
  onClick?: () => void;
  /** 對話氣泡文字 */
  speechBubble?: string;
  /** 顯示特效 (愛心、星星等) */
  showEffects?: boolean;
}

/** MaiMai 心情狀態機 Hook 參數 */
export interface UseMaiMaiMoodOptions {
  /** 外部強制指定的心情 */
  externalMood?: MaiMaiMood | undefined;
  /** 是否成功狀態 */
  isSuccess?: boolean;
  /** 是否有錯誤 */
  hasError?: boolean;
  /** 是否載入中 */
  isLoading?: boolean;
  /** 是否正在輸入密碼 */
  isTypingPassword?: boolean;
  /** 是否正在輸入 email */
  isTypingEmail?: boolean;
  /** 是否被 hover */
  isHovered?: boolean;
  /** 是否處於慶祝狀態（點擊 5 次觸發）*/
  isCelebrating?: boolean;
}

/** MaiMai 對話氣泡 Props */
export interface MaiMaiSpeechProps {
  messages: string[];
  className?: string;
}

/** 尺寸 CSS 類別對照表 */
export const SIZE_CLASSES: Record<MaiMaiSize, string> = {
  xs: 'w-12 h-12',
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
  xl: 'w-56 h-56',
};

/** 預設手臂姿勢 */
export const DEFAULT_ARM_POSES: Record<string, ArmPose> = {
  relaxed: { left: 'M 55 130 L 30 140', right: 'M 145 130 L 170 140' },
  wave: { left: 'M 55 130 L 30 140', right: 'M 145 130 L 175 95' },
  celebrate: { left: 'M 55 130 L 15 80', right: 'M 145 130 L 185 80' },
  thinking: { left: 'M 55 130 L 30 140', right: 'M 145 130 L 135 155 L 110 155' },
  shy: { left: 'M 55 130 L 40 120 L 35 130', right: 'M 145 130 L 160 120 L 165 130' },
};
