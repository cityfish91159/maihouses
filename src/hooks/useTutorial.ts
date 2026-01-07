import { useState, useEffect, useCallback } from "react";
import { useMaiMai } from "../context/MaiMaiContext";
import { safeLocalStorage } from "../lib/safeStorage";
import { TUTORIAL_CONFIG } from "../constants/tutorial";
import debounce from "lodash.debounce";

interface TutorialStep {
  id: string;
  trigger: "mount" | "click" | "idle" | "success";
  mood:
    | "wave"
    | "thinking"
    | "excited"
    | "sleep"
    | "idle"
    | "happy"
    | "celebrate"
    | "confused"
    | "peek"
    | "shy";
  message: string;
  action?: () => void;
}

const TUTORIALS: TutorialStep[] = [
  {
    id: "welcome",
    trigger: "mount",
    mood: "wave",
    message: TUTORIAL_CONFIG.MESSAGES.WELCOME,
  },
  {
    id: "search",
    trigger: "click",
    mood: "thinking",
    message: TUTORIAL_CONFIG.MESSAGES.SEARCH_HINT,
  },
  {
    id: "uag",
    trigger: "click",
    mood: "excited",
    message: "UAG 雷達幫你找到最有意願的客戶！",
  },
  {
    id: "idle",
    trigger: "idle",
    mood: "sleep",
    message: TUTORIAL_CONFIG.MESSAGES.IDLE_WAKEUP,
  },
];

export function useTutorial() {
  const { setMood, addMessage } = useMaiMai();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Helper to safely set mood (Error Boundary)
  const safeSetMood = useCallback(
    (mood: TutorialStep["mood"], message: string) => {
      try {
        setMood(mood);
        addMessage(message);
      } catch (error) {
        console.error("[useTutorial] Failed to update MaiMai state", error);
      }
    },
    [setMood, addMessage],
  );

  // 首次訪問歡迎
  useEffect(() => {
    const visited = safeLocalStorage.getItem("maimai-visited");
    if (!visited && !hasShownWelcome) {
      const timer = setTimeout(() => {
        safeSetMood("wave", TUTORIAL_CONFIG.MESSAGES.WELCOME);
        safeLocalStorage.setItem("maimai-visited", "true");
        setHasShownWelcome(true);
      }, TUTORIAL_CONFIG.WELCOME_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [safeSetMood, hasShownWelcome]);

  // 閒置提醒（Debounced Performance Optimization）
  useEffect(() => {
    // Timeout handler
    const triggerIdle = () => {
      safeSetMood("sleep", TUTORIAL_CONFIG.MESSAGES.IDLE_WAKEUP);
    };

    // The actual timer reference
    let idleTimer: ReturnType<typeof setTimeout>;

    // Reset function
    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(triggerIdle, TUTORIAL_CONFIG.IDLE_TIMEOUT_MS);
    };

    // Debounce the event handler to prevent high-frequency calls
    const debouncedReset = debounce(resetTimer, 1000, {
      leading: true,
      trailing: false,
    });

    // Initial start
    resetTimer();

    // Attach listeners
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => document.addEventListener(e, debouncedReset));

    return () => {
      clearTimeout(idleTimer);
      debouncedReset.cancel();
      events.forEach((e) => document.removeEventListener(e, debouncedReset));
    };
  }, [safeSetMood]);

  // 提供手動觸發方法
  const showTutorial = useCallback(
    (id: string) => {
      const tutorial = TUTORIALS.find((t) => t.id === id);
      if (tutorial) {
        safeSetMood(tutorial.mood, tutorial.message);
        tutorial.action?.();
      }
    },
    [safeSetMood],
  );

  return { showTutorial };
}
