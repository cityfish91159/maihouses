import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MaiMaiBase } from '../components/MaiMai';
import MascotInteractive from '../components/MascotInteractive';
import type { MaiMaiMood, MaiMaiSize } from '../components/MaiMai';
import '../index.css';

const MOODS: MaiMaiMood[] = [
  'idle',
  'wave',
  'peek',
  'happy',
  'thinking',
  'excited',
  'confused',
  'celebrate',
  'shy',
  'sleep',
];
const SIZES: MaiMaiSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 text-sm font-semibold text-ink-700">
      <span className="w-28 text-ink-600">{label}</span>
      <div className="flex-1">{children}</div>
    </label>
  );
}

export function MaiMaiStoryApp() {
  const [mood, setMood] = useState<MaiMaiMood>('happy');
  const [size, setSize] = useState<MaiMaiSize>('md');
  const [animated, setAnimated] = useState(true);
  const [showEffects, setShowEffects] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isTypingEmail, setIsTypingEmail] = useState(false);
  const [isTypingPassword, setIsTypingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [messagesText, setMessagesText] = useState('嗨，我是邁邁！\n今天想聊什麼？');

  const messages = useMemo(
    () =>
      messagesText
        .split(/\n/)
        .map((m) => m.trim())
        .filter(Boolean),
    [messagesText]
  );

  const applyScenario = (preset: 'idle' | 'chatting' | 'success' | 'error') => {
    if (preset === 'idle') {
      setMood('idle');
      setIsLoading(false);
      setIsSuccess(false);
      setHasError(false);
      setIsTypingEmail(false);
      setIsTypingPassword(false);
      setMessagesText('嗨，我是邁邁！\n今天想聊什麼？');
    } else if (preset === 'chatting') {
      setMood('thinking');
      setIsLoading(true);
      setIsTypingEmail(true);
      setIsTypingPassword(false);
      setIsSuccess(false);
      setHasError(false);
      setMessagesText('我在幫你想答案...\n請稍等');
    } else if (preset === 'success') {
      setMood('celebrate');
      setIsLoading(false);
      setIsSuccess(true);
      setHasError(false);
      setMessagesText('搞定囉！🎉\n還有其他想問的嗎？');
    } else {
      setMood('shy');
      setIsLoading(false);
      setIsSuccess(false);
      setHasError(true);
      setMessagesText('抱歉，剛剛出現點小狀況\n再試一次或換個問題');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-ink-900">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
              MaiMai Storybook (lite)
            </p>
            <h1 className="text-2xl font-black text-brand-700">MaiMai 原子組件互動故事</h1>
            <p className="text-sm text-ink-600">
              調整 mood/size/狀態並觀察氣泡與 confetti 行為（多入口：maimai-story.html）。
            </p>
          </div>
          <div className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 shadow-sm">
            WASD: hover toggle
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <div className="space-y-3">
              <ControlRow label="Mood">
                <select
                  className="w-full rounded-lg border border-brand-100 px-2 py-1"
                  value={mood}
                  onChange={(e) => setMood(e.target.value as MaiMaiMood)}
                >
                  {MOODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </ControlRow>
              <ControlRow label="Size">
                <select
                  className="w-full rounded-lg border border-brand-100 px-2 py-1"
                  value={size}
                  onChange={(e) => setSize(e.target.value as MaiMaiSize)}
                >
                  {SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </ControlRow>
              <ControlRow label="Animated">
                <input
                  type="checkbox"
                  checked={animated}
                  onChange={(e) => setAnimated(e.target.checked)}
                />
              </ControlRow>
              <ControlRow label="Effects">
                <input
                  type="checkbox"
                  checked={showEffects}
                  onChange={(e) => setShowEffects(e.target.checked)}
                />
              </ControlRow>
              <ControlRow label="Hover state">
                <input
                  type="checkbox"
                  checked={isHovered}
                  onChange={(e) => setIsHovered(e.target.checked)}
                />
              </ControlRow>
              <ControlRow label="Typing email">
                <input
                  type="checkbox"
                  checked={isTypingEmail}
                  onChange={(e) => setIsTypingEmail(e.target.checked)}
                />
              </ControlRow>
              <ControlRow label="Typing password">
                <input
                  type="checkbox"
                  checked={isTypingPassword}
                  onChange={(e) => setIsTypingPassword(e.target.checked)}
                />
              </ControlRow>
              <ControlRow label="Loading">
                <input
                  type="checkbox"
                  checked={isLoading}
                  onChange={(e) => setIsLoading(e.target.checked)}
                />
              </ControlRow>
              <ControlRow label="Success">
                <input
                  type="checkbox"
                  checked={isSuccess}
                  onChange={(e) => setIsSuccess(e.target.checked)}
                />
              </ControlRow>
              <ControlRow label="Error">
                <input
                  type="checkbox"
                  checked={hasError}
                  onChange={(e) => setHasError(e.target.checked)}
                />
              </ControlRow>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-brand-700">
                <button
                  className="rounded-lg border border-brand-100 bg-brand-50 px-2 py-1 hover:bg-brand-100"
                  onClick={() => applyScenario('idle')}
                >
                  Idle
                </button>
                <button
                  className="rounded-lg border border-brand-100 bg-brand-50 px-2 py-1 hover:bg-brand-100"
                  onClick={() => applyScenario('chatting')}
                >
                  Typing / Thinking
                </button>
                <button
                  className="rounded-lg border border-brand-100 bg-brand-50 px-2 py-1 hover:bg-brand-100"
                  onClick={() => applyScenario('success')}
                >
                  Success + Confetti
                </button>
                <button
                  className="rounded-lg border border-brand-100 bg-brand-50 px-2 py-1 hover:bg-brand-100"
                  onClick={() => applyScenario('error')}
                >
                  Error state
                </button>
              </div>
              <div>
                <p className="mb-1 text-sm font-semibold text-ink-700">氣泡訊息 (每行一則)</p>
                <textarea
                  className="h-28 w-full rounded-lg border border-brand-100 px-2 py-1 text-sm"
                  value={messagesText}
                  onChange={(e) => setMessagesText(e.target.value)}
                  aria-label="氣泡訊息 (每行一則)"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-brand-700">MaiMaiBase</h2>
              <div className="flex justify-center">
                <MaiMaiBase
                  mood={mood}
                  size={size}
                  className="drop-shadow"
                  animated={animated}
                  showEffects={showEffects}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-brand-700">MascotInteractive</h2>
              <div className="flex justify-center">
                <MascotInteractive
                  mood={mood}
                  size={size === 'xs' ? 'sm' : size === 'xl' ? 'lg' : size}
                  className="drop-shadow"
                  messages={messages}
                  isTypingEmail={isTypingEmail}
                  isTypingPassword={isTypingPassword}
                  isLoading={isLoading}
                  isSuccess={isSuccess}
                  hasError={hasError}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<MaiMaiStoryApp />);
}
