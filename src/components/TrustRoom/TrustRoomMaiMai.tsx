import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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

  const throttledUpdate = useCallback(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (callback: () => void) => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        callback();
        timeoutId = null;
      }, 200);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const throttle = throttledUpdate();
    if (typeof window.matchMedia !== 'function') {
      const update = () => setIsMobile(window.innerWidth <= 640);
      const handleResize = () => throttle(update);
      update();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(media.matches);
    update();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    const handleResize = () => throttle(update);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [throttledUpdate]);

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
    if (!showConfetti) return;
    fireConfetti();
    // Note: Confetti cleanup is handled internally by useConfetti hook
  }, [showConfetti, fireConfetti]);

  return (
    <>
      <div role="img" aria-label="MaiMai 吉祥物">
        <MaiMaiBase
          mood={mood}
          size="sm"
          animated
          showEffects
          className="size-16 sm:size-20"
          /* 註：保持 64px (size-16) 而非規範建議的 56px (size-14)
             原因：符合 WCAG 2.1 觸控目標最小尺寸 44×44px 標準 */
        />
      </div>
      {showConfetti && <ConfettiCanvas />}
    </>
  );
});

export default TrustRoomMaiMai;
