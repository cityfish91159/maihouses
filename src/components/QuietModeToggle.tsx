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
        className="btn-quiet on"
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #1749D7',
          background: '#1749D7',
          color: '#fff',
        }}
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
      }}
    >
      <button
        onClick={handleStart}
        title="啟用安靜模式（預設 10 回合）"
        className="btn-quiet off"
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #1749D7',
          background: '#fff',
          color: '#1749D7',
        }}
      >
        開啟安靜模式
      </button>
      <button
        onClick={() => startQuiet({ minutes: 20, turns: 999, reason: '只想聊 20 分鐘' })}
        style={{
          padding: '4px 8px',
          borderRadius: 999,
          border: '1px dashed #1749D7',
          background: '#F5F8FF',
          color: '#1749D7',
        }}
      >
        只想聊 20 分鐘
      </button>
      <button
        onClick={() => startQuiet({ turns: 999, reason: '今天別推薦了' })}
        style={{
          padding: '4px 8px',
          borderRadius: 999,
          border: '1px dashed #1749D7',
          background: '#F5F8FF',
          color: '#1749D7',
        }}
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
        style={{
          width: 90,
          padding: '4px 6px',
          borderRadius: 6,
          border: '1px solid #ddd',
        }}
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
        style={{
          width: 90,
          padding: '4px 6px',
          borderRadius: 6,
          border: '1px solid #ddd',
        }}
      />
      <input
        id="quiet-mode-reason"
        name="quietReason"
        type="text"
        placeholder="原因(可選)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{
          width: 120,
          padding: '4px 6px',
          borderRadius: 6,
          border: '1px solid #ddd',
        }}
      />
    </div>
  );
};
