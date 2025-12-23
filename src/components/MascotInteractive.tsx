import React, { useState, useCallback, useMemo } from 'react';
import { MaiMaiBase, useMaiMaiMood } from './MaiMai';
import type { MaiMaiMood } from './MaiMai';

interface MascotInteractiveProps {
  mood?: MaiMaiMood;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
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
  isTypingEmail = false,
  isTypingPassword = false,
  hasError = false,
  isLoading = false,
  isSuccess = false,
}: MascotInteractiveProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 使用統一的心情狀態機 Hook
  const { mood: computedMood, clickCount, handleClick } = useMaiMaiMood({
    externalMood,
    isSuccess,
    hasError,
    isLoading,
    isTypingPassword,
    isTypingEmail,
    isHovered,
  });

  // 尺寸對應
  const sizeMap: Record<'sm' | 'md' | 'lg', 'sm' | 'md' | 'lg' | 'xl'> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} ${className} cursor-pointer select-none`}
      role="button"
      tabIndex={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* 公仔 */}
      <div className={`size-full transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}>
        <MaiMaiBase
          mood={computedMood}
          size={sizeMap[size]}
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
