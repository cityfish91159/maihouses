import React, { useEffect, useMemo, useState } from "react";
import { getMilestoneHint, getWarmTags, ensureFirstSeen, isWarmbarDismissedToday, dismissWarmbarToday, loadProfile } from "../stores/profileStore";
import { Events, track } from "../analytics/track";

const barStyle: React.CSSProperties = {
  width: "100%",
  background: "#F5F8FF",
  color: "#0a2246",
  fontSize: 14,
  lineHeight: "34px",
  height: 34,
  textAlign: "center",
  letterSpacing: "0.3px",
  borderBottom: "1px solid #E6ECFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
};
const linkBtn: React.CSSProperties = {
  padding: "2px 10px",
  borderRadius: 999,
  border: "1px solid #1749D7",
  background: "#1749D7",
  color: "#fff",
  cursor: "pointer",
  lineHeight: "24px",
  height: 26,
};
const ghostBtn: React.CSSProperties = {
  padding: "2px 10px",
  borderRadius: 999,
  border: "1px solid #C9D5FF",
  background: "#fff",
  color: "#1749D7",
  cursor: "pointer",
  lineHeight: "24px",
  height: 26,
};

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
    <div style={barStyle} role="status" aria-live="polite">
      <span>{leftText}</span>
      <button style={linkBtn} onClick={onContinue}>接著聊</button>
      <button style={ghostBtn} onClick={onDismissToday}>今天不再顯示</button>
    </div>
  );
};
