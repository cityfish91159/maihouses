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
    <div className="rounded-xl border border-[#eee] bg-white p-3">
      <div className="mb-1.5 font-semibold">收藏備註（感受）</div>
      <textarea
        rows={3}
        placeholder="寫下這間帶給你的感覺…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-lg border border-[#ddd] p-2"
      />
      {focused && <div className="mt-1 text-xs text-[#6b7280]">慢慢寫，我在。</div>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-lg border border-[#1749D7] bg-[#1749D7] px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '生成中…' : '存入便條（含回聲）'}
        </button>
        {echo && <span className="text-[#6b7280]">AI 回聲：{echo}</span>}
      </div>
    </div>
  );
};
