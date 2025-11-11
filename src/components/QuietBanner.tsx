import React from "react";
import { useQuietMode } from "../context/QuietModeContext";

const barStyle: React.CSSProperties = {
  width: "100%",
  background: "#0a2246",
  color: "white",
  fontSize: 14,
  lineHeight: "36px",
  height: 36,
  textAlign: "center",
  letterSpacing: "0.5px",
};
export const QuietBanner: React.FC = () => {
  const { state, clearQuiet, isActive } = useQuietMode();
  if (!isActive()) return null;

  const minutesLeft =
    state.untilTs ? Math.max(0, Math.ceil((state.untilTs - Date.now()) / 60000)) : null;
  const turnsLeft = state.remainingTurns ?? null;

  return (
    <div style={barStyle} role="status" aria-live="polite">
      <span>邁邁安靜陪你聊，不打擾 😊</span>
      {state.reason ? <span>｜{state.reason}</span> : null}
      {minutesLeft !== null ? <span>｜剩餘 {minutesLeft} 分</span> : null}
      {turnsLeft !== null ? <span>｜剩餘 {turnsLeft} 回合</span> : null}
      <button
        onClick={clearQuiet}
        aria-label="解除安靜模式"
        style={{ marginLeft: 12, padding: "2px 8px", borderRadius: 6, border: "1px solid #fff", background: "transparent", color: "#fff", cursor: "pointer" }}
      >
        解除
      </button>
    </div>
  );
};
