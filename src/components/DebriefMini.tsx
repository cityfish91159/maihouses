import React, { useState } from "react";
import { debriefToMNA } from "../services/ai";
import { addNote } from "../stores/notesStore";
import { upsertTags } from "../stores/profileStore";
import { Events, track } from "../analytics/track";

function parseTags(text: string): string[] {
  const m = text.split("\n").find(l => l.trim().startsWith("#tags"));
  if (!m) return [];
  const arr = m.replace(/^#tags\s*[:：]\s*/i, "").split(",").map(s => s.trim()).filter(Boolean);
  return arr.slice(0, 5);
}

export const DebriefMini: React.FC = () => {
  const [like, setLike] = useState("");
  const [pain, setPain] = useState("");
  const [next, setNext] = useState("");
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
    const md = `【看屋小結】\n喜歡：${like}\n困擾：${pain}\n下一步：${next}\n---\n${out ?? ""}`;
    addNote(md);
    track(Events.DebriefSave, {});
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff" }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>看屋後三問（Mini Debrief）</div>
      <div style={{ display: "grid", gap: 8 }}>
        <input value={like} onChange={e => setLike(e.target.value)} placeholder="第一直覺如何？（例：採光很好）" style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }} />
        <input value={pain} onChange={e => setPain(e.target.value)} placeholder="哪裡卡卡的？（例：廚房太小）" style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }} />
        <input value={next} onChange={e => setNext(e.target.value)} placeholder="下一步想做什麼？（例：再看一間對比）" style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }} />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={handleGen} disabled={loading} style={{ padding: "8px 12px", borderRadius: 8, background: "#1749D7", color: "#fff", border: "1px solid #1749D7" }}>
          {loading ? "整理中…" : "生成 Must/Nice/Avoid + #tags"}
        </button>
        {out && <button onClick={handleSave} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #1749D7", background: "#fff", color: "#1749D7" }}>存到便條</button>}
      </div>
      {out && <div style={{ marginTop: 10, whiteSpace: "pre-wrap", color: "#0a2246" }}>{out}</div>}
    </div>
  );
};
