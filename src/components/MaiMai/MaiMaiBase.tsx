import React from 'react';
import { 
  SIZE_CLASSES, 
  CANVAS_SIZE,
  CENTER_X,
  BODY_X,
  BODY_Y,
  BODY_WIDTH,
  BODY_HEIGHT,
  SHOULDER_L_X,
  SHOULDER_R_X,
  SHOULDER_Y,
  EYE_L_X,
  EYE_R_X,
  EYE_Y,
  EYEBROW_Y,
  MOUTH_Y,
  BLUSH_Y,
  HIP_L_X,
  HIP_R_X,
  HIP_Y,
  LEG_Y,
  LEG_FOOT_OFFSET,
  JUMP_OFFSET,
  LEG_HIP_OFFSET,
  LEG_BEND_X,
  LEG_BEND_Y,  ANTENNA_Y,
  ANTENNA_TOP_Y,
  ANTENNA_PEAK_Y,
  ANTENNA_DROOP_OFFSET,
  ANTENNA_DROOP_PEAK_OFFSET,
  ROOF_OVERHANG,
  ROOF_PEAK_Y,
  WAVE_OFFSET_X,
  WAVE_OFFSET_Y,
  WAVE_RADIUS,
  WAVE_R_OFFSET_X,
  PEEK_BAR_WIDTH,
  PEEK_BAR_HEIGHT,
  PEEK_BAR_OFFSET_Y,
  PEEK_BAR_GAP,
  BLUSH_OFFSET_X,
  BLUSH_RADIUS,
  EFFECT_POSITIONS,
  EFFECT_COLOR_GOLD,
  EFFECT_COLOR_CONFETTI_RED,
  EFFECT_COLOR_CONFETTI_TEAL,
  EFFECT_COLOR_CONFETTI_YELLOW,
  EFFECT_COLOR_SHY_BLUE,
  STAR_INNER_RATIO,
  SPARKLE_DIAGONAL_RATIO,
  mirrorPath,
  ARM_POSES,
  MOOD_CONFIGS,
  EyeData
} from './types';
import type { MaiMaiMood, MaiMaiBaseProps } from './types';

/**
 * MaiMai 公仔 SVG 骨架組件
 * @description 統一的 SVG 真理來源，支援所有心情狀態
 */

// ============ 樣式常量 ============
/** opacity 過渡動畫 (path d 無法 transition，只用 opacity) */
const T_OPACITY = 'transition-opacity duration-300';

// ============ SVG 部件 ============

