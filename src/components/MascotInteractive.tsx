import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { MaiMaiBase, MaiMaiSpeech, useMaiMaiMood, useMascotCelebrateEvent, SIZE_CLASSES } from './MaiMai';
import useConfetti from './MaiMai/useConfetti';
import type { MaiMaiMood } from './MaiMai';

interface MascotInteractiveProps {
  mood?: MaiMaiMood;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  messages?: string[];
  // 登入頁互動
  isTypingEmail?: boolean;
  isTypingPassword?: boolean;
  hasError?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
}

/**
 * MascotInteractive - 完整互動版公仔（登入頁使用）
 * @description 使用 MaiMai 原子組件重構，支援所有互動狀態
 */
export default function MascotInteractive({
  mood: externalMood,
  size = 'md',
  className = '',
  messages = [],
  isTypingEmail = false,
  isTypingPassword = false,
  hasError = false,
  isLoading = false,
  isSuccess = false,
}: MascotInteractiveProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [eventCelebrating, setEventCelebrating] = useState(false);

  // 使用統一的心情狀態機 Hook
  const { mood: computedMood, clickCount, handleClick } = useMaiMaiMood({
    externalMood,
    isSuccess,
    hasError,
    isLoading,
    isTypingPassword,
    isTypingEmail,
    isHovered,
    isCelebrating: eventCelebrating // Pass event-triggered celebration
  });

  const { fireConfetti, ConfettiOverlay } = useConfetti();

  // 監聽全域慶祝事件 (e.g. LINE Share)
  useMascotCelebrateEvent(useCallback(() => {
    setEventCelebrating(true);
    fireConfetti();
    setTimeout(() => setEventCelebrating(false), 2000);
  }, [fireConfetti]));
  const prevMoodRef = useRef<MaiMaiMood | null>(null);
  const lastCelebrateAtRef = useRef<number>(0);

  const effectiveMessages = useMemo(() => {
    const trimmed = messages.map(m => m.trim()).filter(Boolean);
    return trimmed.slice(-3);
  }, [messages]);

  useEffect(() => {
    const shouldCelebrate = computedMood === 'celebrate' || computedMood === 'excited';
    const now = Date.now();
    if (
      shouldCelebrate &&
      prevMoodRef.current !== computedMood &&
      now - lastCelebrateAtRef.current > 800 &&
      !eventCelebrating // Prevent loop: don't re-dispatch if triggered by event
    ) {
      fireConfetti();
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
      lastCelebrateAtRef.current = now;
    }
    prevMoodRef.current = computedMood;
  }, [computedMood, fireConfetti]);

  return (
    <div
      className={`relative ${SIZE_CLASSES[size]} ${className} cursor-pointer select-none`}
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {effectiveMessages.length > 0 && (
        <MaiMaiSpeech messages={effectiveMessages} />
      )}
      {ConfettiOverlay}
      {/* 公仔 */}
      <div className={`size-full transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
        <MaiMaiBase
          mood={computedMood}
          size={size}
          className="size-full"
          animated={true}
          showEffects={true}
        />
      </div>

      {/* 點擊特效 */}
      {clickCount > 0 && clickCount <= 5 && (
        <div className="absolute -right-2 -top-2 animate-bounce text-lg">
          {['💫', '✨', '🌟', '💖', '🎉'][Math.min(clickCount - 1, 4)]}
        </div>
      )}
    </div>
  );
}
