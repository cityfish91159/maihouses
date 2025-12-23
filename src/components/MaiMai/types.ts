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

/** 
 * 手臂姿勢定義
 * @property left - 左手路徑 (真理來源)，座標系為 200x200
 * @property right - 右手路徑 (選填)，若未提供則根據 left 自動鏡像 (x -> 200-x)
 * @property extraType - 額外渲染類型 (如揮手特效、遮眼橫條)
 */
export interface ArmPose {
  left: string;
  right?: string;
  extraType?: 'wave' | 'peek';
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
  /** 是否 hover 中 */
  isHovered?: boolean;
  /** 是否處於慶祝狀態（點擊 5 次觸發）*/
  isCelebrating?: boolean;
}

/** MaiMai 對話氣泡 Props */
export interface MaiMaiSpeechProps {
  messages: string[];
  className?: string;
}

/** 眼睛數據定義 */
export interface EyeData {
  type: 'circle' | 'path' | 'group';
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  strokeWidth?: number;
  fill?: string;
  children?: EyeData[];
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

// ============ SVG 座標常量 (真理來源) ============
export const CANVAS_SIZE = 200;
export const CENTER_X = 100;

export const BODY_X = 55;
export const BODY_Y = 80;
export const BODY_WIDTH = 90;
export const BODY_HEIGHT = 100;

export const SHOULDER_L_X = 55;
export const SHOULDER_R_X = 145;
export const SHOULDER_Y = 130;

export const EYE_L_X = 85;
export const EYE_R_X = 115;
export const EYE_Y = 125;

export const EYEBROW_Y = 110;
export const MOUTH_Y = 150;
export const BLUSH_Y = 140;

export const HIP_L_X = 85;
export const HIP_R_X = 115;
export const HIP_Y = 180;

export const LEG_Y = 215;
export const LEG_FOOT_OFFSET = 10;
export const JUMP_OFFSET = 20;
export const LEG_HIP_OFFSET = 5;
export const LEG_BEND_X = 10;
export const LEG_BEND_Y = 5;

export const ANTENNA_Y = 40;
export const ANTENNA_TOP_Y = 15;
export const ANTENNA_PEAK_Y = 30;
export const ANTENNA_DROOP_OFFSET = 5;
export const ANTENNA_DROOP_PEAK_OFFSET = 2;

// ============ 相對位移與尺寸常量 ============
export const ANTENNA_DROOP_Y = 5;

export const ROOF_OVERHANG = 15;
export const ROOF_PEAK_Y = 40;

export const EYEBROW_WIDTH = 14;
export const EYEBROW_OFFSET_X = 7;
export const EYEBROW_RAISE_Y = 5;

export const EYE_RADIUS = 4;
export const EYE_PUPIL_RADIUS = 1.5;
export const EYE_SMILE_OFFSET = 5;

export const MOUTH_WIDTH_SM = 10;
export const MOUTH_WIDTH_MD = 15;
export const MOUTH_WIDTH_LG = 20;
export const MOUTH_CURVE_Y = 5;

export const WAVE_OFFSET_X = 29;
export const WAVE_OFFSET_Y = 40;
export const WAVE_RADIUS = 8;
export const WAVE_R_OFFSET_X = 35;

export const PEEK_BAR_WIDTH = 72;
export const PEEK_BAR_HEIGHT = 12;
export const PEEK_BAR_OFFSET_Y = 9;
export const PEEK_BAR_GAP = 24;

export const BLUSH_OFFSET_X = 15;
export const BLUSH_RADIUS = 8;

export const EFFECT_CONFETTI_OFFSET_X = 70;
export const EFFECT_CONFETTI_OFFSET_Y = 40;

// ============ 特效顏色常量 (v2.4) ============
/** 星星/閃光金色 */
export const EFFECT_COLOR_GOLD = '#FFD700';
/** 彩帶紅色 */
export const EFFECT_COLOR_CONFETTI_RED = '#FF6B6B';
/** 彩帶青色 */
export const EFFECT_COLOR_CONFETTI_TEAL = '#4ECDC4';
/** 彩帶黃色 */
export const EFFECT_COLOR_CONFETTI_YELLOW = '#FFE66D';
/** 眼淚/害羞藍色 */
export const EFFECT_COLOR_SHY_BLUE = '#87CEEB';

/** 五角星內半徑比例 (相對於外半徑) */
export const STAR_INNER_RATIO = 0.4;
/** 閃光對角線比例 */
export const SPARKLE_DIAGONAL_RATIO = 0.6;

/**
 * 特效元素定義 (具名 discriminated union)
 * @description v2.4: 移除 emoji text，改用 SVG path (star/sparkle/confetti)
 */
export type EffectItem =
  | { kind: 'text'; x: number; y: number; icon: string; size?: number; opacity?: number; className?: string }
  | { kind: 'star'; x: number; y: number; size: number; opacity?: number; className?: string }
  | { kind: 'sparkle'; x: number; y: number; size: number; opacity?: number; className?: string }
  | { kind: 'confetti'; x: number; y: number; size: number; opacity?: number; className?: string }
  | { kind: 'circle'; x: number; y: number; r: number; opacity?: number; className?: string }
  | { kind: 'ellipse'; x: number; y: number; rx: number; ry: number; className?: string };

export const EFFECT_POSITIONS: Record<MaiMaiMood | 'default', EffectItem[]> = {
  default: [],
  idle: [],
  celebrate: [
    { kind: 'confetti', x: -70, y: 40, size: 14 },
    { kind: 'confetti', x: 60, y: 35, size: 12 },
    { kind: 'sparkle', x: -80, y: 80, size: 10 },
    { kind: 'star', x: 75, y: 75, size: 10 },
  ],
  excited: [
    { kind: 'confetti', x: -70, y: 40, size: 14 },
    { kind: 'confetti', x: 60, y: 35, size: 12 },
    { kind: 'sparkle', x: -80, y: 80, size: 10 },
    { kind: 'star', x: 75, y: 75, size: 10 },
  ],
  peek: [],
  happy: [
    { kind: 'sparkle', x: -60, y: 60, size: 14, className: 'animate-twinkle' },
    { kind: 'sparkle', x: 55, y: 55, size: 12, className: 'animate-twinkle-delay' },
  ],
  thinking: [
    { kind: 'circle', x: 60, y: 50, r: 5, opacity: 0.3 },
    { kind: 'circle', x: 70, y: 35, r: 8, opacity: 0.5 },
    { kind: 'circle', x: 85, y: 15, r: 12, opacity: 0.7 },
  ],
  sleep: [
    { kind: 'text', x: 50, y: 50, size: 12, icon: 'z', opacity: 0.7 },
    { kind: 'text', x: 65, y: 35, size: 16, icon: 'z', opacity: 0.8 },
    { kind: 'text', x: 80, y: 18, size: 20, icon: 'Z', opacity: 1.0 },
  ],
  shy: [{ kind: 'ellipse', x: 55, y: 70, rx: 5, ry: 8 }],
  wave: [
    { kind: 'ellipse', x: 75, y: 60, rx: 20, ry: 15 },
    { kind: 'text', x: 75, y: 65, icon: 'Hi!', size: 12 },
  ],
  confused: [],
};

/** 
 * 鏡像 SVG 路徑 (x -> 200-x)
 * @description 用於自動生成對稱的手臂姿勢
 */
export const mirrorPath = (path: string) => {
  return path.replace(/(\d+)\s+(\d+)/g, (_, x, y) => `${CANVAS_SIZE - parseInt(x)} ${y}`);
};

/** 心情配置定義 */
export interface MoodConfig {
  eyebrows: { left: string; right: string };
  eyes: { left: EyeData; right: EyeData };
  mouth: string;
  arms: ArmPose;
  antenna?: { droopy: boolean };
}

/** 手臂姿勢對照表 */
export const ARM_POSES: Record<MaiMaiMood | 'default', ArmPose> = {
  default: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 23} ${SHOULDER_Y + 8}`,
  },
  idle: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 23} ${SHOULDER_Y + 8}`,
  },
  happy: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 27} ${SHOULDER_Y - 28}`,
  },
  celebrate: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 40} ${SHOULDER_Y - 48}`,
  },
  excited: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 40} ${SHOULDER_Y - 48}`,
  },
  wave: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 17} ${SHOULDER_Y - 18}`,
    right: `M ${SHOULDER_R_X} ${SHOULDER_Y} L ${SHOULDER_R_X + 30} ${SHOULDER_Y - 32}`,
    extraType: 'wave',
  },
  thinking: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 20} ${SHOULDER_Y + 10}`,
    right: `M ${SHOULDER_R_X} ${SHOULDER_Y} L ${SHOULDER_R_X - 13} ${SHOULDER_Y + 20} L ${CENTER_X + 8} ${SHOULDER_Y + 20}`,
  },
  peek: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X + 17} ${SHOULDER_Y - 12}`,
    extraType: 'peek',
  },
  shy: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 13} ${SHOULDER_Y - 12} L ${SHOULDER_L_X - 19} ${SHOULDER_Y + 2}`,
  },
  confused: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 15} ${SHOULDER_Y + 6}`,
  },
  sleep: {
    left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - 17} ${SHOULDER_Y + 22}`,
  },
};

/** 全域心情配置表 (SSOT) */
export const MOOD_CONFIGS: Record<MaiMaiMood | 'default', MoodConfig> = {
  default: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y} Q ${EYE_L_X} ${EYEBROW_Y - EYEBROW_RAISE_Y} ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y} Q ${EYE_R_X} ${EYEBROW_Y - EYEBROW_RAISE_Y} ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
    },
    eyes: {
      left: { type: 'group', className: 'animate-blink', children: [
        { type: 'circle', cx: EYE_L_X, cy: EYE_Y, r: EYE_RADIUS, strokeWidth: 3, fill: 'none' },
      ]},
      right: { type: 'group', className: 'animate-blink', children: [
        { type: 'circle', cx: EYE_R_X, cy: EYE_Y, r: EYE_RADIUS, strokeWidth: 3, fill: 'none' },
      ]},
    },
    mouth: `M ${CENTER_X - MOUTH_WIDTH_SM} ${MOUTH_Y - MOUTH_CURVE_Y} Q ${CENTER_X} ${MOUTH_Y + MOUTH_CURVE_Y} ${CENTER_X + MOUTH_WIDTH_SM} ${MOUTH_Y - MOUTH_CURVE_Y}`,
    arms: ARM_POSES.default,
  },
  idle: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y} Q ${EYE_L_X} ${EYEBROW_Y - EYEBROW_RAISE_Y} ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y} Q ${EYE_R_X} ${EYEBROW_Y - EYEBROW_RAISE_Y} ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
    },
    eyes: {
      left: { type: 'group', className: 'animate-blink', children: [
        { type: 'circle', cx: EYE_L_X, cy: EYE_Y, r: EYE_RADIUS, strokeWidth: 3, fill: 'none' },
      ]},
      right: { type: 'group', className: 'animate-blink', children: [
        { type: 'circle', cx: EYE_R_X, cy: EYE_Y, r: EYE_RADIUS, strokeWidth: 3, fill: 'none' },
      ]},
    },
    mouth: `M ${CENTER_X - MOUTH_WIDTH_SM} ${MOUTH_Y - MOUTH_CURVE_Y} Q ${CENTER_X} ${MOUTH_Y + MOUTH_CURVE_Y} ${CENTER_X + MOUTH_WIDTH_SM} ${MOUTH_Y - MOUTH_CURVE_Y}`,
    arms: ARM_POSES.idle,
  },
  happy: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X - 2} ${EYEBROW_Y - 5} Q ${EYE_L_X} ${EYEBROW_Y - 12} ${EYE_L_X + EYEBROW_OFFSET_X + 9} ${EYEBROW_Y - 5}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X - 2} ${EYEBROW_Y - 5} Q ${EYE_R_X} ${EYEBROW_Y - 12} ${EYE_R_X + EYEBROW_OFFSET_X + 9} ${EYEBROW_Y - 5}`,
    },
    eyes: {
      left: { type: 'path', d: `M ${EYE_L_X - 5} ${EYE_Y} Q ${EYE_L_X} ${EYE_Y - 5} ${EYE_L_X + 5} ${EYE_Y}`, strokeWidth: 3 },
      right: { type: 'path', d: `M ${EYE_R_X - 5} ${EYE_Y} Q ${EYE_R_X} ${EYE_Y - 5} ${EYE_R_X + 5} ${EYE_Y}`, strokeWidth: 3 },
    },
    mouth: `M ${CENTER_X - MOUTH_WIDTH_MD} ${MOUTH_Y - 5} Q ${CENTER_X} ${MOUTH_Y + 10} ${CENTER_X + MOUTH_WIDTH_MD} ${MOUTH_Y - 5}`,
    arms: ARM_POSES.happy,
  },
  wave: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y} Q ${EYE_L_X} ${EYEBROW_Y - EYEBROW_RAISE_Y} ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y} Q ${EYE_R_X} ${EYEBROW_Y - EYEBROW_RAISE_Y} ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
    },
    eyes: {
      left: { type: 'path', d: `M ${EYE_L_X - 5} ${EYE_Y} Q ${EYE_L_X} ${EYE_Y - 5} ${EYE_L_X + 5} ${EYE_Y}`, strokeWidth: 3 },
      right: { type: 'path', d: `M ${EYE_R_X - 5} ${EYE_Y} Q ${EYE_R_X} ${EYE_Y - 5} ${EYE_R_X + 5} ${EYE_Y}`, strokeWidth: 3 },
    },
    mouth: `M ${CENTER_X - MOUTH_WIDTH_MD} ${MOUTH_Y - 5} Q ${CENTER_X} ${MOUTH_Y + 10} ${CENTER_X + MOUTH_WIDTH_MD} ${MOUTH_Y - 5}`,
    arms: ARM_POSES.wave,
  },
  celebrate: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X - 2} ${EYEBROW_Y - 5} Q ${EYE_L_X} ${EYEBROW_Y - 12} ${EYE_L_X + EYEBROW_OFFSET_X + 9} ${EYEBROW_Y - 5}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X - 2} ${EYEBROW_Y - 5} Q ${EYE_R_X} ${EYEBROW_Y - 12} ${EYE_R_X + EYEBROW_OFFSET_X + 9} ${EYEBROW_Y - 5}`,
    },
    eyes: {
      left: { type: 'path', d: `M ${EYE_L_X - 7} ${EYE_Y - 7} Q ${EYE_L_X} ${EYE_Y - 15} ${EYE_L_X + 7} ${EYE_Y - 7}`, strokeWidth: 4 },
      right: { type: 'path', d: `M ${EYE_R_X - 7} ${EYE_Y - 7} Q ${EYE_R_X} ${EYE_Y - 15} ${EYE_R_X + 7} ${EYE_Y - 7}`, strokeWidth: 4 },
    },
    mouth: `M ${CENTER_X - MOUTH_WIDTH_LG} ${MOUTH_Y - 10} Q ${CENTER_X} ${MOUTH_Y + 15} ${CENTER_X + MOUTH_WIDTH_LG} ${MOUTH_Y - 10}`,
    arms: ARM_POSES.celebrate,
  },
  excited: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X - 2} ${EYEBROW_Y - 5} Q ${EYE_L_X} ${EYEBROW_Y - 12} ${EYE_L_X + EYEBROW_OFFSET_X + 9} ${EYEBROW_Y - 5}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X - 2} ${EYEBROW_Y - 5} Q ${EYE_R_X} ${EYEBROW_Y - 12} ${EYE_R_X + EYEBROW_OFFSET_X + 9} ${EYEBROW_Y - 5}`,
    },
    eyes: {
      left: { type: 'path', d: `M ${EYE_L_X - 7} ${EYE_Y - 7} Q ${EYE_L_X} ${EYE_Y - 15} ${EYE_L_X + 7} ${EYE_Y - 7}`, strokeWidth: 4 },
      right: { type: 'path', d: `M ${EYE_R_X - 7} ${EYE_Y - 7} Q ${EYE_R_X} ${EYE_Y - 15} ${EYE_R_X + 7} ${EYE_Y - 7}`, strokeWidth: 4 },
    },
    mouth: `M ${CENTER_X - MOUTH_WIDTH_LG} ${MOUTH_Y - 10} Q ${CENTER_X} ${MOUTH_Y + 15} ${CENTER_X + MOUTH_WIDTH_LG} ${MOUTH_Y - 10}`,
    arms: ARM_POSES.excited,
  },
  peek: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} L ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 2}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 2} L ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y - 2}`,
    },
    eyes: {
      left: { type: 'circle', cx: EYE_L_X, cy: EYE_Y, r: 3, fill: 'currentColor' },
      right: { type: 'circle', cx: EYE_R_X, cy: EYE_Y, r: 3, fill: 'currentColor' },
    },
    mouth: `M ${CENTER_X - 8} ${MOUTH_Y} Q ${CENTER_X} ${MOUTH_Y + 5} ${CENTER_X + 8} ${MOUTH_Y}`,
    arms: ARM_POSES.peek,
    antenna: { droopy: true },
  },
  thinking: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} Q ${EYE_L_X} ${EYEBROW_Y - 5} ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 5} Q ${EYE_R_X} ${EYEBROW_Y - 10} ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y - 5}`,
    },
    eyes: {
      left: { type: 'group', children: [
        { type: 'circle', cx: EYE_L_X + 2, cy: EYE_Y - 2, r: 4, strokeWidth: 3, fill: 'none' },
        { type: 'circle', cx: EYE_L_X + 3, cy: EYE_Y - 3, r: 1.5, fill: 'currentColor' },
      ]},
      right: { type: 'group', children: [
        { type: 'circle', cx: EYE_R_X + 2, cy: EYE_Y - 2, r: 4, strokeWidth: 3, fill: 'none' },
        { type: 'circle', cx: EYE_R_X + 3, cy: EYE_Y - 3, r: 1.5, fill: 'currentColor' },
      ]},
    },
    mouth: `M ${CENTER_X - 5} ${MOUTH_Y} L ${CENTER_X + 5} ${MOUTH_Y}`,
    arms: ARM_POSES.thinking,
  },
  shy: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} L ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
      right: `M ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} L ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
    },
    eyes: {
      left: { type: 'group', children: [
        { type: 'circle', cx: EYE_L_X, cy: EYE_Y, r: 4, strokeWidth: 3, fill: 'none' },
        { type: 'circle', cx: EYE_L_X, cy: EYE_Y + 1, r: 1.5, fill: 'currentColor' },
      ]},
      right: { type: 'group', children: [
        { type: 'circle', cx: EYE_R_X, cy: EYE_Y, r: 4, strokeWidth: 3, fill: 'none' },
        { type: 'circle', cx: EYE_R_X, cy: EYE_Y + 1, r: 1.5, fill: 'currentColor' },
      ]},
    },
    mouth: `M ${CENTER_X - 12} ${MOUTH_Y} Q ${CENTER_X - 6} ${MOUTH_Y - 5} ${CENTER_X} ${MOUTH_Y} Q ${CENTER_X + 6} ${MOUTH_Y + 5} ${CENTER_X + 12} ${MOUTH_Y}`,
    arms: ARM_POSES.shy,
    antenna: { droopy: true },
  },
  confused: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} L ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
      right: `M ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} L ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
    },
    eyes: {
      left: { type: 'group', children: [
        { type: 'circle', cx: EYE_L_X, cy: EYE_Y, r: 4, strokeWidth: 3, fill: 'none' },
        { type: 'circle', cx: EYE_L_X, cy: EYE_Y + 1, r: 1.5, fill: 'currentColor' },
      ]},
      right: { type: 'group', children: [
        { type: 'circle', cx: EYE_R_X, cy: EYE_Y, r: 4, strokeWidth: 3, fill: 'none' },
        { type: 'circle', cx: EYE_R_X, cy: EYE_Y + 1, r: 1.5, fill: 'currentColor' },
      ]},
    },
    mouth: `M ${CENTER_X - 12} ${MOUTH_Y} Q ${CENTER_X - 6} ${MOUTH_Y - 5} ${CENTER_X} ${MOUTH_Y} Q ${CENTER_X + 6} ${MOUTH_Y + 5} ${CENTER_X + 12} ${MOUTH_Y}`,
    arms: ARM_POSES.confused,
  },
  sleep: {
    eyebrows: {
      left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 5} L ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
      right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 5} L ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
    },
    eyes: {
      left: { type: 'path', d: `M ${EYE_L_X - 7} ${EYE_Y} L ${EYE_L_X + 7} ${EYE_Y}`, strokeWidth: 3 },
      right: { type: 'path', d: `M ${EYE_R_X - 7} ${EYE_Y} L ${EYE_R_X + 7} ${EYE_Y}`, strokeWidth: 3 },
    },
    mouth: `M ${CENTER_X} ${MOUTH_Y} m -5, 0 a 5,3 0 1,0 10,0 a 5,3 0 1,0 -10,0`, // 橢圓路徑化
    arms: ARM_POSES.sleep,
    antenna: { droopy: true },
  },
};
