import React from 'react';
import { useMood } from '../context/MoodContext';

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 10px',
  borderRadius: 999,
  border: active ? '1px solid #1749D7' : '1px solid #ddd',
  background: active ? '#EAF1FF' : '#fff',
  color: '#0a2246',
  cursor: 'pointer',
});

export const FloatingMoodChips: React.FC = () => {
  const { mood, setMood } = useMood();
  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        background: '#fff',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 8,
        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
        zIndex: 40,
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>心情</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => setMood('neutral')}
          aria-label="今天還不錯"
          style={chipStyle(mood === 'neutral')}
        >
          今天還不錯
        </button>
        <button
          onClick={() => setMood('stress')}
          aria-label="有點累"
          style={chipStyle(mood === 'stress')}
        >
          有點累
        </button>
        <button
          onClick={() => setMood('rest')}
          aria-label="想放空"
          style={chipStyle(mood === 'rest')}
        >
          想放空
        </button>
      </div>
    </div>
  );
};
