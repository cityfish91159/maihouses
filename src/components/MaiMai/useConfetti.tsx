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

const COLORS = ['#FBBF24', '#F472B6', '#38BDF8', '#A78BFA', '#22C55E'];

function createPiece(): ConfettiPiece {
  const colorIndex = Math.floor(Math.random() * COLORS.length);
  const color = COLORS.length ? COLORS[colorIndex % COLORS.length]! : '#FBBF24';
  return {
    left: Math.random() * 80 + 10, // spread across container
    top: Math.random() * 10 + 5,   // near top
    size: Math.random() * 6 + 6,
    color,
    delay: Math.random() * 120,
    dx: (Math.random() - 0.5) * 60,
    dy: Math.random() * 120 + 60,
    rotateStart: Math.random() * 90,
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
    }, 1200);
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
