import React, { useState } from 'react';
import { empathicEcho } from '../services/ai';
import { addNote } from '../stores/notesStore';
import { Events, track } from '../analytics/track';

export const NoteWithEcho: React.FC = () => {
  const [text, setText] = useState('');
  const [echo, setEcho] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSave = async () => {
    const v = text.trim();
    if (!v) return;
    setLoading(true);
    try {
      const echoText = await empathicEcho(v);
      setEcho(echoText);
      addNote(v, echoText);
      track(Events.NoteSaved, {});
    } catch (e) {
      addNote(v);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 12,
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>收藏備註（感受）</div>
      <textarea
        rows={3}
        placeholder="寫下這間帶給你的感覺…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 8,
          border: '1px solid #ddd',
        }}
      />
      {focused && (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>慢慢寫，我在。</div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: '#1749D7',
            color: '#fff',
            border: '1px solid #1749D7',
          }}
        >
          {loading ? '生成中…' : '存入便條（含回聲）'}
        </button>
        {echo && <span style={{ color: '#6b7280' }}>AI 回聲：{echo}</span>}
      </div>
    </div>
  );
};