/** M 型天線 */
export function Antenna({ animated = false, mood = 'idle' }: { animated?: boolean; mood?: MaiMaiMood }) {
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.default;
  const droopy = config.antenna?.droopy;
  const wiggle = mood === 'wave' || mood === 'celebrate' || mood === 'excited';
  
  // 基於眼睛座標與常量計算
  const aY = droopy ? ANTENNA_Y + ANTENNA_DROOP_OFFSET : ANTENNA_Y;
  const aTopY = droopy ? ANTENNA_TOP_Y + ANTENNA_DROOP_OFFSET : ANTENNA_TOP_Y;
  const aPeakY = droopy ? ANTENNA_PEAK_Y + ANTENNA_DROOP_PEAK_OFFSET : ANTENNA_PEAK_Y;

  const d = `M ${EYE_L_X} ${aY} L ${EYE_L_X} ${aTopY} L ${CENTER_X} ${aPeakY} L ${EYE_R_X} ${aTopY} L ${EYE_R_X} ${aY}`;

  return (
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${T_OPACITY} ${wiggle ? 'animate-wiggle origin-bottom' : ''} ${droopy ? 'opacity-70' : ''}`}
    />
  );
}

/** 屋頂 */
export function Roof() {
  return (
    <path
      d={`M ${BODY_X - ROOF_OVERHANG} ${BODY_Y} L ${CENTER_X} ${ROOF_PEAK_Y} L ${BODY_X + BODY_WIDTH + ROOF_OVERHANG} ${BODY_Y}`}
      stroke="currentColor"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** 房子身體 */
export function Body() {
  return (
    <rect
      x={BODY_X} y={BODY_Y}
      width={BODY_WIDTH} height={BODY_HEIGHT}
      stroke="currentColor"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** 眉毛 */
export function Eyebrows({ mood = 'idle' }: { mood?: MaiMaiMood }) {
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.default;
  return (
    <>
      <path d={config.eyebrows.left} stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" className={T_OPACITY} />
      <path d={config.eyebrows.right} stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" className={T_OPACITY} />
    </>
  );
}

/** 渲染單個眼睛數據 */
function RenderEye({ data }: { data: EyeData }) {
  if (data.type === 'circle') {
    return (
      <circle
        cx={data.cx}
        cy={data.cy}
        r={data.r}
        fill={data.fill || 'none'}
        stroke={data.fill === 'currentColor' ? 'none' : 'currentColor'}
        strokeWidth={data.strokeWidth}
        className={`${T_OPACITY} ${data.className || ''}`}
      />
    );
  }
  if (data.type === 'path') {
    return (
      <path
        d={data.d}
        stroke="currentColor"
        strokeWidth={data.strokeWidth || 3}
        fill="none"
        strokeLinecap="round"
        className={`${T_OPACITY} ${data.className || ''}`}
      />
    );
  }
  if (data.type === 'group') {
    return (
      <g className={data.className}>
        {data.children?.map((child, i) => <RenderEye key={i} data={child} />)}
      </g>
    );
  }
  return null;
}

/** 眼睛 */
export function Eyes({ mood = 'idle' }: { mood?: MaiMaiMood }) {
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.default;
  return (
    <>
      <RenderEye data={config.eyes.left} />
      <RenderEye data={config.eyes.right} />
    </>
  );
}

/** 嘴巴 */
export function Mouth({ mood = 'idle' }: { mood?: MaiMaiMood }) {
  const config = MOOD_CONFIGS[mood] || MOOD_CONFIGS.default;
  return (
    <path
      d={config.mouth}
      stroke="currentColor"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      className={T_OPACITY}
    />
  );
}

/** 手臂額外裝飾 (揮手、遮眼) */
function ArmExtra({ type }: { type?: 'wave' | 'peek' | undefined }) {
  if (!type) return null;

  if (type === 'wave') {
    const createWave = (x: number, y: number, origin: string) => (
      <g className={`animate-wave ${origin}`}>
        <circle cx={x} cy={y} r={WAVE_RADIUS} stroke="currentColor" strokeWidth="4" fill="none" />
      </g>
    );
    const waveLX = SHOULDER_L_X - WAVE_OFFSET_X;
    const waveRX = SHOULDER_R_X + WAVE_R_OFFSET_X;
    const waveY = SHOULDER_Y - WAVE_OFFSET_Y;
    
    return (
      <>
        {createWave(waveLX, waveY, 'origin-bottom-right')}
        {createWave(waveRX, waveY, 'origin-bottom-left')}
      </>
    );
  }

  if (type === 'peek') {
    const barX = CENTER_X - PEEK_BAR_WIDTH / 2;
    const barY = EYE_Y - PEEK_BAR_OFFSET_Y;
    const peekBarXs = [CENTER_X - PEEK_BAR_GAP, CENTER_X, CENTER_X + PEEK_BAR_GAP];
    
    return (
      <>
        <rect x={barX} y={barY} width={PEEK_BAR_WIDTH} height={PEEK_BAR_HEIGHT} rx="6" fill="white" stroke="currentColor" strokeWidth="3" />
        {peekBarXs.map((x) => (
          <path key={x} d={`M ${x} ${barY} L ${x} ${barY + PEEK_BAR_HEIGHT}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ))}
      </>
    );
  }

  return null;
}

/** 手臂 */
export function Arms({ mood }: { mood: MaiMaiMood }) {
  const arms = ARM_POSES[mood] ?? ARM_POSES.default;
  const leftPath = arms.left;
  const rightPath = arms.right ?? mirrorPath(leftPath);

  return (
    <>
      <path
        d={leftPath}
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={T_OPACITY}
      />
      <path
        d={rightPath}
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={T_OPACITY}
      />
      <ArmExtra type={arms.extraType} />
    </>
  );
}

