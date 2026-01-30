import { memo, useEffect, useMemo, useState } from 'react';
import { MaiMaiBase } from '../MaiMai';
import type { MaiMaiMood } from '../MaiMai';
import useConfetti from '../MaiMai/useConfetti';

interface TrustRoomMaiMaiProps {
  mood: MaiMaiMood;
  showConfetti: boolean;
}

/**
 * TrustRoom MaiMai 渲染元件
 * - 內建 confetti 支援
 * - 尺寸對應桌機/手機
 */
export const TrustRoomMaiMai = memo(function TrustRoomMaiMai({
  mood,
  showConfetti,
}: TrustRoomMaiMaiProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(media.matches);
    update();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const confettiOptions = useMemo(
    () => ({
      particleCount: isMobile ? 40 : 80,
      spread: isMobile ? 55 : 60,
      origin: isMobile ? { x: 0.9, y: 0.8 } : { x: 0.88, y: 0.85 },
    }),
    [isMobile]
  );

  const { fireConfetti, ConfettiCanvas } = useConfetti(confettiOptions);

  useEffect(() => {
    if (showConfetti) fireConfetti();
  }, [showConfetti, fireConfetti]);

  return (
    <>
      <div role="img" aria-label="MaiMai 吉祥物">
        <MaiMaiBase
          mood={mood}
          size="sm"
          animated
          showEffects
          className="h-16 w-16 sm:h-20 sm:w-20"
        />
      </div>
      {showConfetti && <ConfettiCanvas />}
    </>
  );
});

export default TrustRoomMaiMai;
