import { useEffect, useState } from 'react';
import type { AppConfig, RuntimeOverrides } from './config';
import { getSessionId, getMeta } from '../services/api';
import { safeLocalStorage } from '../lib/safeStorage';

export default function DevTools({ config }: { config: AppConfig & RuntimeOverrides }) {
  const [visible, setVisible] = useState(true);
  const [mock, setMock] = useState(!!config.mock);
  const [latency, setLatency] = useState(config.latency ?? 0);
  const [error, setError] = useState(config.error ?? 0);
  const [q, setQ] = useState(config.q ?? '');
  const [backend, setBackend] = useState('—');
  const [mockSeed, setMockSeed] = useState(config.mockSeed ?? '');

  useEffect(() => {
    getMeta().then((r) => setBackend(r.ok && r.data ? r.data.backendVersion : '—'));
  }, []);

  if (!visible) return null;

  const apply = () => {
    const next = {
      ...config,
      mock,
      latency,
      error,
      q,
      mockSeed,
      devtools: '1' as const,
    };
    try {
      safeLocalStorage.setItem('maihouse_config', JSON.stringify(next));
    } catch {}
    location.reload();
  };

  const reseed = () => {
    const s = String(Date.now());
    setMockSeed(s);
    try {
      safeLocalStorage.setItem(
        'maihouse_config',
        JSON.stringify({
          ...config,
          mockSeed: s,
          mock,
          latency,
          error,
          q,
          devtools: '1' as const,
        })
      );
    } catch {}
    location.reload();
  };

  return (
    <aside className="fixed bottom-4 right-4 z-[var(--z-overlay)] w-[320px] rounded-[var(--r-lg)] bg-white p-4 text-sm shadow-[var(--shadow-card)]">
      <div className="mb-2 font-medium">Developer HUD</div>
      <div className="space-y-1 text-[var(--text-secondary)]">
        <div>API：{config.apiBaseUrl}</div>
        <div>App：{config.appVersion}</div>
        <div>Backend：{backend}</div>
        <div>Session：{getSessionId()}</div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={mock} onChange={(e) => setMock(e.target.checked)} /> Mock
        </label>
        <label className="flex items-center gap-2">
          Latency
          <input
            className="w-20 rounded border p-1"
            type="number"
            value={latency}
            onChange={(e) => setLatency(+e.target.value || 0)}
          />
        </label>
        <label className="flex items-center gap-2">
          Error
          <input
            className="w-20 rounded border p-1"
            step="0.1"
            type="number"
            value={error}
            onChange={(e) => setError(+e.target.value || 0)}
          />
        </label>
        <label className="flex items-center gap-2">
          q{' '}
          <input
            className="flex-1 rounded border p-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2">
          seed
          <input
            className="flex-1 rounded border p-1"
            value={mockSeed}
            onChange={(e) => setMockSeed(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex justify-between">
        <button
          className="rounded-[var(--r-pill)] bg-[var(--neutral-100)] px-3 py-1"
          onClick={() => setVisible(false)}
        >
          關閉
        </button>
        <div className="flex gap-2">
          <button
            className="rounded-[var(--r-pill)] bg-[var(--neutral-300)] px-3 py-1"
            onClick={reseed}
          >
            🎲 換數據
          </button>
          <button
            className="rounded-[var(--r-pill)] bg-[var(--brand)] px-3 py-1 text-[var(--brand-fg)]"
            onClick={apply}
          >
            更新
          </button>
        </div>
      </div>
    </aside>
  );
}
