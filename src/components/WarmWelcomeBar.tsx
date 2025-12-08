import { useEffect, useMemo, useState } from "react";
import { getMilestoneHint, getWarmTags, ensureFirstSeen, isWarmbarDismissedToday, dismissWarmbarToday, loadProfile } from "../stores/profileStore";
import { Events, track } from "../analytics/track";

export const WarmWelcomeBar = () => {
  const [shouldShow, setShouldShow] = useState(false);
  const profile = useMemo(() => loadProfile(), []);
  const tags = useMemo(() => getWarmTags(3), []);
  const milestone = useMemo(() => getMilestoneHint(profile.milestones), [profile.milestones]);

  useEffect(() => {
    const { isFirstVisit } = ensureFirstSeen();
    const hasContent = (tags && tags.length > 0) || !!milestone || !!profile.lastMood;
    const ok = !isFirstVisit && !isWarmbarDismissedToday() && hasContent;
    setShouldShow(ok);
    if (ok) track(Events.WarmbarView, { tags, milestone: !!milestone, lastMood: profile.lastMood });
  }, [tags, milestone, profile.lastMood]);

  if (!shouldShow) return null;

  const greetByMood = (m?: string) => {
    if (m === "stress") return "最近辛苦了";
    if (m === "rest") return "慢慢來就好";
    return "好久不見";
  };

  const tagText = tags && tags.length > 0 ? `上次你提到「${tags.join("・")}」` : null;
  const leftText = milestone ? milestone : (tagText ? `${greetByMood(profile.lastMood)}，${tagText}` : `${greetByMood(profile.lastMood)}，這幾天過得怎麼樣`);

  const onContinue = () => {
    track(Events.WarmbarContinue, { tags, milestone: !!milestone });
    const seed = milestone
      ? "最近有點紀念日的感覺，想輕鬆聊聊。"
      : (tags && tags.length > 0 ? `還記得我們聊過 ${tags.join("、")}，你有新想法嗎？` : "想跟你聊聊近況～");
    window.dispatchEvent(new CustomEvent("mai:chat:start", { detail: { text: seed } }));
  };
  const onDismissToday = () => {
    dismissWarmbarToday();
    setShouldShow(false);
    track(Events.WarmbarDismiss, {});
  };

  return (
    <div className="flex h-[34px] w-full items-center justify-center gap-3 border-b border-[#E6ECFF] bg-[#F5F8FF] text-center text-sm leading-[34px] tracking-wide text-[#0a2246]" role="status" aria-live="polite">
      <span>{leftText}</span>
      <button 
        className="h-[26px] cursor-pointer rounded-full border border-[#1749D7] bg-[#1749D7] px-2.5 py-0.5 leading-6 text-white transition-colors hover:bg-[#123cb3]"
        onClick={onContinue}
      >
        接著聊
      </button>
      <button 
        className="h-[26px] cursor-pointer rounded-full border border-[#C9D5FF] bg-white px-2.5 py-0.5 leading-6 text-[#1749D7] transition-colors hover:bg-gray-50"
        onClick={onDismissToday}
      >
        今天不再顯示
      </button>
    </div>
  );
};
