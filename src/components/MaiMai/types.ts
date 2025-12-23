/**
 * MaiMai 公仔核心型別定義 (v2.0 精簡版)
 * @description 統一定義所有心情狀態與組件介面
 */

// ============ 基礎型別 ============

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

/** 嘴巴形狀 */
export type MouthShape =
  | 'smile'
  | 'big-smile'
  | 'wow'
  | 'focused'
  | 'worried'
  | 'sleep'
  | 'line';

/** 尺寸 CSS 類別對照表 */
export const SIZE_CLASSES: Record<MaiMaiSize, string> = {
  xs: 'w-12 h-12',
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
  xl: 'w-56 h-56',
};

// ============ 組件介面 ============

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
  className?: string | undefined;
}

/** 手臂姿勢定義 */
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

// ============ SVG 座標常量 (SSOT) ============

export const CANVAS_SIZE = 200;
export const CENTER_X = 100;

// 身體
export const BODY_X = 55;
export const BODY_Y = 80;
export const BODY_WIDTH = 90;
export const BODY_HEIGHT = 100;

// 肩膀
export const SHOULDER_L_X = BODY_X;          // 55
export const SHOULDER_R_X = BODY_X + BODY_WIDTH; // 145
export const SHOULDER_Y = BODY_Y + 50;       // 130

// 眼睛
export const EYE_L_X = CENTER_X - 15;        // 85
export const EYE_R_X = CENTER_X + 15;        // 115
export const EYE_Y = 125;
export const EYE_RADIUS = 4;
export const EYE_PUPIL_RADIUS = 1.5;
export const EYE_SMILE_OFFSET = 5;

// 眉毛
export const EYEBROW_Y = 110;
export const EYEBROW_WIDTH = 14;
export const EYEBROW_OFFSET_X = EYEBROW_WIDTH / 2; // 7
export const EYEBROW_RAISE_Y = 5;

// 嘴巴
export const MOUTH_Y = 150;
export const MOUTH_WIDTH_SM = 10;
export const MOUTH_WIDTH_MD = 15;
export const MOUTH_WIDTH_LG = 20;
export const MOUTH_CURVE_Y = 5;

// 腮紅
export const BLUSH_Y = 140;
export const BLUSH_OFFSET_X = 15;
export const BLUSH_RADIUS = 8;

// 髖部與腿
export const HIP_L_X = EYE_L_X;              // 85
export const HIP_R_X = EYE_R_X;              // 115
export const HIP_Y = BODY_Y + BODY_HEIGHT;   // 180
export const LEG_Y = HIP_Y + 35;             // 215
export const LEG_FOOT_OFFSET = 10;
export const LEG_HIP_OFFSET = 5;
export const LEG_BEND_X = 10;
export const LEG_BEND_Y = 5;
export const JUMP_OFFSET = 20;

// 天線
export const ANTENNA_Y = 40;
export const ANTENNA_TOP_Y = 15;
export const ANTENNA_PEAK_Y = 30;
export const ANTENNA_DROOP_OFFSET = 5;
export const ANTENNA_DROOP_PEAK_OFFSET = 2;
export const ANTENNA_DROOP_Y = 5;

// 屋頂
export const ROOF_OVERHANG = 15;
export const ROOF_PEAK_Y = ANTENNA_Y;        // 40

// 揮手特效
export const WAVE_OFFSET_X = 29;
export const WAVE_OFFSET_Y = 40;
export const WAVE_RADIUS = 8;
export const WAVE_R_OFFSET_X = 35;

// 偷看遮罩
export const PEEK_BAR_WIDTH = 72;
export const PEEK_BAR_HEIGHT = 12;
export const PEEK_BAR_OFFSET_Y = 9;
export const PEEK_BAR_GAP = 24;

// ============ 手臂位移常量 (SSOT) ============

export const ARM = {
  rest: [23, 8],
  happy: [27, 28],
  wave: [17, 18],
  celebrate: [40, 48],
  think: [20, 10],
  shy: [[13, 12], [19, -2]] as [[number, number], [number, number]],
  confused: [15, -6],
  sleep: [17, -22],
} as const;

// ============ 特效顏色 ============

