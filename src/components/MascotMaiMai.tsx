import React, { useState, useEffect } from 'react';
import { MaiMaiBase, useMaiMaiMood } from './MaiMai';
import type { MaiMaiMood } from './MaiMai';

/**
 * MascotMaiMai - 簡化版公仔（SmartAsk 使用）
 * @description 使用 MaiMai 原子組件重構，保持原有循環動畫行為
 */
export default function MascotMaiMai() {
  const [moodIndex, setMoodIndex] = useState(0);
  
  // 簡單的待命動畫：idle → wave → happy 循環
  useEffect(() => {
    const interval = setInterval(() => {
      setMoodIndex(m => (m + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 對應原本的 3 種手勢循環
  const moods: MaiMaiMood[] = ['idle', 'wave', 'happy'];
  const currentMood: MaiMaiMood = moods[moodIndex] ?? 'idle';

  return (
    <div className="relative mb-4 h-40 w-32 text-brand">
      <div className="absolute left-1/2 top-1/2 -z-10 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-100/50 blur-2xl" />
      <MaiMaiBase
        mood={currentMood}
        size="lg"
        className="size-full"
        animated={true}
        showEffects={false}
      />
    </div>
  );
}

