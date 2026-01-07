/**
 * MaiMai 公仔心情配置 (SSOT)
 * @description 所有心情狀態的視覺配置與特效定義
 */

import {
  CANVAS_SIZE,
  CENTER_X,
  SHOULDER_L_X,
  SHOULDER_R_X,
  SHOULDER_Y,
  EYE_L_X,
  EYE_R_X,
  EYE_Y,
  EYE_RADIUS,
  EYEBROW_Y,
  EYEBROW_OFFSET_X,
  EYEBROW_RAISE_Y,
  MOUTH_Y,
  MOUTH_WIDTH_SM,
  MOUTH_WIDTH_MD,
  MOUTH_WIDTH_LG,
  MOUTH_CURVE_Y,
  ARM,
  ARM_WAVE_R_OFFSET_X,
  ARM_WAVE_R_OFFSET_Y,
  ARM_PEEK_L_OFFSET_X,
  ARM_PEEK_L_OFFSET_Y,
  ARM_THINK_R_OFFSET_X,
  ARM_THINK_R_ELBOW_Y,
  ARM_THINK_R_HAND_OFFSET,
} from "./constants";

import type { MaiMaiMood, MoodConfig, EyeData, EffectItem } from "./types";

// ============ 工廠函數 ============

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
      type: "group",
      className: blink ? "animate-blink" : undefined,
      children: [
        {
          type: "circle",
          cx: EYE_L_X,
          cy: EYE_Y,
          r: EYE_RADIUS,
          strokeWidth: 3,
          fill: "none",
        },
      ],
    },
    right: {
      type: "group",
      className: blink ? "animate-blink" : undefined,
      children: [
        {
          type: "circle",
          cx: EYE_R_X,
          cy: EYE_Y,
          r: EYE_RADIUS,
          strokeWidth: 3,
          fill: "none",
        },
      ],
    },
  }),
  happy: (): { left: EyeData; right: EyeData } => ({
    left: {
      type: "path",
      d: `M ${EYE_L_X - 5} ${EYE_Y} Q ${EYE_L_X} ${EYE_Y - 5} ${EYE_L_X + 5} ${EYE_Y}`,
      strokeWidth: 3,
    },
    right: {
      type: "path",
      d: `M ${EYE_R_X - 5} ${EYE_Y} Q ${EYE_R_X} ${EYE_Y - 5} ${EYE_R_X + 5} ${EYE_Y}`,
      strokeWidth: 3,
    },
  }),
  excited: (): { left: EyeData; right: EyeData } => ({
    left: {
      type: "path",
      d: `M ${EYE_L_X - 7} ${EYE_Y - 7} Q ${EYE_L_X} ${EYE_Y - 15} ${EYE_L_X + 7} ${EYE_Y - 7}`,
      strokeWidth: 4,
    },
    right: {
      type: "path",
      d: `M ${EYE_R_X - 7} ${EYE_Y - 7} Q ${EYE_R_X} ${EYE_Y - 15} ${EYE_R_X + 7} ${EYE_Y - 7}`,
      strokeWidth: 4,
    },
  }),
  dot: (): { left: EyeData; right: EyeData } => ({
    left: {
      type: "circle",
      cx: EYE_L_X,
      cy: EYE_Y,
      r: 3,
      fill: "currentColor",
    },
    right: {
      type: "circle",
      cx: EYE_R_X,
      cy: EYE_Y,
      r: 3,
      fill: "currentColor",
    },
  }),
  withPupil: (offsetX = 0, offsetY = 0): { left: EyeData; right: EyeData } => ({
    left: {
      type: "group",
      children: [
        {
          type: "circle",
          cx: EYE_L_X + offsetX,
          cy: EYE_Y + offsetY,
          r: 4,
          strokeWidth: 3,
          fill: "none",
        },
        {
          type: "circle",
          cx: EYE_L_X + offsetX + 1,
          cy: EYE_Y + offsetY,
          r: 1.5,
          fill: "currentColor",
        },
      ],
    },
    right: {
      type: "group",
      children: [
        {
          type: "circle",
          cx: EYE_R_X + offsetX,
          cy: EYE_Y + offsetY,
          r: 4,
          strokeWidth: 3,
          fill: "none",
        },
        {
          type: "circle",
          cx: EYE_R_X + offsetX + 1,
          cy: EYE_Y + offsetY,
          r: 1.5,
          fill: "currentColor",
        },
      ],
    },
  }),
  closed: (): { left: EyeData; right: EyeData } => ({
    left: {
      type: "path",
      d: `M ${EYE_L_X - 7} ${EYE_Y} L ${EYE_L_X + 7} ${EYE_Y}`,
      strokeWidth: 3,
    },
    right: {
      type: "path",
      d: `M ${EYE_R_X - 7} ${EYE_Y} L ${EYE_R_X + 7} ${EYE_Y}`,
      strokeWidth: 3,
    },
  }),
};