export const EFFECT_COLOR_GOLD = '#FFD700';
export const EFFECT_COLOR_CONFETTI_RED = '#FF6B6B';
export const EFFECT_COLOR_CONFETTI_TEAL = '#4ECDC4';
export const EFFECT_COLOR_CONFETTI_YELLOW = '#FFE66D';
export const EFFECT_COLOR_SHY_BLUE = '#87CEEB';
export const STAR_INNER_RATIO = 0.4;
export const SPARKLE_DIAGONAL_RATIO = 0.6;

// ============ 特效定義 ============

export type EffectItem =
  | { kind: 'text'; x: number; y: number; icon: string; size?: number; opacity?: number; className?: string }
  | { kind: 'star'; x: number; y: number; size: number; opacity?: number; className?: string }
  | { kind: 'sparkle'; x: number; y: number; size: number; opacity?: number; className?: string }
  | { kind: 'confetti'; x: number; y: number; size: number; opacity?: number; className?: string }
  | { kind: 'circle'; x: number; y: number; r: number; opacity?: number; className?: string }
  | { kind: 'ellipse'; x: number; y: number; rx: number; ry: number; className?: string };

const CONFETTI_EFFECTS: EffectItem[] = [
  { kind: 'confetti', x: -70, y: 40, size: 14 },
  { kind: 'confetti', x: 60, y: 35, size: 12 },
  { kind: 'sparkle', x: -80, y: 80, size: 10 },
  { kind: 'star', x: 75, y: 75, size: 10 },
];

export const EFFECT_POSITIONS: Record<MaiMaiMood | 'default', EffectItem[]> = {
  default: [],
  idle: [],
  peek: [],
  confused: [],
  celebrate: CONFETTI_EFFECTS,
  excited: CONFETTI_EFFECTS,
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
};

// ============ 工具函式 ============

/** 鏡像 SVG 路徑 (x -> 200-x) */
export const mirrorPath = (path: string) =>
  path.replace(/(\d+)\s+(\d+)/g, (_, x, y) => `${CANVAS_SIZE - parseInt(x)} ${y}`);

// ============ 心情配置工廠 (內部使用) ============

// 眉毛工廠
const brow = {
  neutral: () => ({
    left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y} Q ${EYE_L_X} ${EYEBROW_Y - EYEBROW_RAISE_Y} ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
    right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y} Q ${EYE_R_X} ${EYEBROW_Y - EYEBROW_RAISE_Y} ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
  }),
  raised: () => ({
    left: `M ${EYE_L_X - EYEBROW_OFFSET_X - 2} ${EYEBROW_Y - 5} Q ${EYE_L_X} ${EYEBROW_Y - 12} ${EYE_L_X + EYEBROW_OFFSET_X + 9} ${EYEBROW_Y - 5}`,
    right: `M ${EYE_R_X - EYEBROW_OFFSET_X - 2} ${EYEBROW_Y - 5} Q ${EYE_R_X} ${EYEBROW_Y - 12} ${EYE_R_X + EYEBROW_OFFSET_X + 9} ${EYEBROW_Y - 5}`,
  }),
  worried: () => ({
    left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} L ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
    right: `M ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} L ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
  }),
  peek: () => ({
    left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} L ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 2}`,
    right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 2} L ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y - 2}`,
  }),
  thinking: () => ({
    left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 2} Q ${EYE_L_X} ${EYEBROW_Y - 5} ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y}`,
    right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y - 5} Q ${EYE_R_X} ${EYEBROW_Y - 10} ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y - 5}`,
  }),
  sleep: () => ({
    left: `M ${EYE_L_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 5} L ${EYE_L_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
    right: `M ${EYE_R_X - EYEBROW_OFFSET_X} ${EYEBROW_Y + 5} L ${EYE_R_X + EYEBROW_OFFSET_X} ${EYEBROW_Y + 5}`,
  }),
};

