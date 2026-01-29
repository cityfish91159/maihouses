/**
 * MaiMai 公仔 SVG 座標常量 (SSOT)
 * @description 所有硬編碼座標的唯一真理來源
 */

// ============ 畫布尺寸 ============

export const CANVAS_SIZE = 200;
export const CANVAS_HEIGHT = 240;
export const CENTER_X = 100;

// ============ 身體 ============

export const BODY_X = 55;
export const BODY_Y = 80;
export const BODY_WIDTH = 90;
export const BODY_HEIGHT = 100;

// ============ 肩膀 ============

export const SHOULDER_L_X = BODY_X; // 55
export const SHOULDER_R_X = BODY_X + BODY_WIDTH; // 145
export const SHOULDER_Y = BODY_Y + 50; // 130

// ============ 眼睛 ============

export const EYE_L_X = CENTER_X - 15; // 85
export const EYE_R_X = CENTER_X + 15; // 115
export const EYE_Y = 125;
export const EYE_RADIUS = 4;
export const EYE_PUPIL_RADIUS = 1.5;
export const EYE_SMILE_OFFSET = 5;

// ============ 眉毛 ============

export const EYEBROW_Y = 110;
export const EYEBROW_WIDTH = 14;
export const EYEBROW_OFFSET_X = EYEBROW_WIDTH / 2; // 7
export const EYEBROW_RAISE_Y = 5;

// ============ 嘴巴 ============

export const MOUTH_Y = 150;
export const MOUTH_WIDTH_SM = 10;
export const MOUTH_WIDTH_MD = 15;
export const MOUTH_WIDTH_LG = 20;
export const MOUTH_CURVE_Y = 5;

// ============ 腮紅 ============

export const BLUSH_Y = 140;
export const BLUSH_OFFSET_X = 15;
export const BLUSH_RADIUS = 8;

// ============ 髖部與腿 ============

export const HIP_L_X = EYE_L_X; // 85
export const HIP_R_X = EYE_R_X; // 115
export const HIP_Y = BODY_Y + BODY_HEIGHT; // 180
export const LEG_Y = HIP_Y + 35; // 215
export const LEG_FOOT_OFFSET = 10;
export const LEG_HIP_OFFSET = 5;
export const LEG_BEND_X = 10;
export const LEG_BEND_Y = 5;
export const JUMP_OFFSET = 20;

// ============ 天線 ============

export const ANTENNA_Y = 40;
export const ANTENNA_TOP_Y = 15;
export const ANTENNA_PEAK_Y = 30;
export const ANTENNA_DROOP_OFFSET = 5;
export const ANTENNA_DROOP_PEAK_OFFSET = 2;
export const ANTENNA_DROOP_Y = 5;

// ============ 屋頂 ============

export const ROOF_OVERHANG = 15;
export const ROOF_PEAK_Y = ANTENNA_Y; // 40

// ============ 揮手特效 ============

export const WAVE_OFFSET_X = 29;
export const WAVE_OFFSET_Y = 40;
export const WAVE_RADIUS = 8;
export const WAVE_R_OFFSET_X = 35;

// ============ 偷看遮罩 ============

export const PEEK_BAR_WIDTH = 72;
export const PEEK_BAR_HEIGHT = 12;
export const PEEK_BAR_OFFSET_Y = 9;
export const PEEK_BAR_GAP = 24;

// ============ 手臂位移常量 (SSOT) ============

/** 手臂姿勢座標偏移 (基於 SHOULDER_L_X/R_X, SHOULDER_Y) */
export const ARM = {
  rest: [23, 8],
  happy: [27, 28],
  wave: [17, 18],
  celebrate: [40, 48],
  think: [20, 10],
  header: [20, 30], // Header 專用：向上揮手，與原版 SVG 完全一致
  shy: [
    [13, 12],
    [19, -2],
  ] as [[number, number], [number, number]],
  confused: [15, -6],
  sleep: [17, -22],
} as const;

/** Wave 姿勢右手額外偏移 */
export const ARM_WAVE_R_OFFSET_X = 30;
export const ARM_WAVE_R_OFFSET_Y = 32;

/** Peek 姿勢左手額外偏移 */
export const ARM_PEEK_L_OFFSET_X = 17;
export const ARM_PEEK_L_OFFSET_Y = 12;

/** Thinking 姿勢右手關節座標 */
export const ARM_THINK_R_OFFSET_X = 13;
export const ARM_THINK_R_ELBOW_Y = 20;
export const ARM_THINK_R_HAND_OFFSET = 8;

// ============ 特效顏色 ============

export const EFFECT_COLOR_GOLD = '#FFD700';
export const EFFECT_COLOR_CONFETTI_RED = '#FF6B6B';
export const EFFECT_COLOR_CONFETTI_TEAL = '#4ECDC4';
export const EFFECT_COLOR_CONFETTI_YELLOW = '#FFE66D';
export const EFFECT_COLOR_SHY_BLUE = '#87CEEB';
export const STAR_INNER_RATIO = 0.4;
export const SPARKLE_DIAGONAL_RATIO = 0.6;

/** 五角星單位圓頂點 (10 個點,外5內5交錯) */
export const STAR_UNIT_VERTICES = Array.from({ length: 10 }, (_, i) => {
  const isOuter = i % 2 === 0;
  const angle = ((i * 36 - 90) * Math.PI) / 180;
  const radius = isOuter ? 1 : STAR_INNER_RATIO;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
});

/** Confetti 矩形比例係數 (基於 size/2) */
export const CONFETTI_RECT_1_WIDTH_RATIO = 0.3;
export const CONFETTI_RECT_1_HEIGHT_RATIO = 1.2;
export const CONFETTI_RECT_2_X_OFFSET_RATIO = 0.8;
export const CONFETTI_RECT_2_WIDTH_RATIO = 0.5;
export const CONFETTI_RECT_2_HEIGHT_RATIO = 0.8;
export const CONFETTI_RECT_3_X_OFFSET_RATIO = 0.3;
export const CONFETTI_RECT_3_Y_OFFSET_RATIO = 0.3;
export const CONFETTI_RECT_3_WIDTH_RATIO = 0.4;
export const CONFETTI_RECT_3_HEIGHT_RATIO = 1.0;

// ============ 尺寸配置 ============

/** 尺寸 CSS 類別對照表 */
export const SIZE_CLASSES: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'w-12 h-12',
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
  xl: 'w-56 h-56',
};

// ============ 工具函式 ============

/** 鏡像 SVG 路徑 (x -> 200-x) */
export const mirrorPath = (path: string) =>
  path.replace(/(\d+)\s+(\d+)/g, (_, x, y) => `${CANVAS_SIZE - parseInt(x)} ${y}`);