// 嘴巴工廠
const mouth = {
  smile: () =>
    `M ${CENTER_X - MOUTH_WIDTH_SM} ${MOUTH_Y - MOUTH_CURVE_Y} Q ${CENTER_X} ${MOUTH_Y + MOUTH_CURVE_Y} ${CENTER_X + MOUTH_WIDTH_SM} ${MOUTH_Y - MOUTH_CURVE_Y}`,
  happy: () =>
    `M ${CENTER_X - MOUTH_WIDTH_MD} ${MOUTH_Y - 5} Q ${CENTER_X} ${MOUTH_Y + 10} ${CENTER_X + MOUTH_WIDTH_MD} ${MOUTH_Y - 5}`,
  excited: () =>
    `M ${CENTER_X - MOUTH_WIDTH_LG} ${MOUTH_Y - 10} Q ${CENTER_X} ${MOUTH_Y + 15} ${CENTER_X + MOUTH_WIDTH_LG} ${MOUTH_Y - 10}`,
  small: () =>
    `M ${CENTER_X - 8} ${MOUTH_Y} Q ${CENTER_X} ${MOUTH_Y + 5} ${CENTER_X + 8} ${MOUTH_Y}`,
  line: () => `M ${CENTER_X - 5} ${MOUTH_Y} L ${CENTER_X + 5} ${MOUTH_Y}`,
  wavy: () =>
    `M ${CENTER_X - 12} ${MOUTH_Y} Q ${CENTER_X - 6} ${MOUTH_Y - 5} ${CENTER_X} ${MOUTH_Y} Q ${CENTER_X + 6} ${MOUTH_Y + 5} ${CENTER_X + 12} ${MOUTH_Y}`,
  sleep: () =>
    `M ${CENTER_X} ${MOUTH_Y} m -5, 0 a 5,3 0 1,0 10,0 a 5,3 0 1,0 -10,0`,
};

// 手臂工廠
const arm = (
  offset: readonly [number, number] | readonly number[],
  dir: "up" | "down" = "down",
): string => {
  const [x, y] = offset as [number, number];
  const endY = dir === "up" ? SHOULDER_Y - y : SHOULDER_Y + y;
  return `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - x} ${endY}`;
};

const armShy = (): string => {
  const [[x1, y1], [x2, y2]] = ARM.shy;
  return `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X - x1} ${SHOULDER_Y - y1} L ${SHOULDER_L_X - x2} ${SHOULDER_Y + y2}`;
};

// ============ 特效定義 ============

const CONFETTI_EFFECTS: EffectItem[] = [
  { kind: "confetti", x: -70, y: 40, size: 14 },
  { kind: "confetti", x: 60, y: 35, size: 12 },
  { kind: "sparkle", x: -80, y: 80, size: 10 },
  { kind: "star", x: 75, y: 75, size: 10 },
];

