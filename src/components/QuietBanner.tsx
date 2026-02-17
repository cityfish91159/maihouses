import React, { useState, useEffect } from 'react';
import { useQuietMode } from '../context/QuietModeContext';

export const QuietBanner: React.FC = () => {
  const { state, clearQuiet, isActive } = useQuietMode();

  // 使用 state 儲存當前時間，避免在 render 中調用 Date.now()
  const [now, setNow] = useState(() => Date.now());

  // 定期更新時間（每 10 秒）
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  if (!isActive()) return null;

  const minutesLeft = state.untilTs ? Math.max(0, Math.ceil((state.untilTs - now) / 60000)) : null;
  const turnsLeft = state.remainingTurns ?? null;

  return (
    <div
      className="h-9 w-full bg-[var(--mh-color-0a2246)] text-center text-sm leading-9 tracking-[0.5px] text-white"
      role="status"
      aria-live="polite"
    >
      <span>邁邁安靜陪你聊，不打擾 😊</span>
      {state.reason ? <span>｜{state.reason}</span> : null}
      {minutesLeft !== null ? <span>｜剩餘 {minutesLeft} 分</span> : null}
      {turnsLeft !== null ? <span>｜剩餘 {turnsLeft} 回合</span> : null}
      <button
        onClick={clearQuiet}
        aria-label="解除安靜模式"
        className="ml-3 cursor-pointer rounded-md border border-white bg-transparent px-2 py-0.5 text-white"
      >
        解除
      </button>
    </div>
  );
};
