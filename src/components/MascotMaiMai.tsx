import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MaiMaiBase, useMaiMaiMood } from './MaiMai';
import { MaiMaiSpeech } from './MaiMai/MaiMaiSpeech';
import useConfetti from './MaiMai/useConfetti';
import type { MaiMaiMood } from './MaiMai';

interface MascotMaiMaiProps {
  /** SmartAsk 是否正在輸入或請求 */
  isThinking?: boolean;
  /** SmartAsk 問答是否剛成功（用於 excited + 撒花） */
  isSuccess?: boolean;
  /** SmartAsk 是否發生錯誤 */
  hasError?: boolean;
  /** 對話訊息（取最後 3 句顯示氣泡） */
  messages?: string[];
}

/**
 * MascotMaiMai - 簡化版公仔（SmartAsk 使用）
 * @description 使用 MaiMai 原子組件重構，保持原有循環動畫行為
 */
export default function MascotMaiMai({ isThinking = false, isSuccess = false, hasError = false, messages = [] }: MascotMaiMaiProps) {
  const [successFlash, setSuccessFlash] = useState(false);

  // 問答成功時短暫 excited + 撒花
  useEffect(() => {
    if (!isSuccess) return;

    // Use setTimeout to avoid synchronous setState in effect
    const immediate = setTimeout(() => setSuccessFlash(true), 0);
    const timer = setTimeout(() => setSuccessFlash(false), 1800);

    return () => {
      clearTimeout(immediate);
      clearTimeout(timer);
    };
  }, [isSuccess]);

  // 心情狀態機：輸入/請求 → thinking；成功 → excited/celebrate；錯誤 → shy
  const { mood, handleClick } = useMaiMaiMood({
    externalMood: successFlash ? 'excited' : undefined,
    isSuccess: successFlash,
    hasError,
    isLoading: isThinking,
  });

  const { fireConfetti, ConfettiCanvas } = useConfetti({ particleCount: 14 });
  const prevMoodRef = useRef<MaiMaiMood>(mood);

  useEffect(() => {
    if ((mood === 'celebrate' || mood === 'excited') && prevMoodRef.current !== mood) {
      fireConfetti();
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
    }
    prevMoodRef.current = mood;
  }, [mood, fireConfetti]);

  // 氣泡內容：取最後 3 句文字
  const speechMessages = useMemo(() => messages.map(m => m.trim()).filter(Boolean), [messages]);

  return (
    <div className="relative mb-4 h-40 w-32 text-brand">
      <div className="absolute left-1/2 top-1/2 -z-10 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-100/50 blur-2xl" />
      {speechMessages.length > 0 && (
        <MaiMaiSpeech messages={speechMessages} />
      )}
      <ConfettiCanvas />
      <MaiMaiBase
        mood={mood}
        size="lg"
        className="size-full"
        animated={true}
        showEffects={true}
        onClick={handleClick}
      />
    </div>
  );
}

