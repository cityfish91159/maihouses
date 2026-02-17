import React, { useState } from 'react';
import { politeRewrite } from '../services/ai';
import { Events, track } from '../analytics/track';

export const PoliteRewrite: React.FC<{ onAdopt?: (text: string) => void }> = ({ onAdopt }) => {
  const [draft, setDraft] = useState('');
  const [audience, setAudience] = useState<'owner' | 'agent'>('agent');
  const [intent, setIntent] = useState<'view' | 'detail' | 'pet' | 'price'>('detail');
  const [v1, setV1] = useState<string | null>(null);
  const [v2, setV2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRewrite = async () => {
    const d = draft.trim();
    if (!d) return;
    setLoading(true);
    try {
      const out = await politeRewrite(d, { audience, intent });
      const m = out
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const a = m.find((x) => /^V1/.test(x)) || '';
      const b = m.find((x) => /^V2/.test(x)) || '';
      setV1(a.replace(/^V1[:：]\s?/, ''));
      setV2(b.replace(/^V2[:：]\s?/, ''));
      track(Events.RewriteGen, { audience, intent });
    } finally {
      setLoading(false);
    }
  };

  const adopt = (text: string) => {
    onAdopt?.(text);
    setSent(true);
    track(Events.RewriteAdopt, { audience, intent });
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="rounded-xl border border-[var(--mh-color-eeeeee)] bg-white p-3">
      <div className="mb-1.5 font-semibold">禮貌改寫小幫手</div>
      <div className="mb-2 flex flex-wrap gap-2">
        <label className="inline-flex items-center">
          對象
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as 'owner' | 'agent')}
            className="ml-1.5 rounded-lg border border-[var(--mh-color-dddddd)] p-1.5"
          >
            <option value="agent">仲介</option>
            <option value="owner">屋主</option>
          </select>
        </label>
        <label className="inline-flex items-center">
          目的
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as 'view' | 'detail' | 'pet' | 'price')}
            className="ml-1.5 rounded-lg border border-[var(--mh-color-dddddd)] p-1.5"
          >
            <option value="detail">詢問細節</option>
            <option value="view">預約看房</option>
            <option value="pet">可否養寵物</option>
            <option value="price">價格/議價</option>
          </select>
        </label>
      </div>
      <textarea
        rows={3}
        placeholder="貼上你想發的訊息（我會根據對象/目的幫你潤飾）"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full rounded-lg border border-[var(--mh-color-dddddd)] p-2"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={handleRewrite}
          disabled={loading}
          className="rounded-lg border border-[var(--mh-color-1749d7)] bg-[var(--mh-color-1749d7)] px-3 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? '生成中…' : '禮貌改寫'}
        </button>
      </div>
      {(v1 || v2) && (
        <div className="mt-2.5 grid gap-2">
          {v1 && (
            <div className="rounded-lg border border-[var(--mh-color-e6ecff)] p-2">
              <div className="mb-1 text-xs text-[var(--mh-color-6b7280)]">版本一</div>
              <div className="mb-1.5">{v1}</div>
              <button
                onClick={() => adopt(v1)}
                className="rounded-lg border border-[var(--mh-color-1749d7)] bg-white px-2.5 py-1.5 text-[var(--mh-color-1749d7)]"
              >
                採用（複製/送出）
              </button>
            </div>
          )}
          {v2 && (
            <div className="rounded-lg border border-[var(--mh-color-e6ecff)] p-2">
              <div className="mb-1 text-xs text-[var(--mh-color-6b7280)]">版本二</div>
              <div className="mb-1.5">{v2}</div>
              <button
                onClick={() => adopt(v2)}
                className="rounded-lg border border-[var(--mh-color-1749d7)] bg-white px-2.5 py-1.5 text-[var(--mh-color-1749d7)]"
              >
                採用（複製/送出）
              </button>
            </div>
          )}
          {sent && <div className="text-[var(--mh-color-16a34a)]">已準備好訊息，祝溝通順利 🤞</div>}
        </div>
      )}
    </div>
  );
};
