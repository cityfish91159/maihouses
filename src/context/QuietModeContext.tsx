import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Events, track } from "../analytics/track";

type QuietState = {
  isQuiet: boolean;
  reason?: string;         // e.g. "只聊天"/"壓力大"
  untilTs?: number | null; // 到期時間（毫秒）
  remainingTurns?: number | null; // 剩餘回合（預設 10）
};
type QuietAPI = {
  state: QuietState;
  startQuiet: (opts?: { minutes?: number; turns?: number; reason?: string }) => void;
  clearQuiet: () => void;
  decrementTurn: () => void;
  isActive: () => boolean;
};
const STORAGE_KEY = "mai-quiet-mode-v1";
const QuietModeContext = createContext<QuietAPI | null>(null);

function readStorage(): QuietState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { isQuiet: false, untilTs: null, remainingTurns: null };
    const parsed = JSON.parse(raw) as QuietState;
    return parsed;
  } catch {
    return { isQuiet: false, untilTs: null, remainingTurns: null };
  }
}
function writeStorage(s: QuietState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export const QuietModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 惰性初始化：讀取並清理過期狀態，避免 effect 中 setState
  const [state, setState] = useState<QuietState>(() => {
    const saved = readStorage();
    const now = Date.now();
    // 初始化時就清理過期狀態
    if (saved.isQuiet && saved.untilTs && now > saved.untilTs) {
      const cleared: QuietState = { isQuiet: false, untilTs: null, remainingTurns: null };
      writeStorage(cleared);
      return cleared;
    }
    return saved;
  });
  const tickRef = useRef<number | null>(null);

  const isActive = useCallback(() => {
    if (!state.isQuiet) return false;
    const now = Date.now();
    if (state.untilTs && now > state.untilTs) return false;
    if (state.remainingTurns !== null && (state.remainingTurns ?? 0) <= 0) return false;
    return true;
  }, [state]);

  // 心跳檢查（每 30 秒確認是否過期）
  useEffect(() => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      const now = Date.now();
      const saved = readStorage();
      if (saved.isQuiet && saved.untilTs && now > saved.untilTs) {
        setState({ isQuiet: false, untilTs: null, remainingTurns: null });
        writeStorage({ isQuiet: false, untilTs: null, remainingTurns: null });
      }
    }, 30000) as unknown as number;
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  const startQuiet = useCallback((opts?: { minutes?: number; turns?: number; reason?: string }) => {
    const minutes = opts?.minutes ?? null;
    const turns = opts?.turns ?? 10; // 預設 10 回合
    const reason = opts?.reason;
    const untilTs = minutes ? Date.now() + minutes * 60000 : null;
    const next: QuietState = {
      isQuiet: true,
      ...(reason && { reason }),
      untilTs,
      remainingTurns: turns,
    };
    setState(next);
    writeStorage(next);
    track(Events.QuietOn, { reason, minutes, turns });
  }, []);

  const clearQuiet = useCallback(() => {
    const next: QuietState = { isQuiet: false, untilTs: null, remainingTurns: null };
    setState(next);
    writeStorage(next);
    track(Events.QuietOff, {});
  }, []);

  const decrementTurn = useCallback(() => {
    setState(prev => {
      if (!prev.isQuiet) return prev;
      if (prev.remainingTurns === null) return prev;
      const left = Math.max(0, (prev.remainingTurns ?? 0) - 1);
      const next: QuietState = { ...prev, remainingTurns: left };
      writeStorage(next);
      if (left === 0) {
        const cleared: QuietState = { isQuiet: false, untilTs: null, remainingTurns: null };
        writeStorage(cleared);
        track(Events.QuietAutoOff, { reason: "turns_exhausted" });
        return cleared;
      }
      return next;
    });
  }, []);

  const value = useMemo<QuietAPI>(() => ({
    state,
    startQuiet,
    clearQuiet,
    decrementTurn,
    isActive,
  }), [state, startQuiet, clearQuiet, decrementTurn, isActive]);

  return (
    <QuietModeContext.Provider value={value}>
      {children}
    </QuietModeContext.Provider>
  );
};
export function useQuietMode() {
  const ctx = useContext(QuietModeContext);
  if (!ctx) throw new Error("useQuietMode must be used within QuietModeProvider");
  return ctx;
}
export function isQuietActiveFromStorage(): boolean {
  try {
    const raw = localStorage.getItem("mai-quiet-mode-v1");
    if (!raw) return false;
    const s = JSON.parse(raw) as QuietState;
    const now = Date.now();
    if (!s.isQuiet) return false;
    if (s.untilTs && now > s.untilTs) return false;
    if (s.remainingTurns !== null && (s.remainingTurns ?? 0) <= 0) return false;
    return true;
  } catch { return false; }
}
