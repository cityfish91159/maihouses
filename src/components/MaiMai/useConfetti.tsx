/**
 * MaiMai 慶祝動畫 Hook
 * @description 使用 canvas-confetti 實現高效能撒花動畫
 */

import { useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface UseConfettiOptions {
  /** 彩帶數量 */
  particleCount?: number;
  /** 擴散角度 (度) */
  spread?: number;
  /** 起始位置 { x: 0-1, y: 0-1 } */
  origin?: { x: number; y: number };
  /** 彩帶顏色 */
  colors?: string[];
}

/**
 * 慶祝動畫 Hook
 *
 * @description NASA-grade 效能優化：
 * - 使用 useRef 持有 Canvas 實例，避免重複初始化
 * - 使用 useCallback 包裝 fire 函數，避免重複建立
 * - 組件卸載時自動清理
 *
 * @example
 * ```tsx
 * function MaiMai() {
 *   const { fireConfetti, ConfettiCanvas } = useConfetti();
 *
 *   return (
 *     <div>
 *       <button onClick={fireConfetti}>慶祝！</button>
 *       <ConfettiCanvas />
 *     </div>
 *   );
 * }
 * ```
 */
export function useConfetti(options: UseConfettiOptions = {}) {
  const {
    particleCount = 100,
    spread = 70,
    origin = { x: 0.5, y: 0.6 },
    colors = ['#FBBF24', '#F472B6', '#38BDF8', '#A78BFA', '#22C55E'],
  } = options;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiInstance = useRef<ReturnType<typeof confetti.create> | null>(null);

  // 初始化 confetti 實例
  useEffect(() => {
    if (canvasRef.current && !confettiInstance.current) {
      confettiInstance.current = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true,
      });
    }

    // 清理函數
    return () => {
      if (confettiInstance.current) {
        confettiInstance.current.reset();
      }
    };
  }, []);

  // 觸發撒花動畫
  const fireConfetti = useCallback(() => {
    if (!confettiInstance.current) return;

    confettiInstance.current({
      particleCount,
      spread,
      origin,
      colors,
      disableForReducedMotion: true,
    });
  }, [particleCount, spread, origin, colors]);

  // Canvas 組件
  const ConfettiCanvas = useCallback((): JSX.Element => {
    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
    );
  }, []);

  return {
    fireConfetti,
    ConfettiCanvas,
  } as const;
}

export default useConfetti;
