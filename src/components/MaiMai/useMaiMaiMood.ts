import { useMemo, useState, useCallback, useEffect } from 'react';
import type { MaiMaiMood, UseMaiMaiMoodOptions } from './types';

/**
 * MaiMai 心情狀態機 Hook
 * @description 根據多種輸入計算當前應顯示的心情狀態
 * 
 * 優先級順序（高到低）：
 * 1. 外部強制指定 (externalMood)
 * 2. 點擊慶祝 (isCelebrating)
 * 3. 成功狀態 (isSuccess)
 * 4. 錯誤狀態 (hasError)
 * 5. 載入中 (isLoading)
 * 6. 輸入密碼 (isTypingPassword)
 * 7. 輸入 email (isTypingEmail)
 * 8. hover 狀態 (isHovered)
 * 9. 預設 idle
 */
export function useMaiMaiMood(options: UseMaiMaiMoodOptions = {}): {
  mood: MaiMaiMood;
  clickCount: number;
  handleClick: () => void;
  resetCelebration: () => void;
} {
  const {
    externalMood,
    isSuccess = false,
    hasError = false,
    isLoading = false,
    isTypingPassword = false,
    isTypingEmail = false,
    isHovered = false,
    isCelebrating: externalCelebrating,
  } = options;

  const [clickCount, setClickCount] = useState(0);
  const [internalCelebrating, setInternalCelebrating] = useState(false);

  // 點擊 5 次觸發慶祝
  const handleClick = useCallback(() => {
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 5) {
        setInternalCelebrating(true);
      }
      return newCount;
    });
  }, []);

  const resetCelebration = useCallback(() => {
    setInternalCelebrating(false);
    setClickCount(0);
  }, []);

  // 自動重置慶祝狀態 (避免 unmout 後更新 state)
  useEffect(() => {
    if (internalCelebrating) {
      const timer = setTimeout(() => {
        setInternalCelebrating(false);
        setClickCount(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [internalCelebrating]);

  // 使用 useMemo 計算 mood，避免閃爍
  const mood = useMemo<MaiMaiMood>(() => {
    // 優先級 1: 外部強制指定
    if (externalMood) return externalMood;
    
    // 優先級 2: 慶祝狀態（點擊或外部觸發）
    if (internalCelebrating || externalCelebrating) return 'celebrate';
    
    // 優先級 3: 成功
    if (isSuccess) return 'celebrate';
    
    // 優先級 4: 錯誤
    if (hasError) return 'shy';
    
    // 優先級 5: 載入中
    if (isLoading) return 'thinking';
    
    // 優先級 6: 輸入密碼
    if (isTypingPassword) return 'peek';
    
    // 優先級 7: 輸入 email
    if (isTypingEmail) return 'happy';
    
    // 優先級 8: hover
    if (isHovered) return 'wave';
    
    // 預設
    return 'idle';
  }, [
    externalMood,
    internalCelebrating,
    externalCelebrating,
    isSuccess,
    hasError,
    isLoading,
    isTypingPassword,
    isTypingEmail,
    isHovered,
  ]);

  return {
    mood,
    clickCount,
    handleClick,
    resetCelebration,
  };
}

/**
 * 監聽全域 mascot:celebrate 事件的 Hook
 */
export function useMascotCelebrateEvent(onCelebrate: () => void) {
  useEffect(() => {
    const handler = () => onCelebrate();
    window.addEventListener('mascot:celebrate', handler);
    return () => window.removeEventListener('mascot:celebrate', handler);
  }, [onCelebrate]);
}