/** 腿 */
export function Legs({ mood, animated = false }: { mood: MaiMaiMood; animated?: boolean }) {
  const jumping = mood === 'celebrate' || mood === 'excited';
  
  if (jumping) {
    const jumpY = HIP_Y + JUMP_OFFSET;
    return (
      <>
        <path d={`M ${HIP_L_X} ${HIP_Y - LEG_HIP_OFFSET} L ${HIP_L_X - LEG_BEND_X} ${jumpY} L ${HIP_L_X - LEG_BEND_X * 2} ${jumpY + LEG_BEND_Y}`} stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" className={T_OPACITY} />
        <path d={`M ${HIP_R_X} ${HIP_Y - LEG_HIP_OFFSET} L ${HIP_R_X + LEG_BEND_X} ${jumpY} L ${HIP_R_X + LEG_BEND_X * 2} ${jumpY + LEG_BEND_Y}`} stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" className={T_OPACITY} />
      </>
    );
  }

  return (
    <>
      <path d={`M ${HIP_L_X} ${HIP_Y} L ${HIP_L_X} ${LEG_Y} L ${HIP_L_X - LEG_FOOT_OFFSET} ${LEG_Y}`} stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" className={T_OPACITY} />
      <path d={`M ${HIP_R_X} ${HIP_Y} L ${HIP_R_X} ${LEG_Y} L ${HIP_R_X + LEG_FOOT_OFFSET} ${LEG_Y}`} stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" className={T_OPACITY} />
    </>
  );
}

/** 特效 - 腮紅 */
export function Blush({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <>
      <circle cx={EYE_L_X - BLUSH_OFFSET_X} cy={BLUSH_Y} r={BLUSH_RADIUS} fill="#FFB6C1" opacity="0.6" className={T_OPACITY} />
      <circle cx={EYE_R_X + BLUSH_OFFSET_X} cy={BLUSH_Y} r={BLUSH_RADIUS} fill="#FFB6C1" opacity="0.6" className={T_OPACITY} />
    </>
  );
}

// ============ 特效 SVG 組件 (v2.4 最高標準) ============

interface EffectShapeProps {
  cx: number;
  cy: number;
  size: number;
  opacity?: number | undefined;
  className?: string | undefined;
}

/**
 * 五角星 SVG 組件
 * @description 使用 polygon 繪製，預計算頂點座標
 */
const EffectStar = React.memo(function EffectStar({ cx, cy, size, opacity, className }: EffectShapeProps) {
  const r = size / 2;
  // 預計算五角星 10 個頂點 (外5 + 內5 交錯)
  const points = React.useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const isOuter = i % 2 === 0;
      const angle = (i * 36 - 90) * Math.PI / 180;
      const radius = isOuter ? r : r * STAR_INNER_RATIO;
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
    }).join(' ');
  }, [cx, cy, r]);

  return <polygon points={points} fill={EFFECT_COLOR_GOLD} opacity={opacity} className={className} />;
});

/**
 * 四角閃光 SVG 組件
 * @description 使用十字 + 對角線繪製
 */
const EffectSparkle = React.memo(function EffectSparkle({ cx, cy, size, opacity, className }: EffectShapeProps) {
  const r = size / 2;
  const d = r * SPARKLE_DIAGONAL_RATIO;

  return (
    <g opacity={opacity} className={className}>
      {/* 主十字 */}
      <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={EFFECT_COLOR_GOLD} strokeWidth="2" strokeLinecap="round" />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={EFFECT_COLOR_GOLD} strokeWidth="2" strokeLinecap="round" />
      {/* 對角線 */}
      <line x1={cx - d} y1={cy - d} x2={cx + d} y2={cy + d} stroke={EFFECT_COLOR_GOLD} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={cx + d} y1={cy - d} x2={cx - d} y2={cy + d} stroke={EFFECT_COLOR_GOLD} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  );
});

/**
 * 彩帶紙花 SVG 組件
 * @description 使用三個旋轉的矩形繪製
 */
const EffectConfetti = React.memo(function EffectConfetti({ cx, cy, size, opacity, className }: EffectShapeProps) {
  const r = size / 2;

  return (
    <g opacity={opacity} className={className}>
      <rect x={cx - r * 0.3} y={cy - r} width={r * 0.6} height={r * 1.2} fill={EFFECT_COLOR_CONFETTI_RED} rx="1" transform={`rotate(15 ${cx} ${cy})`} />
      <rect x={cx - r * 0.8} y={cy - r * 0.5} width={r * 0.5} height={r * 0.8} fill={EFFECT_COLOR_CONFETTI_TEAL} rx="1" transform={`rotate(-20 ${cx} ${cy})`} />
      <rect x={cx + r * 0.3} y={cy - r * 0.3} width={r * 0.4} height={r} fill={EFFECT_COLOR_CONFETTI_YELLOW} rx="1" transform={`rotate(30 ${cx} ${cy})`} />
    </g>
  );
});

