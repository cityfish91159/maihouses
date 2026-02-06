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
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 12,
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6 }}>禮貌改寫小幫手</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <label>
          對象
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as 'owner' | 'agent')}
            style={{
              marginLeft: 6,
              padding: 6,
              borderRadius: 8,
              border: '1px solid #ddd',
            }}
          >
            <option value="agent">仲介</option>
            <option value="owner">屋主</option>
          </select>
        </label>
        <label>
          目的
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as 'view' | 'detail' | 'pet' | 'price')}
            style={{
              marginLeft: 6,
              padding: 6,
              borderRadius: 8,
              border: '1px solid #ddd',
            }}
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
        style={{
          width: '100%',
          padding: 8,
          borderRadius: 8,
          border: '1px solid #ddd',
        }}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={handleRewrite}
          disabled={loading}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: '#1749D7',
            color: '#fff',
            border: '1px solid #1749D7',
          }}
        >
          {loading ? '生成中…' : '禮貌改寫'}
        </button>
      </div>
      {(v1 || v2) && (
        <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
          {v1 && (
            <div
              style={{
                border: '1px solid #E6ECFF',
                borderRadius: 8,
                padding: 8,
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>版本一</div>
              <div style={{ marginBottom: 6 }}>{v1}</div>
              <button
                onClick={() => adopt(v1)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #1749D7',
                  background: '#fff',
                  color: '#1749D7',
                }}
              >
                採用（複製/送出）
              </button>
            </div>
          )}
          {v2 && (
            <div
              style={{
                border: '1px solid #E6ECFF',
                borderRadius: 8,
                padding: 8,
              }}
            >
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>版本二</div>
              <div style={{ marginBottom: 6 }}>{v2}</div>
              <button
                onClick={() => adopt(v2)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #1749D7',
                  background: '#fff',
                  color: '#1749D7',
                }}
              >
                採用（複製/送出）
              </button>
            </div>
          )}
          {sent && <div style={{ color: '#16a34a' }}>已準備好訊息，祝溝通順利 🤞</div>}
        </div>
      )}
    </div>
  );
};