// 眼睛工廠
const eyes = {
  circle: (blink = true): { left: EyeData; right: EyeData } => ({
    left: {
      type: 'group', className: blink ? 'animate-blink' : undefined, children: [
        { type: 'circle', cx: EYE_L_X, cy: EYE_Y, r: EYE_RADIUS, strokeWidth: 3, fill: 'none' },
      ]
    },
    right: {
      type: 'group', className: blink ? 'animate-blink' : undefined, children: [
        { type: 'circle', cx: EYE_R_X, cy: EYE_Y, r: EYE_RADIUS, strokeWidth: 3, fill: 'none' },
      ]
    },
  }),
  happy: (): { left: EyeData; right: EyeData } => ({
    left: { type: 'path', d: `M ${EYE_L_X - 5} ${EYE_Y} Q ${EYE_L_X} ${EYE_Y - 5} ${EYE_L_X + 5} ${EYE_Y}`, strokeWidth: 3 },
    right: { type: 'path', d: `M ${EYE_R_X - 5} ${EYE_Y} Q ${EYE_R_X} ${EYE_Y - 5} ${EYE_R_X + 5} ${EYE_Y}`, strokeWidth: 3 },
  }),
  excited: (): { left: EyeData; right: EyeData } => ({
    left: { type: 'path', d: `M ${EYE_L_X - 7} ${EYE_Y - 7} Q ${EYE_L_X} ${EYE_Y - 15} ${EYE_L_X + 7} ${EYE_Y - 7}`, strokeWidth: 4 },
    right: { type: 'path', d: `M ${EYE_R_X - 7} ${EYE_Y - 7} Q ${EYE_R_X} ${EYE_Y - 15} ${EYE_R_X + 7} ${EYE_Y - 7}`, strokeWidth: 4 },
  }),
  dot: (): { left: EyeData; right: EyeData } => ({
    left: { type: 'circle', cx: EYE_L_X, cy: EYE_Y, r: 3, fill: 'currentColor' },
    right: { type: 'circle', cx: EYE_R_X, cy: EYE_Y, r: 3, fill: 'currentColor' },
  }),
  withPupil: (offsetX = 0, offsetY = 0): { left: EyeData; right: EyeData } => ({
    left: {
      type: 'group', children: [
        { type: 'circle', cx: EYE_L_X + offsetX, cy: EYE_Y + offsetY, r: 4, strokeWidth: 3, fill: 'none' },
        { type: 'circle', cx: EYE_L_X + offsetX + 1, cy: EYE_Y + offsetY, r: 1.5, fill: 'currentColor' },
      ]
    },
    right: {
      type: 'group', children: [
        { type: 'circle', cx: EYE_R_X + offsetX, cy: EYE_Y + offsetY, r: 4, strokeWidth: 3, fill: 'none' },
        { type: 'circle', cx: EYE_R_X + offsetX + 1, cy: EYE_Y + offsetY, r: 1.5, fill: 'currentColor' },
      ]
    },
  }),
  closed: (): { left: EyeData; right: EyeData } => ({
    left: { type: 'path', d: `M ${EYE_L_X - 7} ${EYE_Y} L ${EYE_L_X + 7} ${EYE_Y}`, strokeWidth: 3 },
    right: { type: 'path', d: `M ${EYE_R_X - 7} ${EYE_Y} L ${EYE_R_X + 7} ${EYE_Y}`, strokeWidth: 3 },
  }),
};

// 嘴巴工廠
const mouth = {
  smile: () => `M ${CENTER_X - MOUTH_WIDTH_SM} ${MOUTH_Y - MOUTH_CURVE_Y} Q ${CENTER_X} ${MOUTH_Y + MOUTH_CURVE_Y} ${CENTER_X + MOUTH_WIDTH_SM} ${MOUTH_Y - MOUTH_CURVE_Y}`,
  happy: () => `M ${CENTER_X - MOUTH_WIDTH_MD} ${MOUTH_Y - 5} Q ${CENTER_X} ${MOUTH_Y + 10} ${CENTER_X + MOUTH_WIDTH_MD} ${MOUTH_Y - 5}`,
  excited: () => `M ${CENTER_X - MOUTH_WIDTH_LG} ${MOUTH_Y - 10} Q ${CENTER_X} ${MOUTH_Y + 15} ${CENTER_X + MOUTH_WIDTH_LG} ${MOUTH_Y - 10}`,
  small: () => `M ${CENTER_X - 8} ${MOUTH_Y} Q ${CENTER_X} ${MOUTH_Y + 5} ${CENTER_X + 8} ${MOUTH_Y}`,
  line: () => `M ${CENTER_X - 5} ${MOUTH_Y} L ${CENTER_X + 5} ${MOUTH_Y}`,
  wavy: () => `M ${CENTER_X - 12} ${MOUTH_Y} Q ${CENTER_X - 6} ${MOUTH_Y - 5} ${CENTER_X} ${MOUTH_Y} Q ${CENTER_X + 6} ${MOUTH_Y + 5} ${CENTER_X + 12} ${MOUTH_Y}`,
  sleep: () => `M ${CENTER_X} ${MOUTH_Y} m -5, 0 a 5,3 0 1,0 10,0 a 5,3 0 1,0 -10,0`,
};