/** 特效 - 愛心/星星 */
export function Effects({ mood }: { mood: MaiMaiMood }) {
  const items = EFFECT_POSITIONS[mood] || EFFECT_POSITIONS.default;

  if (!items.length) return null;

  return (
    <>
      {items.map((p, i) => {
        const cx = CENTER_X + p.x;
        const cy = p.y;
        const key = `${mood}-${p.kind}-${i}`;

        switch (p.kind) {
          case 'star':
            return <EffectStar key={key} cx={cx} cy={cy} size={p.size} opacity={p.opacity} className={p.className} />;
          case 'sparkle':
            return <EffectSparkle key={key} cx={cx} cy={cy} size={p.size} opacity={p.opacity} className={p.className} />;
          case 'confetti':
            return <EffectConfetti key={key} cx={cx} cy={cy} size={p.size} opacity={p.opacity} className={p.className} />;
          case 'text':
            return (
              <text
                key={key}
                x={cx}
                y={cy}
                fontSize={p.size}
                className={p.className}
                fontWeight={p.icon === 'Hi!' ? 'bold' : undefined}
                fill="currentColor"
                opacity={p.opacity}
                textAnchor={p.icon === 'Hi!' ? 'middle' : undefined}
              >
                {p.icon}
              </text>
            );
          case 'circle':
            return (
              <circle
                key={key}
                cx={cx}
                cy={cy}
                r={p.r}
                fill="currentColor"
                opacity={p.opacity}
                className={p.className}
              />
            );
          case 'ellipse':
            return (
              <ellipse
                key={key}
                cx={cx}
                cy={cy}
                rx={p.rx}
                ry={p.ry}
                fill={mood === 'shy' ? EFFECT_COLOR_SHY_BLUE : 'white'}
                stroke={mood === 'wave' ? 'currentColor' : 'none'}
                strokeWidth={mood === 'wave' ? 2 : undefined}
                className={mood === 'shy' ? 'animate-drip' : mood === 'wave' ? 'animate-bounce' : p.className}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

// ============ 主組件 ============

export function MaiMaiBase({
  mood = 'idle',
  size = 'md',
  className = '',
  animated = true,
  onClick,
  showEffects = true,
}: MaiMaiBaseProps) {
  // 根據心情決定動畫
  const getAnimationClass = () => {
    switch (mood) {
      case 'celebrate':
      case 'excited':
        return 'animate-jump';
      case 'happy':
        return 'animate-bounce-slow';
      case 'shy':
        return 'animate-shake';
      case 'idle':
        return animated ? 'animate-float' : '';
      default:
        return '';
    }
  };

  const showBlush = mood === 'shy' || mood === 'peek';

  return (
    <div
      className={`relative ${SIZE_CLASSES[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* 背景光暈 */}
      <div className="absolute left-1/2 top-1/2 -z-10 size-3/4 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-[var(--brand)]/10 blur-2xl" />

      <svg
        viewBox="0 0 200 240"
        className={`size-full text-[var(--brand)] drop-shadow-sm transition-transform duration-300 ${getAnimationClass()}`}
      >
        {/* 特效 */}
        {showEffects && <Effects mood={mood} />}

        {/* 天線 */}
        <Antenna mood={mood} animated={animated} />

        {/* 屋頂 */}
        <Roof />

        {/* 身體 */}
        <Body />

        {/* 眉毛 */}
        <Eyebrows mood={mood} />

        {/* 眼睛 */}
        <Eyes mood={mood} />

        {/* 腮紅 */}
        <Blush show={showBlush} />

        {/* 嘴巴 */}
        <Mouth mood={mood} />

        {/* 手臂 */}
        <Arms mood={mood} />

        {/* 腿 */}
        <Legs mood={mood} animated={animated} />
      </svg>
    </div>
  );
}

export default MaiMaiBase;
