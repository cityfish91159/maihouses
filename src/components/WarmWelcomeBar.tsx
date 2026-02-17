import { useEffect, useMemo, useState } from 'react';
import {
  getMilestoneHint,
  getWarmTags,
  ensureFirstSeen,
  isWarmbarDismissedToday,
  dismissWarmbarToday,
  loadProfile,
} from '../stores/profileStore';
import { Events, track } from '../analytics/track';

export const WarmWelcomeBar = () => {
  const [dismissed, setDismissed] = useState(false);
  const profile = useMemo(() => loadProfile(), []);
  const tags = useMemo(() => getWarmTags(3), []);
  const milestone = useMemo(() => getMilestoneHint(profile.milestones), [profile.milestones]);

  // 使用 useMemo 計算 shouldShow，避免在 effect 中 setState
  const shouldShow = useMemo(() => {
    if (dismissed) return false;
    if (typeof window === 'undefined') return false;
    const { isFirstVisit } = ensureFirstSeen();
    const hasContent = (tags && tags.length > 0) || !!milestone || !!profile.lastMood;
    return !isFirstVisit && !isWarmbarDismissedToday() && hasContent;
  }, [dismissed, tags, milestone, profile.lastMood]);

  // useEffect 只做追蹤，不設定狀態
  useEffect(() => {
    if (shouldShow) {
      track(Events.WarmbarView, {
        tags,
        milestone: !!milestone,
        lastMood: profile.lastMood,
      });
    }
  }, [shouldShow, tags, milestone, profile.lastMood]);

  if (!shouldShow) return null;

  const greetByMood = (m?: string) => {
    if (m === 'stress') return '最近辛苦了';
    if (m === 'rest') return '慢慢來就好';
    return '好久不見';
  };

  const tagText = tags && tags.length > 0 ? `上次你提到「${tags.join('・')}」` : null;
  const leftText = milestone
    ? milestone
    : tagText
      ? `${greetByMood(profile.lastMood)}，${tagText}`
      : `${greetByMood(profile.lastMood)}，這幾天過得怎麼樣`;

  const onContinue = () => {
    track(Events.WarmbarContinue, { tags, milestone: !!milestone });
    const seed = milestone
      ? '最近有點紀念日的感覺，想輕鬆聊聊。'
      : tags && tags.length > 0
        ? `還記得我們聊過 ${tags.join('、')}，你有新想法嗎？`
        : '想跟你聊聊近況～';
    window.dispatchEvent(new CustomEvent('mai:chat:start', { detail: { text: seed } }));
  };
  const onDismissToday = () => {
    dismissWarmbarToday();
    setDismissed(true);
    track(Events.WarmbarDismiss, {});
  };

  return (
    <div
      className="flex h-[34px] w-full items-center justify-center gap-3 border-b border-[var(--mh-color-e6ecff)] bg-[var(--mh-color-f5f8ff)] text-center text-sm leading-[34px] tracking-wide text-[var(--mh-color-0a2246)]"
      role="status"
      aria-live="polite"
    >
      <span>{leftText}</span>
      <button
        className="h-[26px] cursor-pointer rounded-full border border-[var(--mh-color-1749d7)] bg-[var(--mh-color-1749d7)] px-2.5 py-0.5 leading-6 text-white transition-colors hover:bg-[var(--mh-color-123cb3)]"
        onClick={onContinue}
      >
        接著聊
      </button>
      <button
        className="h-[26px] cursor-pointer rounded-full border border-[var(--mh-color-c9d5ff)] bg-white px-2.5 py-0.5 leading-6 text-[var(--mh-color-1749d7)] transition-colors hover:bg-gray-50"
        onClick={onDismissToday}
      >
        今天不再顯示
      </button>
    </div>
  );
};
