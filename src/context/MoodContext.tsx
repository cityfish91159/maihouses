import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Events, track } from "../analytics/track";
import { setLastMood } from "../stores/profileStore";
import { safeLocalStorage } from "../lib/safeStorage";

export type Mood = "neutral" | "stress" | "rest";
type MoodAPI = {
  mood: Mood;
  setMood: (m: Mood) => void;
  tone: "warm" | "soothe" | "light";
  throttleLevel: 0 | 1 | 2; // 2=最節流
};
const MoodContext = createContext<MoodAPI | null>(null);

export const MoodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mood, setMoodState] = useState<Mood>(() => {
    const raw = safeLocalStorage.getItem("mai-mood-v1");
    return (raw as Mood) || "neutral";
  });

  // 使用 useCallback 確保 setMood 引用穩定
  const setMood = useCallback((m: Mood) => {
    setMoodState(m);
    safeLocalStorage.setItem("mai-mood-v1", m);
    setLastMood(m);
    track(Events.MoodPick, { mood: m });
  }, []);

  // 將所有派生值計算移到 useMemo 內部，確保依賴完整
  const value = useMemo<MoodAPI>(() => {
    const tone: "warm" | "soothe" | "light" =
      mood === "stress" ? "soothe" : mood === "rest" ? "warm" : "light";
    const throttleLevel: 0 | 1 | 2 =
      mood === "stress" ? 2 : mood === "rest" ? 1 : 0;
    return { mood, setMood, tone, throttleLevel };
  }, [mood, setMood]);

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
};

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used within MoodProvider");
  return ctx;
}
