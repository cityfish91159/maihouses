import React from 'react';
import type { MaiMaiSpeechProps } from './types';

/**
 * MaiMai 對話氣泡組件
 * @description 顯示最近 3 句對話，最新一句粗體，舊訊息淡出
 */
export function MaiMaiSpeech({ messages, className = '' }: MaiMaiSpeechProps) {
  if (!messages.length) return null;

  // 只取最後 3 句
  const recentMessages = messages.slice(-3);
  const lastIndex = recentMessages.length - 1;

  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-2 absolute bottom-full left-1/2 z-10 mb-3 min-w-[120px] max-w-[85vw] -translate-x-1/2 rounded-xl bg-white px-3 py-2 shadow-lg ring-1 ring-slate-200 duration-300 sm:max-w-[280px] ${className} `}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="MaiMai 最新對話"
    >
      {/* 氣泡尾巴 - 置中 */}
      <div className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 bg-white ring-1 ring-slate-200" />

      <div className="relative space-y-0.5">
        {recentMessages.map((message, index) => {
          const isLast = index === lastIndex;
          const isOld = index < lastIndex - 1; // 倒數第二之前的都算舊

          return (
            <p
              key={`${index}-${message.slice(0, 10)}`}
              className={`text-sm leading-snug transition-all duration-300 ${
                isLast
                  ? 'font-bold text-slate-700'
                  : isOld
                    ? 'text-[10px] text-slate-400 line-through opacity-50'
                    : 'text-xs text-slate-500'
              } `}
            >
              {message}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export default MaiMaiSpeech;
