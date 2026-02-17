import React, { useEffect, useState, useCallback, useRef } from 'react';
import { eli5Term } from '../services/ai';
import { Events, track } from '../analytics/track';
import { safeLocalStorage } from '../lib/safeStorage';

const KEYWORDS = ['持分', '使用分區', '公設比', '地上權', '都更', '容積率'];

export const ELI5Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);
  const [ans, setAns] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const hasSuggestedRef = useRef(false);

  const fetchAns = useCallback(async () => {
    if (ans) return;
    setLoading(true);
    try {
      const out = await eli5Term(text);
      setAns(out);
      track(Events.ELI5Open, { term: text });
    } finally {
      setLoading(false);
    }
  }, [ans, text]);

  // 每日一次的「主動建議」：遇到關鍵詞自動開啟
  useEffect(() => {
    if (hasSuggestedRef.current) return;

    const today = new Date().toISOString().slice(0, 10);
    const k = `mai-eli5-suggest-${today}`;
    const shouldSuggest = KEYWORDS.some((w) => text.includes(w)) && !safeLocalStorage.getItem(k);
    if (shouldSuggest) {
      hasSuggestedRef.current = true;
      safeLocalStorage.setItem(k, '1');
      setOpen(true);
      fetchAns();
    }
  }, [text, fetchAns]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await fetchAns();
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        aria-label="白話解釋"
        onClick={toggle}
        className="ml-1.5 size-[18px] cursor-pointer rounded-full border border-[var(--mh-color-c9d5ff)] bg-[var(--mh-color-f5f8ff)] text-xs text-[var(--mh-color-1749d7)]"
      >
        ?
      </button>
      {open && (
        <div className="absolute left-0 top-[120%] z-50 w-[280px] rounded-lg border border-[var(--mh-color-e6ecff)] bg-white p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
          <div className="mb-1.5 text-xs text-[var(--mh-color-6b7280)]">
            白話解釋（僅供參考，非法律意見）
          </div>
          <div className="whitespace-pre-wrap">{loading ? '生成中…' : ans}</div>
        </div>
      )}
    </span>
  );
};