// 手臂工廠
const arm = (offset: readonly [number, number] | readonly number[], dir: 'up' | 'down' = 'down'): string => {
  const [x, y] = offset as [number, number];
  const endY = dir === 'up' ? SHOULDER_Y - y : SHOULDER_Y + y;
  return `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - x} ${endY}`;
};

const armShy = (): string => {
  const [[x1, y1], [x2, y2]] = ARM.shy;
  return `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - x1} ${SHOULDER_Y - y1} L ${SHOULDER_L_X - x2} ${SHOULDER_Y + y2}`;
};

// ============ 心情配置表 (SSOT) ============

const BASE_CONFIG: MoodConfig = {
  eyebrows: brow.neutral(),
  eyes: eyes.circle(true),
  mouth: mouth.smile(),
  arms: { left: arm(ARM.rest) },
};

export const MOOD_CONFIGS: Record<MaiMaiMood | 'default', MoodConfig> = {
  default: BASE_CONFIG,
  idle: BASE_CONFIG,

  happy: {
    eyebrows: brow.raised(),
    eyes: eyes.happy(),
    mouth: mouth.happy(),
    arms: { left: arm(ARM.happy, 'up') },
  },

  wave: {
    eyebrows: brow.neutral(),
    eyes: eyes.happy(),
    mouth: mouth.happy(),
    arms: {
      left: arm(ARM.wave, 'up'),
      right: `M ${SHOULDER_R_X} ${SHOULDER_Y} L ${SHOULDER_R_X + 30} ${SHOULDER_Y - 32}`,
      extraType: 'wave',
    },
  },

  celebrate: {
    eyebrows: brow.raised(),
    eyes: eyes.excited(),
    mouth: mouth.excited(),
    arms: { left: arm(ARM.celebrate, 'up') },
  },

  excited: {
    eyebrows: brow.raised(),
    eyes: eyes.excited(),
    mouth: mouth.excited(),
    arms: { left: arm(ARM.celebrate, 'up') },
  },

  peek: {
    eyebrows: brow.peek(),
    eyes: eyes.dot(),
    mouth: mouth.small(),
    arms: {
      left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X + 17} ${SHOULDER_Y - 12}`,
      extraType: 'peek',
    },
    antenna: { droopy: true },
  },

  thinking: {
    eyebrows: brow.thinking(),
    eyes: eyes.withPupil(2, -2),
    mouth: mouth.line(),
    arms: {
      left: arm(ARM.think),
      right: `M ${SHOULDER_R_X} ${SHOULDER_Y} L ${SHOULDER_R_X - 13} ${SHOULDER_Y + 20} L ${CENTER_X + 8} ${SHOULDER_Y + 20}`,
    },
  },

  shy: {
    eyebrows: brow.worried(),
    eyes: eyes.withPupil(0, 1),
    mouth: mouth.wavy(),
    arms: { left: armShy() },
    antenna: { droopy: true },
  },

  confused: {
    eyebrows: brow.worried(),
    eyes: eyes.withPupil(0, 1),
    mouth: mouth.wavy(),
    arms: { left: arm(ARM.confused) },
  },

  sleep: {
    eyebrows: brow.sleep(),
    eyes: eyes.closed(),
    mouth: mouth.sleep(),
    arms: { left: arm(ARM.sleep) },
    antenna: { droopy: true },
  },
};
