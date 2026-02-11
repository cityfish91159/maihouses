import React from 'react';
import { useMood } from '../context/MoodContext';

const chipClassName = (active: boolean): string =>
  [
    'cursor-pointer rounded-full border px-2.5 py-1.5 text-[#0a2246]',
    active ? 'border-[#1749D7] bg-[#EAF1FF]' : 'border-[#ddd] bg-white',
  ].join(' ');

export const FloatingMoodChips: React.FC = () => {
  const { mood, setMood } = useMood();
  return (
    <div className="fixed bottom-4 right-4 z-40 rounded-xl border border-[#eee] bg-white p-2 shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
      <div className="mb-1.5 text-xs text-[#6b7280]">心情</div>
      <div className="flex gap-1.5">
        <button
          onClick={() => setMood('neutral')}
          aria-label="今天還不錯"
          className={chipClassName(mood === 'neutral')}
        >
          今天還不錯
        </button>
        <button
          onClick={() => setMood('stress')}
          aria-label="有點累"
          className={chipClassName(mood === 'stress')}
        >
          有點累
        </button>
        <button
          onClick={() => setMood('rest')}
          aria-label="想放空"
          className={chipClassName(mood === 'rest')}
        >
          想放空
        </button>
      </div>
    </div>
  );
};
