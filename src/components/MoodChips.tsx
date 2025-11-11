import React from "react";
import { useMood } from "../context/MoodContext";

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  borderRadius: 999,
  border: active ? "1px solid #1749D7" : "1px solid #ddd",
  background: active ? "#EAF1FF" : "#fff",
  color: "#0a2246",
  cursor: "pointer",
});

// 移除固定右下角的心情選項（已整合到對話框內）
export const FloatingMoodChips: React.FC = () => {
  return null;
};
