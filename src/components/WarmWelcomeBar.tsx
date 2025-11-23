import React, { useEffect, useMemo, useState } from "react";
import { getMilestoneHint, getWarmTags, ensureFirstSeen, isWarmbarDismissedToday, dismissWarmbarToday, loadProfile } from "../stores/profileStore";
import { Events, track } from "../analytics/track";

export const WarmWelcomeBar: React.FC = () => {
  const [shouldShow, setShouldShow] = useState(false);
  const profile = loadProfile();
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
    <div className="w-full bg-[#F5F8FF] text-[#0a2246] text-sm leading-[34px] h-[34px] text-center tracking-wide border-b border-[#E6ECFF] flex items-center justify-center gap-3" role="status" aria-live="polite">
      <span>{leftText}</span>
      <button 
        className="px-2.5 py-0.5 rounded-full border border-[#1749D7] bg-[#1749D7] text-white cursor-pointer leading-6 h-[26px] hover:bg-[#123cb3] transition-colors"
        onClick={onContinue}
      >
        接著聊
      </button>
      <button 
        className="px-2.5 py-0.5 rounded-full border border-[#C9D5FF] bg-white text-[#1749D7] cursor-pointer leading-6 h-[26px] hover:bg-gray-50 transition-colors"
        onClick={onDismissToday}
      >
        今天不再顯示
      </button>
    </div>
  );
};