export const EFFECT_POSITIONS: Record<MaiMaiMood | "default", EffectItem[]> = {
  default: [],
  idle: [],
  peek: [],
  confused: [],
  header: [], // Header 專用：無特效
  celebrate: CONFETTI_EFFECTS,
  excited: CONFETTI_EFFECTS,
  happy: [
    { kind: "sparkle", x: -60, y: 60, size: 14, className: "animate-twinkle" },
    {
      kind: "sparkle",
      x: 55,
      y: 55,
      size: 12,
      className: "animate-twinkle-delay",
    },
  ],
  thinking: [
    { kind: "circle", x: 60, y: 50, r: 5, opacity: 0.3 },
    { kind: "circle", x: 70, y: 35, r: 8, opacity: 0.5 },
    { kind: "circle", x: 85, y: 15, r: 12, opacity: 0.7 },
  ],
  sleep: [
    { kind: "text", x: 50, y: 50, size: 12, icon: "z", opacity: 0.7 },
    { kind: "text", x: 65, y: 35, size: 16, icon: "z", opacity: 0.8 },
    { kind: "text", x: 80, y: 18, size: 20, icon: "Z", opacity: 1.0 },
  ],
  shy: [{ kind: "ellipse", x: 55, y: 70, rx: 5, ry: 8 }],
  wave: [
    { kind: "ellipse", x: 75, y: 60, rx: 20, ry: 15 },
    { kind: "text", x: 75, y: 65, icon: "Hi!", size: 12 },
  ],
};

// ============ 心情配置表 (SSOT) ============

const BASE_CONFIG: MoodConfig = {
  eyebrows: brow.neutral(),
  eyes: eyes.circle(true),
  mouth: mouth.smile(),
  arms: { left: arm(ARM.rest) },
};

export const MOOD_CONFIGS: Record<MaiMaiMood | "default", MoodConfig> = {
  default: BASE_CONFIG,
  idle: BASE_CONFIG,

  happy: {
    eyebrows: brow.raised(),
    eyes: eyes.happy(),
    mouth: mouth.happy(),
    arms: { left: arm(ARM.happy, "up") },
  },

  wave: {
    eyebrows: brow.neutral(),
    eyes: eyes.happy(),
    mouth: mouth.happy(),
    arms: {
      left: arm(ARM.wave, "up"),
      right: `M ${SHOULDER_R_X} ${SHOULDER_Y} L ${SHOULDER_R_X + ARM_WAVE_R_OFFSET_X} ${SHOULDER_Y - ARM_WAVE_R_OFFSET_Y}`,
      extraType: "wave",
    },
  },

  celebrate: {
    eyebrows: brow.raised(),
    eyes: eyes.excited(),
    mouth: mouth.excited(),
    arms: { left: arm(ARM.celebrate, "up") },
  },

  excited: {
    eyebrows: brow.raised(),
    eyes: eyes.excited(),
    mouth: mouth.excited(),
    arms: { left: arm(ARM.celebrate, "up") },
  },

  peek: {
    eyebrows: brow.peek(),
    eyes: eyes.dot(),
    mouth: mouth.small(),
    arms: {
      left: `M ${SHOULDER_L_X} ${SHOULDER_Y} L ${SHOULDER_L_X + ARM_PEEK_L_OFFSET_X} ${SHOULDER_Y - ARM_PEEK_L_OFFSET_Y}`,
      extraType: "peek",
    },
    antenna: { droopy: true },
  },

  thinking: {
    eyebrows: brow.thinking(),
    eyes: eyes.withPupil(2, -2),
    mouth: mouth.line(),
    arms: {
      left: arm(ARM.think),
      right: `M ${SHOULDER_R_X} ${SHOULDER_Y} L ${SHOULDER_R_X - ARM_THINK_R_OFFSET_X} ${SHOULDER_Y + ARM_THINK_R_ELBOW_Y} L ${CENTER_X + ARM_THINK_R_HAND_OFFSET} ${SHOULDER_Y + ARM_THINK_R_ELBOW_Y}`,
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

  // Header 專用：與原版 SVG 完全一致
  // - 無嘴巴、無眨眼動畫、手臂向上揮舞
  header: {
    eyebrows: brow.neutral(),
    eyes: eyes.circle(false), // 禁用眨眼動畫
    mouth: "", // 空字串：無嘴巴
    arms: { left: arm(ARM.header, "up") }, // 手臂向上 [20, 30]
  },
};
