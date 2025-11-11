// src/lib/detection-labels.ts
// 蛋糕/窗簾專用 20 個精簡標籤 ontology

export const CAKE_LABELS = [
  // 結構
  'cake', 'cake layer', 'cake tier', 'wedding cake',
  // 表面
  'frosting', 'frosting texture', 'icing', 'cream',
  // 裝飾
  'cake decoration', 'cake topper', 'fondant', 'piping'
];

export const CURTAIN_LABELS = [
  // 結構
  'curtain', 'drape', 'window curtain', 'sheer curtain',
  // 紋理
  'fabric fold', 'curtain pleat', 'fabric texture', 'drapery'
];

export const GENERAL_LABELS = [
  'object', 'item', 'detail', 'shape'
];

export const MODE_CONFIGS = {
  cake: {
    labels: CAKE_LABELS,
    params: {
      score_threshold: 0.08,
      nms_threshold: 0.4,
      box_threshold: 0.15,
      iou_threshold: 0.4
    },
    color: '#ff69b4', // 粉紅
    tag: '🎂',
    name: 'CAKE DETAIL'
  },
  curtain: {
    labels: CURTAIN_LABELS,
    params: {
      score_threshold: 0.06,
      nms_threshold: 0.5,
      box_threshold: 0.12,
      iou_threshold: 0.5
    },
    color: '#9370db', // 紫
    tag: '🪟',
    name: 'FABRIC DETAIL'
  },
  general: {
    labels: GENERAL_LABELS,
    params: {
      score_threshold: 0.07,
      nms_threshold: 0.45,
      box_threshold: 0.15,
      iou_threshold: 0.45
    },
    color: '#4ade80', // 綠
    tag: '📦',
    name: 'OBJECT'
  }
} as const;

export type DetectionMode = keyof typeof MODE_CONFIGS;
