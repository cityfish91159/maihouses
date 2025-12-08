import React, { useEffect, useState } from "react";
import { eli5Term } from "../services/ai";
import { Events, track } from "../analytics/track";

const KEYWORDS = ["持分", "使用分區", "公設比", "地上權", "都更", "容積率"];

export const ELI5Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [open, setOpen] = useState(false);
  const [ans, setAns] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchAns = async () => {
    if (ans) return;
    setLoading(true);
    try {
      const out = await eli5Term(text);
      setAns(out);
      track(Events.ELI5Open, { term: text });
    } finally {
      setLoading(false);
    }
  };

  // 每日一次的「主動建議」：遇到關鍵詞自動開啟
  useEffect(() => {
    const today = new Date().toISOString().slice(0,10);
    const k = `mai-eli5-suggest-${today}`;
    const shouldSuggest = KEYWORDS.some(w => text.includes(w)) && !localStorage.getItem(k);
    if (shouldSuggest) {
      localStorage.setItem(k, "1");
      setOpen(true);
      fetchAns();
    }
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) await fetchAns();
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", position: "relative" }}>
      <button aria-label="白話解釋" onClick={toggle} style={{ marginLeft: 6, width: 18, height: 18, borderRadius: 999, border: "1px solid #C9D5FF", background: "#F5F8FF", color: "#1749D7", fontSize: 12, cursor: "pointer" }}>?</button>
      {open && (
        <div style={{ position: "absolute", top: "120%", left: 0, background: "#fff", border: "1px solid #E6ECFF", borderRadius: 8, padding: 10, width: 280, boxShadow: "0 10px 24px rgba(0,0,0,0.08)", zIndex: 50 }}>
          <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>白話解釋（僅供參考，非法律意見）</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{loading ? "生成中…" : ans}</div>
        </div>
      )}
    </span>
  );
};
