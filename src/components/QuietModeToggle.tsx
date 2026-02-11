import React, { useState } from 'react';
import { useQuietMode } from '../context/QuietModeContext';

export const QuietModeToggle: React.FC = () => {
  const { startQuiet, clearQuiet, isActive } = useQuietMode();
  const [minutes, setMinutes] = useState<number | ''>('');
  const [turns, setTurns] = useState<number>(10);
  const [reason, setReason] = useState<string>('只聊天');

  if (isActive()) {
    return (
      <button
        onClick={clearQuiet}
        title="安靜模式已啟用，點擊解除"
        className="btn-quiet on rounded-lg border border-[#1749D7] bg-[#1749D7] px-2.5 py-1.5 text-white"
      >
        安靜中（解除）
      </button>
    );
  }

  const handleStart = () => {
    const opts: { minutes?: number; turns?: number; reason?: string } = {};
    if (typeof minutes === 'number' && minutes > 0) opts.minutes = minutes;
    if (turns > 0) opts.turns = turns;
    if (reason) opts.reason = reason;
    startQuiet(opts);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleStart}
        title="啟用安靜模式（預設 10 回合）"
        className="btn-quiet off rounded-lg border border-[#1749D7] bg-white px-2.5 py-1.5 text-[#1749D7]"
      >
        開啟安靜模式
      </button>
      <button
        onClick={() => startQuiet({ minutes: 20, turns: 999, reason: '只想聊 20 分鐘' })}
        className="rounded-full border border-dashed border-[#1749D7] bg-[#F5F8FF] px-2 py-1 text-[#1749D7]"
      >
        只想聊 20 分鐘
      </button>
      <button
        onClick={() => startQuiet({ turns: 999, reason: '今天別推薦了' })}
        className="rounded-full border border-dashed border-[#1749D7] bg-[#F5F8FF] px-2 py-1 text-[#1749D7]"
      >
        今天別推薦了
      </button>
      <input
        id="quiet-mode-minutes"
        name="quietMinutes"
        type="number"
        min={0}
        placeholder="分鐘(可選)"
        value={typeof minutes === 'number' ? minutes : ''}
        onChange={(e) => {
          const v = Number(e.target.value);
          setMinutes(Number.isFinite(v) ? v : '');
        }}
        className="w-[90px] rounded-md border border-[#ddd] px-1.5 py-1"
      />
      <input
        id="quiet-mode-turns"
        name="quietTurns"
        type="number"
        min={1}
        placeholder="回合(預設10)"
        value={turns}
        onChange={(e) => {
          const v = Number(e.target.value);
          setTurns(Number.isFinite(v) && v > 0 ? v : 10);
        }}
        className="w-[90px] rounded-md border border-[#ddd] px-1.5 py-1"
      />
      <input
        id="quiet-mode-reason"
        name="quietReason"
        type="text"
        placeholder="原因(可選)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-[120px] rounded-md border border-[#ddd] px-1.5 py-1"
      />
    </div>
  );
};
