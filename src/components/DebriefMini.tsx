import React, { useState } from 'react';
import { debriefToMNA } from '../services/ai';
import { addNote } from '../stores/notesStore';
import { upsertTags } from '../stores/profileStore';
import { Events, track } from '../analytics/track';

function parseTags(text: string): string[] {
  const m = text.split('\n').find((l) => l.trim().startsWith('#tags'));
  if (!m) return [];
  const arr = m
    .replace(/^#tags\s*[:：]\s*/i, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.slice(0, 5);
}

export const DebriefMini: React.FC = () => {
  const [like, setLike] = useState('');
  const [pain, setPain] = useState('');
  const [next, setNext] = useState('');
  const [out, setOut] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGen = async () => {
    setLoading(true);
    try {
      const text = await debriefToMNA(like, pain, next);
      setOut(text);
      const tags = parseTags(text);
      if (tags.length) upsertTags(tags);
      track(Events.DebriefGen, { tags });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const md = `【看屋小結】\n喜歡：${like}\n困擾：${pain}\n下一步：${next}\n---\n${out ?? ''}`;
    addNote(md);
    track(Events.DebriefSave, {});
  };

  return (
    <div className="rounded-xl border border-[var(--mh-color-eeeeee)] bg-white p-3">
      <div className="mb-1.5 font-semibold">看屋後三問（Mini Debrief）</div>
      <div className="grid gap-2">
        <input
          value={like}
          onChange={(e) => setLike(e.target.value)}
          placeholder="第一直覺如何？（例：採光很好）"
          className="rounded-lg border border-[var(--mh-color-dddddd)] p-2"
        />
        <input
          value={pain}
          onChange={(e) => setPain(e.target.value)}
          placeholder="哪裡卡卡的？（例：廚房太小）"
          className="rounded-lg border border-[var(--mh-color-dddddd)] p-2"
        />
        <input
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="下一步想做什麼？（例：再看一間對比）"
          className="rounded-lg border border-[var(--mh-color-dddddd)] p-2"
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleGen}
          disabled={loading}
          className="rounded-lg border border-[var(--mh-color-1749d7)] bg-[var(--mh-color-1749d7)] px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '整理中…' : '生成 Must/Nice/Avoid + #tags'}
        </button>
        {out && (
          <button
            onClick={handleSave}
            className="rounded-lg border border-[var(--mh-color-1749d7)] bg-white px-3 py-2 text-[var(--mh-color-1749d7)]"
          >
            存到便條
          </button>
        )}
      </div>
      {out && <div className="mt-2.5 whitespace-pre-wrap text-[var(--mh-color-0a2246)]">{out}</div>}
    </div>
  );
};
