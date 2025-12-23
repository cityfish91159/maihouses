import React from 'react';
import { SIZE_CLASSES } from './types';
import type { MaiMaiMood, MaiMaiBaseProps } from './types';

type ArmPose = { left: string; right: string; extra?: React.ReactNode };

const relaxedPose: ArmPose = {
  left: 'M 55 130 L 32 138',
  right: 'M 145 130 L 168 138',
};

const celebratoryPose: ArmPose = {
  left: 'M 55 130 L 15 82',
  right: 'M 145 130 L 185 82',
};

const createWaveExtra = (x: number, y: number, origin: string) => (
  <g className={`animate-wave ${origin}`}>
    <circle cx={x} cy={y} r="8" stroke="currentColor" strokeWidth="4" fill="none" />
  </g>
);

const peekBarXs = [76, 100, 124];

const ARM_POSES: Record<MaiMaiMood | 'default', ArmPose> = {
  default: relaxedPose,
  idle: relaxedPose,
  happy: {
    left: 'M 55 130 L 28 102',
    right: 'M 145 130 L 172 102',
  },
  celebrate: celebratoryPose,
  excited: celebratoryPose,
  wave: {
    left: 'M 55 130 L 38 112',
    right: 'M 145 130 L 175 98',
    extra: (
      <>
        {createWaveExtra(26, 90, 'origin-bottom-right')}
        {createWaveExtra(180, 90, 'origin-bottom-left')}
      </>
    ),
  },
  thinking: {
    left: 'M 55 130 L 35 140',
    right: 'M 145 130 L 132 150 L 108 150', // 托下巴
  },
  peek: {
    left: 'M 55 130 L 72 118',
    right: 'M 145 130 L 128 118',
    extra: (
      <>
        <rect x="64" y="116" width="72" height="12" rx="6" fill="white" stroke="currentColor" strokeWidth="3" />
        {peekBarXs.map((x) => (
          <path key={x} d={`M ${x} 116 L ${x} 128`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ))}
      </>
    ),
  },
  shy: {
    left: 'M 55 130 L 42 118 L 36 132',
    right: 'M 145 130 L 158 118 L 164 132',
  },
  confused: {
    left: 'M 55 130 L 40 136',
    right: 'M 145 130 L 160 136',
  },
  sleep: {
    left: 'M 55 130 L 38 152',
    right: 'M 145 130 L 162 152',
  },
};

/**
 * MaiMai 公仔 SVG 骨架組件
 * @description 統一的 SVG 真理來源，支援所有心情狀態
 */

// ============ SVG 部件 ============

/** M 型天線 */
export function Antenna({ animated = false, mood }: { animated?: boolean | undefined; mood?: MaiMaiMood | undefined }) {
  const wiggle = mood === 'wave' || mood === 'celebrate' || mood === 'excited';
  const droopy = mood === 'sleep' || mood === 'shy';
  
  const d = droopy 
    ? 'M 85 45 L 85 20 L 100 32 L 115 20 L 115 45'
    : 'M 85 40 L 85 15 L 100 30 L 115 15 L 115 40';

  return (
    <path
      d={d}
      stroke="currentColor"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${wiggle ? 'animate-wiggle origin-bottom' : ''} ${droopy ? 'opacity-70' : ''}`}
    />
  );
}

/** 屋頂 */
export function Roof() {
  return (
    <path
      d="M 40 80 L 100 40 L 160 80"
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
      x="55" y="80"
      width="90" height="100"
      stroke="currentColor"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** 眉毛 */
export function Eyebrows({ mood }: { mood: MaiMaiMood }) {
  // 不同心情的眉毛形狀
  switch (mood) {
    case 'happy':
    case 'celebrate':
    case 'excited':
      // 開心挑眉
      return (
        <>
          <path d="M 76 105 Q 85 98 94 105" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 106 105 Q 115 98 124 105" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    case 'shy':
    case 'confused':
      // 擔心皺眉
      return (
        <>
          <path d="M 78 108 L 92 115" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 122 108 L 108 115" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    case 'thinking':
      // 單邊挑眉
      return (
        <>
          <path d="M 78 108 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 108 105 Q 115 100 122 105" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    case 'peek':
      // 緊張眉
      return (
        <>
          <path d="M 78 108 L 92 112" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 108 112 L 122 108" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    case 'sleep':
      // 水平眉
      return (
        <>
          <path d="M 78 115 L 92 115" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M 108 115 L 122 115" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
        </>
      );
    default:
      // 標準微彎眉
      return (
        <>
          <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
  }
}

/** 眼睛 */
export function Eyes({ mood }: { mood: MaiMaiMood }) {
  switch (mood) {
    case 'happy':
    case 'wave':
      // 開心彎眼 ^ ^
      return (
        <>
          <path d="M 80 125 Q 85 120 90 125" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 110 125 Q 115 120 120 125" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    case 'celebrate':
    case 'excited':
      // 閉眼笑
      return (
        <>
          <path d="M 78 118 Q 85 110 92 118" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 108 118 Q 115 110 122 118" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      );
    case 'peek':
      // 遮眼偷看（小點）
      return (
        <>
          <circle cx="85" cy="125" r="3" fill="currentColor" />
          <circle cx="115" cy="125" r="3" fill="currentColor" />
        </>
      );
    case 'thinking':
      // 看向右上
      return (
        <>
          <circle cx="87" cy="123" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="88" cy="122" r="1.5" fill="currentColor" />
          <circle cx="117" cy="123" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="118" cy="122" r="1.5" fill="currentColor" />
        </>
      );
    case 'shy':
    case 'confused':
      // 擔心眼
      return (
        <>
          <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="85" cy="126" r="1.5" fill="currentColor" />
          <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="115" cy="126" r="1.5" fill="currentColor" />
        </>
      );
    case 'sleep':
      // 閉眼線
      return (
        <>
          <path d="M 78 125 L 92 125" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 108 125 L 122 125" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      );
    default:
      // 標準空心圓眼
      return (
        <g className="animate-blink">
          <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
        </g>
      );
  }
}

/** 嘴巴 */
export function Mouth({ mood }: { mood: MaiMaiMood }) {
  switch (mood) {
    case 'happy':
    case 'wave':
      // 大微笑
      return <path d="M 85 145 Q 100 160 115 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'celebrate':
    case 'excited':
      // 超大笑
      return <path d="M 80 140 Q 100 165 120 140" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />;
    case 'thinking':
      // 嗯...
      return <path d="M 95 150 L 105 150" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'shy':
    case 'confused':
      // 波浪嘴
      return <path d="M 88 150 Q 94 145 100 150 Q 106 155 112 150" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'peek':
      // 小微笑
      return <path d="M 92 150 Q 100 155 108 150" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
    case 'sleep':
      // 橢圓嘴
      return <ellipse cx="100" cy="150" rx="5" ry="3" stroke="currentColor" strokeWidth="2" fill="none" />;
    default:
      // 標準微笑
      return <path d="M 90 145 Q 100 155 110 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />;
  }
}

/** 手臂 */
export function Arms({ mood }: { mood: MaiMaiMood }) {
  const arms = ARM_POSES[mood] ?? ARM_POSES.default;

  return (
    <>
      <path
        d={arms.left}
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={arms.right}
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {arms.extra}
    </>
  );
}

/** 腿 */
export function Legs({ mood, animated = false }: { mood: MaiMaiMood; animated?: boolean }) {
  const jumping = mood === 'celebrate' || mood === 'excited';
  
  if (jumping) {
    return (
      <>
        <path d="M 85 175 L 75 200 L 65 205" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 115 175 L 125 200 L 135 205" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    );
  }

  return (
    <>
      <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** 特效 - 腮紅 */
export function Blush({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <>
      <circle cx="70" cy="140" r="8" fill="#FFB6C1" opacity="0.6" />
      <circle cx="130" cy="140" r="8" fill="#FFB6C1" opacity="0.6" />
    </>
  );
}

/** 特效 - 愛心/星星 */
export function Effects({ mood }: { mood: MaiMaiMood }) {
  switch (mood) {
    case 'celebrate':
    case 'excited':
      return (
        <g className="animate-confetti">
          <text x="30" y="40" fontSize="14">🎉</text>
          <text x="160" y="35" fontSize="12">🎊</text>
          <text x="20" y="80" fontSize="10">✨</text>
          <text x="175" y="75" fontSize="10">⭐</text>
        </g>
      );
    case 'happy':
      return (
        <>
          <text x="40" y="60" fontSize="14" className="animate-twinkle">✨</text>
          <text x="155" y="55" fontSize="12" className="animate-twinkle-delay">✨</text>
        </>
      );
    case 'thinking':
      return (
        <g className="animate-float-up">
          <circle cx="160" cy="50" r="5" fill="currentColor" opacity="0.3" />
          <circle cx="170" cy="35" r="8" fill="currentColor" opacity="0.5" />
          <circle cx="185" cy="15" r="12" fill="currentColor" opacity="0.7" />
        </g>
      );
    case 'sleep':
      return (
        <g className="animate-float-up">
          <text x="150" y="50" fontSize="12" fill="currentColor" opacity="0.7">z</text>
          <text x="165" y="35" fontSize="16" fill="currentColor" opacity="0.8">z</text>
          <text x="180" y="18" fontSize="20" fill="currentColor">Z</text>
        </g>
      );
    case 'shy':
      return (
        <ellipse cx="155" cy="70" rx="5" ry="8" fill="#87CEEB" className="animate-drip" />
      );
    case 'wave':
      return (
        <g className="animate-bounce">
          <ellipse cx="175" cy="60" rx="20" ry="15" fill="white" stroke="currentColor" strokeWidth="2" />
          <text x="175" y="65" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">Hi!</text>
        </g>
      );
    default:
      return null;
  }
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
