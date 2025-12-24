import React, { useCallback, useMemo, useState, useRef } from 'react';
import type { CSSProperties } from 'react';

interface ConfettiPiece {
  left: number;
  top: number;
  size: number;
  color: string;
  delay: number;
  dx: number;
  dy: number;
  rotateStart: number;
}

/** Confetti 配置常量 */
const CONFETTI_CONFIG = {
  /** 彩帶顏色調色板 */
  COLORS: ['#FBBF24', '#F472B6', '#38BDF8', '#A78BFA', '#22C55E'],
  /** 水平分布範圍 (%) */
  LEFT_MIN: 10,
  LEFT_RANGE: 80,
  /** 垂直起始範圍 (%) */
  TOP_MIN: 5,
  TOP_RANGE: 10,
  /** 大小範圍 (px) */
  SIZE_MIN: 6,
  SIZE_RANGE: 6,
  /** 延遲範圍 (ms) */
  DELAY_MAX: 120,
  /** 水平速度範圍 (px) */
  DX_RANGE: 60,
  /** 垂直速度範圍 (px) */
  DY_MIN: 60,
  DY_RANGE: 120,
  /** 初始旋轉角度範圍 (deg) */
  ROTATE_MAX: 90,
  /** 動畫持續時間 (ms) */
  ANIMATION_DURATION: 1200,
} as const;

function createPiece(): ConfettiPiece {
  const colorIndex = Math.floor(Math.random() * CONFETTI_CONFIG.COLORS.length);
  const color = CONFETTI_CONFIG.COLORS.length
    ? CONFETTI_CONFIG.COLORS[colorIndex % CONFETTI_CONFIG.COLORS.length]!
    : '#FBBF24';
  return {
    left: Math.random() * CONFETTI_CONFIG.LEFT_RANGE + CONFETTI_CONFIG.LEFT_MIN,
    top: Math.random() * CONFETTI_CONFIG.TOP_RANGE + CONFETTI_CONFIG.TOP_MIN,
    size: Math.random() * CONFETTI_CONFIG.SIZE_RANGE + CONFETTI_CONFIG.SIZE_MIN,
    color,
    delay: Math.random() * CONFETTI_CONFIG.DELAY_MAX,
    dx: (Math.random() - 0.5) * CONFETTI_CONFIG.DX_RANGE,
    dy: Math.random() * CONFETTI_CONFIG.DY_RANGE + CONFETTI_CONFIG.DY_MIN,
    rotateStart: Math.random() * CONFETTI_CONFIG.ROTATE_MAX,
  };
}

export function useConfetti(pieceCount = 18) {
  const [bursts, setBursts] = useState<{ id: number; pieces: ConfettiPiece[] }[]>([]);
  const idRef = useRef(0);

  const fireConfetti = useCallback(() => {
    idRef.current += 1;
    const id = idRef.current;
    const pieces = Array.from({ length: pieceCount }, createPiece);
    setBursts(prev => [...prev, { id, pieces }]);
    // Clean up burst after animation ends
    setTimeout(() => {
      setBursts(prev => prev.filter(b => b.id !== id));
    }, CONFETTI_CONFIG.ANIMATION_DURATION);
  }, [pieceCount]);

  const ConfettiOverlay = useMemo(() => (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {bursts.map(burst => (
        <React.Fragment key={burst.id}>
          {burst.pieces.map((piece, idx) => (
            <span
              key={`${burst.id}-${idx}`}
              className="absolute block rounded-sm animate-confetti"
              style={{
                left: `${piece.left}%`,
                top: `${piece.top}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 0.6}px`,
                background: piece.color,
                animationDelay: `${piece.delay}ms`,
                transform: `translate(${piece.dx}px, 0px) rotate(${piece.rotateStart}deg)`,
                '--confetti-dx': `${piece.dx}px`,
                '--confetti-dy': `${piece.dy}px`,
              } as CSSProperties & { '--confetti-dx'?: string; '--confetti-dy'?: string }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  ), [bursts]);

  return { fireConfetti, ConfettiOverlay } as const;
}

export default useConfetti;
